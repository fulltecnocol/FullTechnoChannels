FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy API requirements
COPY api/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir python-dotenv

# Copy source code
COPY api/ ./api/
COPY shared/ ./shared/

# Environment variables
ENV PORT=8080
ENV PYTHONPATH=/app

# Start API only
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
