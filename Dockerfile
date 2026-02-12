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
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from both services
COPY api/requirements.txt api-requirements.txt
COPY bot/requirements.txt bot-requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r api-requirements.txt
RUN pip install --no-cache-dir -r bot-requirements.txt  
RUN pip install --no-cache-dir python-dotenv

# Copy source code
COPY api/ ./api/
COPY bot/ ./bot/
COPY shared/ ./shared/
COPY main.py ./

# Environment variables
ENV PORT=8080
ENV PYTHONPATH=/app

# Start unified app (API + Bot)
# Start unified app (API + Bot)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
