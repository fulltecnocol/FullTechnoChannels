#!/bin/bash

# Deploy Backend to Cloud Run
# Run this script when you have Docker Desktop and gcloud CLI installed

set -e

PROJECT_ID="full-techno-channels"
REGION="us-central1"
SERVICE_NAME="membership-backend"

echo "🚀 Deploying to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Build and deploy using Cloud Build (no local Docker needed)
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="WEBHOOK_URL=https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app,SERVICE_TYPE=unified" \
  --set-secrets="BOT_TOKEN=BOT_TOKEN:latest,DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
  --project $PROJECT_ID \
  --quiet

echo ""
echo "✅ Deployment complete!"
echo "📍 Your backend URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' --project=$PROJECT_ID
