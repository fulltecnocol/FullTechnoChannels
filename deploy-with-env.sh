#!/bin/bash

# Deploy Backend to Cloud Run with ENV VARS (bypass Secret Manager for testing)
# Run this script when you have Docker Desktop and gcloud CLI installed

set -e

PROJECT_ID="full-techno-channels"
REGION="us-central1"
SERVICE_NAME="membership-backend"

echo "🚀 Deploying to Cloud Run (with env vars)..."
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
  --set-env-vars="DATABASE_URL=postgresql://postgres:NNjrJRDdbcoQNDoI@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres,JWT_SECRET_KEY=84d57d1155888a8a991e2326c39648dd46575675ceb1a164995fef82ee97627f" \
  --project $PROJECT_ID \
  --quiet

echo ""
echo "✅ Deployment complete!"
echo "📍 Your backend URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' --project=$PROJECT_ID
