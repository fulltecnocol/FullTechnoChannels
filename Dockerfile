FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy all requirements first for better caching
COPY api/requirements.txt api_requirements.txt
COPY bot/requirements.txt bot_requirements.txt

# Install all Python dependencies
RUN pip install --no-cache-dir -r api_requirements.txt
RUN pip install --no-cache-dir -r bot_requirements.txt
RUN pip install --no-cache-dir python-dotenv aiogram

# Copy source code
COPY api/ ./api/
COPY bot/ ./bot/
COPY shared/ ./shared/

# Environment variables
ENV PORT=8080
ENV PYTHONPATH=/app

# Start both API and Bot
# API runs on $PORT, Bot runs in background with webhook mode
CMD sh -c "python3 bot/main.py & uvicorn api.main:app --host 0.0.0.0 --port $PORT"
