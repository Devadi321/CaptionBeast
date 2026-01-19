import os
import shutil
import uuid
import math
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn

import whisper
from moviepy import VideoFileClip, TextClip, CompositeVideoClip, ColorClip, TextClip
# from moviepy.common import FailedMoviePyError # invalid in 2.x


# Define directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI()

# Mount StaticFiles for robust video serving (Supports Range headers for playback)
app.mount("/download", StaticFiles(directory=OUTPUT_DIR), name="download")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model globally to avoid reloading on every request
# 'base' is a good trade-off for speed/accuracy. 'tiny' is faster, 'small' is better.
# For free tier (512MB RAM), we MUST use 'tiny' or it will OOM crash.
print("Loading Whisper model...")
model = whisper.load_model("tiny")
print("Whisper model loaded.")

import random

# ... imports ...

def create_caption_clip(text, start_time, end_time, video_width, video_height, highlight_color='white'):
    """
    Creates a TextClip for a single word/phrase.
    Refines style to look more 'Hormozi' like:
    - Font: Impact
    - All Caps
    - Thicker Storke
    - Conditional Colors
    """
    # MoviePy 2.x changes: TextClip.list('font') might not work or return different results.
    # We will just stick to a standard font.
    # Font selection: Try to match "Impact" or fall back to system defaults
    # On macOS, ImageMagick/MoviePy sometimes struggles with just "Impact"
    font = "Impact"
    if os.name == 'posix': # Linux/Mac
        # Common locations for fonts
        potential_fonts = [
            "Impact", 
            "/Library/Fonts/Impact.ttf", 
            "/System/Library/Fonts/Impact.ttf", 
            "/usr/share/fonts/truetype/msttcorefonts/Impact.ttf",
            "Arial-Bold",
            "/Library/Fonts/Arial Bold.ttf",
            "Helvetica-Bold"
        ]
        for f in potential_fonts:
            # Simple check if file exists (if path) or assume name is valid
            if f.startswith("/") and os.path.exists(f):
                font = f
                break
    
    # Check for our downloaded Anton font (Hugging Face / Docker specific)
    anton_path = "/usr/share/fonts/truetype/google-fonts/Anton-Regular.ttf"
    if os.path.exists(anton_path):
        font = anton_path
            
    # Calculate more dynamic font size based on video width
    fontsize = int(video_width * 0.13) if video_width else 120
    if fontsize < 90: fontsize = 90 # Minimum size
    
    # Use method='caption' with a fixed width AND fixed height to prevent clipping.
    # We make the height 2x the font size to give plenty of room.
    txt_clip = TextClip(
        text=text.upper(), # Force UPPERCASE
        font_size=fontsize,
        color=highlight_color, 
        stroke_color='black',
        stroke_width=6, # Very thick stroke
        font=font,
        method='caption',
        size=(video_width, int(fontsize * 2)), 
        text_align='center', 
        horizontal_align='center',
        vertical_align='center'
    )
    
    # Position: center.
    txt_clip = txt_clip.with_position('center').with_start(start_time).with_end(end_time)
    
    return txt_clip

from config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from supabase import create_client, Client

# Initialize Supabase (Service Role for Admin Access)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# In-memory job store
jobs = {}

def check_credits(user_id: str) -> bool:
    """
    Check if user has credits.
    Returns: True if allowed, False if denied.
    """
    if not user_id: return False
    
    try:
        # Check user profile
        response = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
        
        # If no profile, create one (Free Tier default)
        if not response.data:
            print(f"Creating new profile for {user_id}")
            supabase.table("profiles").insert({
                "user_id": user_id, 
                "email": "unknown@example.com", # We don't have email from token yet, handled later
                "tier": "free",
                "credits": 3
            }).execute()
            return True
            
        profile = response.data[0]
        credits = profile.get("credits", 0)
        tier = profile.get("tier", "free")
        
        print(f"User {user_id}: Tier={tier}, Credits={credits}")
        
        if tier == "free" and credits <= 0:
            return False
            
        return True
        
    except Exception as e:
        print(f"Database Error: {e}")
        # FAIL SAFE: If DB is down or table missing, Allow it for now to avoid blocking
        # But log the error.
        return True

def deduct_credit(user_id: str):
    try:
        # Deduct 1 credit for free users
        # For efficiency, we can do this async or here.
        # We assume check was done.
        # We need to explicitly decrement.
        # Note: RPC is better for atomic updates but this is MVP.
        
        response = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
        if response.data:
             current = response.data[0].get("credits", 0)
             if current > 0:
                 supabase.table("profiles").update({"credits": current - 1}).eq("user_id", user_id).execute()
                 print(f"Deducted credit for {user_id}. Remaining: {current - 1}")
    except Exception as e:
        print(f"Deduct Credit Error: {e}")


def process_video_task(job_id: str, file_path: str, filename: str, user_id: str = None):
    print(f"[{job_id}] Processing started for {filename}...")
    jobs[job_id]["status"] = "processing"
    
    # Optional: Deduct credit HERE if successful, 
    # OR deduct before starting. Let's deduct here to be nice if it fails.
    if user_id:
        deduct_credit(user_id)
        
    try:
        # Use a safe, sanitized filename for the output to prevent URL encoding issues
        # We ignore the original filename for the output file
        output_filename = f"processed_{job_id}.mp4"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # 1. Transcribe
        print(f"[{job_id}] Transcribing...")
        result = model.transcribe(file_path, word_timestamps=True)
        segments = result.get('segments', [])
        
        # 2. Process Video
        print(f"[{job_id}] Loading Video...")
        video = VideoFileClip(file_path)
        
        caption_clips = []
        words = []
        for segment in segments:
            for word in segment.get('words', []):
                words.append(word)
        
        print(f"[{job_id}] Generating {len(words)} caption clips...")
        
        for word_data in words:
            word = word_data['word'].strip()
            start = word_data['start']
            end = word_data['end']
            
            if not word: continue
            
            # Smart Color Logic
            color = 'white'
            if len(word) > 4:
                if random.random() > 0.4: color = '#00FF00'
            elif random.random() > 0.8: color = '#FFFF00'
                
            clip = create_caption_clip(word, start, end, video.w, video.h, highlight_color=color)
            caption_clips.append(clip)
            
        print(f"[{job_id}] Compositing...")
        final_video = CompositeVideoClip([video] + caption_clips)
        
        final_video.write_videofile(
            output_path, 
            codec='libx264', 
            audio_codec='aac',
            temp_audiofile=os.path.join(OUTPUT_DIR, f"temp-{job_id}.m4a"),
            remove_temp=True,
            fps=video.fps or 24
        )
        
        jobs[job_id]["video_url"] = f"/download/{output_filename}"
        jobs[job_id]["status"] = "completed"
        print(f"[{job_id}] Done!")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)

@app.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    user_id: str = Form(None) # Receive user_id from frontend
):
    # Credit Check
    if user_id:
        allowed = check_credits(user_id)
        if not allowed:
             raise HTTPException(status_code=402, detail="Out of credits. Upgrade to Pro!")
    else:
        # If no user_id provided (legacy/dev), we allow it for now or block.
        # For V3.0, we block.
        # raise HTTPException(status_code=401, detail="Authentication required.")
        pass # Allow for dev testing

    job_id = str(uuid.uuid4())
    filename = f"{job_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    jobs[job_id] = {"status": "queued", "video_url": "", "error": None}
    background_tasks.add_task(process_video_task, job_id, file_path, filename, user_id)
    
    return {"job_id": job_id, "status": "queued"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# Removed manual /download endpoint as it is now handled by StaticFiles mount

@app.get("/")
def home():
    return {"message": "CaptionBeast Backend is Running!", "status": "active"}

if __name__ == "__main__":
    # Use PORT from environment variable or default to 7860 (HF default)
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
