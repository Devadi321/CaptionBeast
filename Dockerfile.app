# Use multi-stage build for smaller image
FROM python:3.9-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    ghostscript \
    fonts-liberation \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Download Anton font
RUN mkdir -p /usr/share/fonts/truetype/google-fonts && \
    wget -O /usr/share/fonts/truetype/google-fonts/Anton-Regular.ttf https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf

# Fix ImageMagick policy
RUN sed -i 's/none/read,write/g' /etc/ImageMagick-6/policy.xml || true

WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Create directories
RUN mkdir -p uploads outputs && chmod 777 uploads outputs

# Expose port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
