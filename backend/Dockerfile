FROM python:3.9-slim

# Install system dependencies
# ffmpeg for video processing, imagemagick for text generation
# fonts-liberation for generic fonts (Impact might need manual install, but we'll try to map standard ones)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    ghostscript \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Fix ImageMagick security policy to allow PDF/Text (common issue)
RUN sed -i 's/none/read,write/g' /etc/ImageMagick-6/policy.xml || true

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
# Use CPU-only PyTorch to drastically reduce image size (approx 700MB saved)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads and outputs dirs
RUN mkdir -p uploads outputs

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
