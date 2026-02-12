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

# 1. Build the container using Cloud Build explicitly
echo "🛠 Building container with Cloud Build..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --dockerfile Dockerfile.api . --project $PROJECT_ID

# 2. Deploy the built image to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --timeout=300 \
  --cpu=2 \
  --memory=1Gi \
  --cpu-boost \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
  --project $PROJECT_ID \
  --quiet

echo ""
echo "✅ API deployment complete!"
echo "📍 API URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' --project=$PROJECT_ID
