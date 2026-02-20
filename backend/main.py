import os
import re
import shutil
import uuid
import math
import random
import threading
from typing import List
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn

import sqlite3
import hashlib

import whisper
from moviepy import VideoFileClip, TextClip, CompositeVideoClip

# Define directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
DB_PATH = os.path.join(BASE_DIR, "credits.db")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Initialize Database
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE,
        email TEXT,
        credits INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    # Transactions table
    c.execute('''CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        amount INTEGER,
        type TEXT,
        promo_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    # Promo codes table
    c.execute('''CREATE TABLE IF NOT EXISTS promo_codes (
        code TEXT PRIMARY KEY,
        credits INTEGER,
        uses_left INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.commit()
    conn.close()

init_db()

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

# Lazy-load Whisper so cloud health checks can pass before model init.
_whisper_model = None
_whisper_model_lock = threading.Lock()


def get_whisper_model():
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model

    with _whisper_model_lock:
        if _whisper_model is None:
            print("Loading Whisper model...")
            _whisper_model = whisper.load_model("tiny")
            print("Whisper model loaded.")
    return _whisper_model

# Credit System Functions
def get_user_credits(user_id: str) -> int:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT credits FROM users WHERE user_id = ?", (user_id,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else 3

def deduct_credits(user_id: str, amount: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT credits FROM users WHERE user_id = ?", (user_id,))
    result = c.fetchone()
    if not result or result[0] < amount:
        conn.close()
        return False
    c.execute("UPDATE users SET credits = credits - ? WHERE user_id = ?", (amount, user_id))
    c.execute("INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, 'usage')", (user_id, -amount))
    conn.commit()
    conn.close()
    return True

def add_credits(user_id: str, amount: int, promo_code: str = None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO users (user_id, credits) VALUES (?, 0)", (user_id,))
    c.execute("UPDATE users SET credits = credits + ? WHERE user_id = ?", (amount, user_id))
    c.execute("INSERT INTO transactions (user_id, amount, type, promo_code) VALUES (?, ?, 'purchase', ?)", (user_id, amount, promo_code or 'contra'))
    conn.commit()
    conn.close()

def create_user(user_id: str, email: str = None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO users (user_id, email, credits) VALUES (?, ?, 3)", (user_id, email or f"{user_id}@local"))
    conn.commit()
    conn.close()


def _caption_font():
    """Pick an available heavy font for short-form captions."""
    candidates = [
        "/Library/Fonts/Impact.ttf",
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/usr/share/fonts/truetype/msttcorefonts/Impact.ttf",
        "/usr/share/fonts/truetype/google-fonts/Anton-Regular.ttf",
        "Impact",
        "Arial-Bold",
    ]
    for candidate in candidates:
        if candidate.startswith("/") and os.path.exists(candidate):
            return candidate
        if not candidate.startswith("/"):
            return candidate
    return "Arial-Bold"


def _sanitize_word(word_data):
    raw = str(word_data.get("word", "")).strip()
    if not raw:
        return ""
    # Keep apostrophes for contractions, remove noise punctuation for punchy caption look.
    cleaned = re.sub(r"[^A-Za-z0-9']+", "", raw)
    if not cleaned:
        cleaned = raw
    return cleaned.upper()


def create_word_by_word_clips(words, video_w, video_h, font, fontsize):
    """Render one spoken word at a time, slightly below center."""
    if not words:
        return []

    clips = []
    # Slightly below center (requested): around 58% of frame height.
    anchor_y = int(video_h * 0.58)

    palette = [
        "#00F530",  # neon green
        "#22D3EE",  # cyan
        "#FACC15",  # yellow
        "#FB923C",  # orange
        "#F472B6",  # pink
    ]

    try:
        for word_data in words:
            word = _sanitize_word(word_data)
            if not word:
                continue

            start_t = float(word_data.get("start", 0.0))
            end_t = float(word_data.get("end", start_t + 0.08))
            duration = max(0.08, end_t - start_t)

            # Add vertical padding to prevent descenders/strokes getting clipped.
            padded_word = f"\n{word}\n"

            probe = TextClip(
                text=padded_word,
                font=font,
                font_size=fontsize,
                color="#00F530",
                stroke_color="black",
                stroke_width=10,
                method="label",
            )

            x = max(10, (video_w - probe.w) / 2)
            y = max(20, anchor_y - int(probe.h / 2) + int(fontsize * 0.16))

            # Deep downside shadow/extrusion for punch.
            shadow_back = TextClip(
                text=padded_word,
                font=font,
                font_size=fontsize,
                color="black",
                stroke_color="black",
                stroke_width=10,
                method="label",
            ).with_position((x + 2, y + 10)).with_start(start_t).with_duration(duration)

            shadow_mid = TextClip(
                text=padded_word,
                font=font,
                font_size=fontsize,
                color="black",
                stroke_color="black",
                stroke_width=10,
                method="label",
            ).with_position((x + 1, y + 6)).with_start(start_t).with_duration(duration)

            color_idx = (len(word) + int(start_t * 10)) % len(palette)
            main = TextClip(
                text=padded_word,
                font=font,
                font_size=fontsize,
                color=palette[color_idx],
                stroke_color="black",
                stroke_width=10,
                method="label",
            ).with_position((x, y)).with_start(start_t).with_duration(duration)

            clips.extend([shadow_back, shadow_mid, main])
    except Exception as e:
        print(f"Caption render error: {e}")
        return []

    return clips

# --- CREDIT SYSTEM API ---

@app.get("/credits/{user_id}")
async def get_credits(user_id: str):
    """Get user credits"""
    credits = get_user_credits(user_id)
    return {"user_id": user_id, "credits": credits}

@app.post("/credits/{user_id}/add")
async def add_user_credits(user_id: str, amount: int = Form(...), promo_code: str = Form(None)):
    """Add credits to user account (for admin use or promo codes)"""
    add_credits(user_id, amount, promo_code)
    return {"success": True, "credits": get_user_credits(user_id)}

@app.post("/credits/redeem")
async def redeem_promo_code(user_id: str = Form(...), code: str = Form(...)):
    """Redeem a promo code"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT credits, uses_left FROM promo_codes WHERE code = ?", (code,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid promo code")
    
    credit_amount, uses_left = result
    
    if uses_left is not None and uses_left <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Promo code expired")
    
    # Add credits
    add_credits(user_id, credit_amount, code)
    
    # Decrease uses_left if limited
    if uses_left is not None:
        c.execute("UPDATE promo_codes SET uses_left = uses_left - 1 WHERE code = ?", (code,))
    
    conn.commit()
    conn.close()
    
    return {"success": True, "credits_added": credit_amount, "new_balance": get_user_credits(user_id)}

# --- MOCK AUTH & CREDITS ---
# No Supabase, No Stripe. Just Free.

# In-memory job store
jobs = {}

@app.get("/")
async def root_health():
    return {"status": "ok", "service": "captionbeast-backend"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

def process_video_task(job_id: str, file_path: str, filename: str, user_id: str = None):
    print(f"[{job_id}] Processing started for {filename}...")
    jobs[job_id]["status"] = "processing"
    
    try:
        # Create job-specific output folder
        job_output_dir = os.path.join(OUTPUT_DIR, job_id)
        os.makedirs(job_output_dir, exist_ok=True)
        
        # 1. Transcribe
        print(f"[{job_id}] Transcribing...")
        model = get_whisper_model()
        result = model.transcribe(file_path, word_timestamps=True)
        segments = result.get('segments', [])
        
        # Flatten words
        words = []
        for segment in segments:
            for word in segment.get('words', []):
                words.append(word)

        # 2. Full-video caption render only (no viral clipping)
        print(f"[{job_id}] Loading video...")
        video = VideoFileClip(file_path)
        video_duration = video.duration or 0

        # Keep words within video duration and guard missing timings.
        clean_words = []
        for w in words:
            ws = float(w.get("start", 0.0))
            we = float(w.get("end", ws + 0.08))
            if ws >= video_duration:
                continue
            clean_words.append({"word": w.get("word", ""), "start": ws, "end": min(we, video_duration)})

        font = _caption_font()
        fontsize = max(72, int(video.w * 0.12))
        caption_clips = create_word_by_word_clips(clean_words, video.w, video.h, font, fontsize)

        final_clip = CompositeVideoClip([video] + caption_clips)

        output_filename = f"captioned_{job_id}.mp4"
        output_fullpath = os.path.join(job_output_dir, output_filename)

        final_clip.write_videofile(
            output_fullpath,
            codec='libx264',
            audio_codec='aac',
            temp_audiofile=os.path.join(job_output_dir, "temp-full.m4a"),
            remove_temp=True,
            fps=video.fps or 24
        )

        processed_clips = [{
            "url": f"/download/{job_id}/{output_filename}",
            "reason": "Full video word-by-word captions",
            "score": 100,
            "duration": video_duration
        }]

        jobs[job_id]["clips"] = processed_clips
        jobs[job_id]["status"] = "completed"
        print(f"[{job_id}] Done! Generated {len(processed_clips)} clips.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)


# Initialize with some promo codes
def init_promo_codes():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Add default promo code for free credits
    c.execute("INSERT OR IGNORE INTO promo_codes (code, credits, uses_left) VALUES (?, ?, ?)", 
              ("FREE10", 10, 100))
    c.execute("INSERT OR IGNORE INTO promo_codes (code, credits, uses_left) VALUES (?, ?, ?)", 
              ("WELCOME", 5, None))  # Unlimited
    conn.commit()
    conn.close()

init_promo_codes()

@app.post("/upload")
async def upload_video(
    file: UploadFile = File(...), 
    user_id: str = Form(None), 
    background_tasks: BackgroundTasks = BackgroundTasks(),
    skip_credits: bool = Form(False)
):
    # Generate user_id if not provided
    if not user_id:
        user_id = str(uuid.uuid4())
        create_user(user_id)  # Give 3 free credits to new users
    
    # Check credits (skip if skip_credits is True for free tier)
    if not skip_credits:
        credits = get_user_credits(user_id)
        if credits < 1:
            return {
                "error": "Insufficient credits",
                "credits": credits,
                "payment_link": "https://contra.com/payment-link/ArcQFsbC-caption-beast"
            }
        # Deduct credit
        deduct_credits(user_id, 1)
    
    job_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1]
    filename = f"{job_id}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    print(f"Received upload from {user_id}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    jobs[job_id] = {"status": "queued", "video_url": "", "error": None, "user_id": user_id}
    
    # Run processing in background
    background_tasks.add_task(process_video_task, job_id, file_path, file.filename, user_id)
    
    return {"job_id": job_id, "status": "queued", "credits_remaining": get_user_credits(user_id)}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
