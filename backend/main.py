import os
import shutil
import uuid
import math
import random
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn

import whisper
from moviepy import VideoFileClip, TextClip, CompositeVideoClip, ColorClip, TextClip

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

def create_caption_clip(text, start_time, end_time, video_width, video_height, highlight_color='white'):
    """
    Creates a TextClip for a single word/phrase.
    Refines style to look more 'Hormozi' like:
    - Font: Impact
    - All Caps
    - Thicker Storke
    - Conditional Colors
    """
    font = "Impact"
    if os.name == 'posix': # Linux/Mac
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
            if f.startswith("/") and os.path.exists(f):
                font = f
                break
    
    # Check for our downloaded Anton font (Hugging Face / Docker specific)
    anton_path = "/usr/share/fonts/truetype/google-fonts/Anton-Regular.ttf"
    if os.path.exists(anton_path):
        font = anton_path
            
    fontsize = int(video_width * 0.13) if video_width else 120
    if fontsize < 90: fontsize = 90 # Minimum size
    
    txt_clip = TextClip(
        text=text.upper(), 
        font_size=fontsize,
        color=highlight_color, 
        stroke_color='black',
        stroke_width=6, 
        font=font,
        method='caption',
        size=(video_width, int(fontsize * 2)), 
        text_align='center', 
        horizontal_align='center',
        vertical_align='center'
    )
    
    txt_clip = txt_clip.with_position('center').with_start(start_time).with_end(end_time)
    
    return txt_clip

# --- AD-SUPPORTED (FREE) LOGIC ---
# Removed: Supabase, Stripe, CheckCredits, DeterCredits
# This backend is now fully open.

# In-memory job store
jobs = {}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# Import segmentation logic
from segmentation import analyze_transcript_with_llm, find_timestamps_for_clip

def process_video_task(job_id: str, file_path: str, filename: str, user_id: str = None):
    print(f"[{job_id}] Processing started for {filename}...")
    jobs[job_id]["status"] = "processing"
    
    try:
        # Create job-specific output folder
        job_output_dir = os.path.join(OUTPUT_DIR, job_id)
        os.makedirs(job_output_dir, exist_ok=True)
        
        # 1. Transcribe
        print(f"[{job_id}] Transcribing...")
        result = model.transcribe(file_path, word_timestamps=True)
        segments = result.get('segments', [])
        full_text = result.get('text', "")
        
        # Flatten words
        words = []
        for segment in segments:
            for word in segment.get('words', []):
                words.append(word)

        # 2. Smart Segmentation (Ollama)
        print(f"[{job_id}] Analyzing for viral clips...")
        start_clips_processing = False
        potential_clips = analyze_transcript_with_llm(full_text)
        
        processed_clips = []
        
        if not potential_clips:
            print(f"[{job_id}] No AI clips found. Fallback: Generate one full clip.")
            # Create a 'fake' clip entry for the whole video
            potential_clips = [{
                "start_text": words[0]['word'],
                "end_text": words[-1]['word'],
                "reason": "Full video (AI segmentation failed or not connected)",
                "score": 0
            }]

        # 3. Process Each Clip
        print(f"[{job_id}] Loading Video...")
        video = VideoFileClip(file_path)
        
        for i, clip_data in enumerate(potential_clips):
            print(f"[{job_id}] Generating Clip {i+1}...")
            
            # Find Start/End Timestamps
            if "start_time" in clip_data:
                # If LLM returned times directly (future proofing)
                start_t = clip_data["start_time"]
                end_t = clip_data["end_time"]
            else:
                # Fuzzy match text
                s_text = clip_data.get("start_text", "")
                e_text = clip_data.get("end_text", "")
                start_t, end_t = find_timestamps_for_clip(words, s_text, e_text)
            
            # Fallbacks: If parsing fails, default to 0-60s or full length
            if start_t == 0.0 and end_t == 0.0:
                print(f"[{job_id}] Could not match text for Clip {i+1}. Using fallback.")
                start_t = 0
                end_t = min(video.duration, 60) # Default to first 60s
            
            # Filter words for this clip
            clip_words = [w for w in words if w['start'] >= start_t and w['end'] <= end_t]
            
            # Create Caption Clips
            caption_clips = []
            for word_data in clip_words:
                word = word_data['word'].strip()
                ws = word_data['start']
                we = word_data['end']
                
                # Adjust timestamps relative to clip start
                # IMPORTANT: TextClip needs absolute time in the final composite context, 
                # but if we subclip the video, the video starts at 0.
                # EASIER METHOD: Subclip video first, then shift word timestamps by -start_t
                
                if not word: continue
                
                color = 'white'
                if len(word) > 4:
                    if random.random() > 0.4: color = '#00FF00'
                elif random.random() > 0.8: color = '#FFFF00'
                    
                # Create clip with adjusted time
                # We will composite on top of the subclip, so times must be 0-based relative to subclip
                clip = create_caption_clip(word, ws - start_t, we - start_t, video.w, video.h, highlight_color=color)
                caption_clips.append(clip)

            # Subclip the main video
            # Make sure end_t doesn't exceed duration
            end_t = min(end_t, video.duration)
            if start_t >= end_t: start_t = 0 # Safety
            
            video_sub = video.subclipped(start_t, end_t)
            
            # Composite
            final_clip = CompositeVideoClip([video_sub] + caption_clips)
            
            output_filename = f"clip_{i}_{job_id}.mp4"
            output_fullpath = os.path.join(job_output_dir, output_filename)
            
            final_clip.write_videofile(
                output_fullpath, 
                codec='libx264', 
                audio_codec='aac',
                temp_audiofile=os.path.join(job_output_dir, f"temp-{i}.m4a"),
                remove_temp=True,
                fps=video.fps or 24
            )
            
            processed_clips.append({
                "url": f"/download/{job_id}/{output_filename}",
                "reason": clip_data.get("reason", "Generated Clip"),
                "score": clip_data.get("score", 0),
                "duration": end_t - start_t
            })

        jobs[job_id]["clips"] = processed_clips
        jobs[job_id]["status"] = "completed"
        print(f"[{job_id}] Done! Generated {len(processed_clips)} clips.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)

@app.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    user_id: str = Form(None) 
):
    # Free Mode: Accept all uploads
    print(f"Received upload from {user_id or 'Anonymous'}")

    job_id = str(uuid.uuid4())
    filename = f"{job_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    jobs[job_id] = {"status": "queued", "video_url": "", "error": None}
    background_tasks.add_task(process_video_task, job_id, file_path, filename, user_id)
    
    return {"job_id": job_id, "status": "queued"}

@app.get("/")
def home():
    return {"message": "CaptionBeast Backend (Free Mode) is Running!", "status": "active"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
