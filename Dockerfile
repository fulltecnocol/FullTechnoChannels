FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    python3-cffi \
    python3-brotli \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-subset0 \
    libjpeg-dev \
    libopenjp2-7-dev \
    libffi-dev \
    shared-mime-info \
    libgdk-pixbuf-2.0-0 \
    libgirepository1.0-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy root requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir python-dotenv

# Copy source code
COPY api/ ./api/
COPY bot/ ./bot/
COPY application/ ./application/
COPY core/ ./core/
COPY infrastructure/ ./infrastructure/
COPY templates/ ./templates/
COPY main.py ./

# Environment variables
ENV PORT=8080
ENV PYTHONPATH=/app

# Start unified app (API + Bot)
# Start unified app (API + Bot) with Gunicorn
CMD ["sh", "-c", "gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8080}"]
