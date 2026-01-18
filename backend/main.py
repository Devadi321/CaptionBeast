import os
import shutil
import uuid
import math
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException
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
    font = "Impact"
    
    # Calculate more dynamic font size based on video width
    # Standard Shorts width is 1080. 
    # Let's aim for ~13% of width for font height? (Big & Bold)
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

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Process video
    try:
        output_filename = f"processed_{filename}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # 1. Transcribe
        print(f"Transcribing {file_path}...")
        result = model.transcribe(file_path, word_timestamps=True)
        segments = result.get('segments', [])
        
        # 2. Process Video
        print("Loading Video...")
        video = VideoFileClip(file_path)
        
        caption_clips = []
        
        # Flatten word timestamps
        words = []
        for segment in segments:
            for word in segment.get('words', []):
                words.append(word)
        
        print(f"Generating {len(words)} caption clips...")
        
        for word_data in words:
            word = word_data['word'].strip()
            start = word_data['start']
            end = word_data['end']
            
            if not word:
                continue
            
            # Smart Color Logic
            # Highlight 'important' words (longer than 4 chars) or purely random for variety
            # Hormozi style: Green (#00FF00) or Yellow (#FFFF00)
            color = 'white'
            if len(word) > 4:
                # 60% chance to highlight long words
                if random.random() > 0.4:
                    color = '#00FF00' # Bright Green
            elif random.random() > 0.8: # Occasional highlight for short words
                 color = '#FFFF00' # Bright Yellow
                
            # Create clip
            clip = create_caption_clip(word, start, end, video.w, video.h, highlight_color=color)
            caption_clips.append(clip)
            
        print("Compositing video...")
        final_video = CompositeVideoClip([video] + caption_clips)
        
        # Write output
        final_video.write_videofile(
            output_path, 
            codec='libx264', 
            audio_codec='aac',
            temp_audiofile=os.path.join(OUTPUT_DIR, "temp-audio.m4a"),
            remove_temp=True,
            fps=video.fps or 24
        )
        
        return {"status": "success", "video_url": f"/download/{output_filename}"}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_video(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    # Use PORT from environment variable (Render/HF Spaces set this automatically)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
