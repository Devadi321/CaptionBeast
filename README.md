---
title: Caption Beast Backend
emoji: 🦁
colorFrom: yellow
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# CaptionBeast Backend

This is the FastAPI backend for CaptionBeast, capable of auto-generating MrBeast-style captions using OpenAI Whisper and MoviePy.

## API Endpoints

- `POST /upload`: Upload a video to generate captions.
- `GET /download/{filename}`: Download processed video.

Deployed on Hugging Face Spaces (Docker).
