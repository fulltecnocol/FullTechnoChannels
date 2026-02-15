#!/bin/bash

# Deploy Backend to Cloud Run
# Run this script when you have Docker Desktop and gcloud CLI installed

set -e

# Asegurar que gcloud esté en el PATH (específico para este entorno)
export PATH=$PATH:/Users/felipegomez/google-cloud-sdk/bin

PROJECT_ID="full-techno-channels"
REGION="us-central1"
SERVICE_NAME="membership-backend"

echo "🚀 Deploying to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Build and deploy using Cloud Build (no local Docker needed)
# 1. First Deploy (to ensure service exists and get URL)
echo "🚀 Building and deploying core service..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="SERVICE_TYPE=unified" \
  --set-secrets="BOT_TOKEN=BOT_TOKEN:latest,DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest" \
  --project $PROJECT_ID \
  --quiet

# 2. Retrieve the actual Cloud Run URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)')
echo "📍 Service URL: $SERVICE_URL"

# 3. Update Service with correct WEBHOOK_URL
echo "🔗 Configuring Webhook..."
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --set-env-vars="WEBHOOK_URL=$SERVICE_URL" \
  --quiet

echo ""
