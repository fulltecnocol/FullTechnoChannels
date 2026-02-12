#!/bin/bash
# 🔐 TeleGate API-Only Secure Deployment Script
# Deploys ONLY the API service (without Bot integration)

set -e

PROJECT_ID="full-techno-channels"
REGION="us-central1"
SERVICE_NAME="telegate-api"

echo "=========================================="
echo "🚀 TeleGate API-Only Deployment"
echo "=========================================="

# Standard deploy command - most compatible with all gcloud versions
# This uses the default Dockerfile and our new SERVICE_TYPE switch in main.py
echo "🚀 Deploying and configuring service..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --timeout=300 \
  --cpu=2 \
  --memory=1Gi \
  --cpu-boost \
  --set-env-vars="SERVICE_TYPE=api" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
  --project $PROJECT_ID \
  --quiet

echo ""
echo "✅ API deployment complete!"
echo "📍 API URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' --project=$PROJECT_ID
