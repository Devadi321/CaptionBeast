import os
import shutil
import uuid
import math
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
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

# In-memory job store
jobs = {}

def process_video_task(job_id: str, file_path: str, filename: str):
    print(f"[{job_id}] Processing started for {filename}...")
    jobs[job_id]["status"] = "processing"
    
    try:
        output_filename = f"processed_{filename}"
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
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    filename = f"{job_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    jobs[job_id] = {"status": "queued", "video_url": "", "error": None}
    background_tasks.add_task(process_video_task, job_id, file_path, filename)
    
    return {"job_id": job_id, "status": "queued"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/download/{filename}")
async def download_video(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/")
def home():
    return {"message": "CaptionBeast Backend is Running!", "status": "active"}

if __name__ == "__main__":
    # Use PORT from environment variable or default to 7860 (HF default)
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
