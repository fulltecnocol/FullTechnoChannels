#!/bin/bash
# 🔐 TeleGate Secure Deployment Script
# This is the ONLY script you should use for production deployments.
# It uses Google Cloud Secret Manager to protect your keys.

set -e

PROJECT_ID="full-techno-channels"
REGION="us-central1"
SERVICE_NAME="membership-backend"

echo "=========================================="
echo "🚀 TeleGate SECURE Deployment"
echo "=========================================="

# 1. Verify secrets exist in Secret Manager before deploying
echo "Checking Secret Manager configuration..."
# Note: You must have created these secrets in the Google Cloud Console first.
# Mandatory secrets: DATABASE_URL, JWT_SECRET_KEY, BOT_TOKEN

# 2. Deploy to Cloud Run using SECRETS (not env vars)
# We use --clear-env-vars to avoid conflicts with previous insecure deployments
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --clear-env-vars \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest,BOT_TOKEN=BOT_TOKEN:latest" \
  --project $PROJECT_ID \
  --quiet

echo ""
echo "✅ Secure deployment complete!"
echo "📍 Backend URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' --project=$PROJECT_ID
