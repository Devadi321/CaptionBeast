FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    ghostscript \
    fonts-liberation \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Download Anton font (Impact alternative)
RUN mkdir -p /usr/share/fonts/truetype/google-fonts && \
    wget -O /usr/share/fonts/truetype/google-fonts/Anton-Regular.ttf https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf

# Fix ImageMagick policy
RUN sed -i 's/none/read,write/g' /etc/ImageMagick-6/policy.xml || true

# Set working directory
WORKDIR /app

# Copy backend requirements
COPY backend/requirements.txt .

# Install dependencies
# Use CPU-only PyTorch to drastically reduce image size (approx 700MB saved)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code into /app
COPY backend/ .

# Ensure directories exist and have permissions (HF runs as user 1000 usually)
RUN mkdir -p uploads outputs && chmod 777 uploads outputs

# Expose port (Required for Hugging Face Spaces)
EXPOSE 7860

# Force cache invalidation
ENV BUILD_DATE="2026-01-23-FIX-ROOT"

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
