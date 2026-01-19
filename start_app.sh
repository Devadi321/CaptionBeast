#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping CaptionBeast..."
    kill $BACKEND_PID
    exit
}

# Trap Control+C (SIGINT)
trap cleanup SIGINT

echo "🦁 Starting CaptionBeast Locally..."
echo "==================================="

# 1. Start Backend
echo "👉 Launching Backend (Port 7860)..."
export PORT=7860
python3 backend/main.py &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 3

# 2. Start Frontend
echo "👉 Launching Frontend (Port 3001)..."
echo "   (Press Ctrl+C to stop everything)"
echo "==================================="
cd frontend
npm run dev -- -p 3001
