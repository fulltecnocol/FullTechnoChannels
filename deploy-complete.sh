#!/bin/bash
set -e

# Configuration
export PATH=$PATH:/Users/felipegomez/google-cloud-sdk/bin
PROJECT_ID="full-techno-channels"
REGION="us-central1"
WORKER_SERVICE="membership-worker"
MAIN_SERVICE="membership-backend"

echo "🚀 Starting Full Stack Deployment..."
echo "-----------------------------------"

# 1. Deploy Worker Service
echo "📦 Building Worker Image..."
gcloud builds submit --config cloudbuild.worker.yaml --project $PROJECT_ID --quiet

echo "📦 Deploying Worker Service..."
gcloud run deploy $WORKER_SERVICE \
  --image gcr.io/$PROJECT_ID/$WORKER_SERVICE \
  --region $REGION \
  --project $PROJECT_ID \
  --platform managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest" \
  --quiet

# Get Worker URL
WORKER_URL=$(gcloud run services describe $WORKER_SERVICE --region $REGION --project $PROJECT_ID --format 'value(status.url)')
echo "✅ Worker Deployed at: $WORKER_URL"
echo ""

# 2. Deploy Main Service (Bot/API)
echo "🤖 Deploying Main Bot/API Service..."
# Using the same safe configuration as deploy-safe.sh but adding WORKER_URL
gcloud run deploy $MAIN_SERVICE \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --platform managed \
  --allow-unauthenticated \
  --timeout=300 \
  --memory=1Gi \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET_KEY=JWT_SECRET_KEY:latest,TELEGRAM_BOT_TOKEN=BOT_TOKEN:latest" \
  --set-env-vars="SERVICE_TYPE=unified,WORKER_URL=$WORKER_URL,WEBHOOK_URL=https://membership-backend-dhtw77aq7a-uc.a.run.app,GOOGLE_CLIENT_ID=1054327025113-765gvg5r9kjci5kbucurijnp0ih1ap7e.apps.googleusercontent.com" \
  --quiet

# Get Main URL
MAIN_URL=$(gcloud run services describe $MAIN_SERVICE --region $REGION --project $PROJECT_ID --format 'value(status.url)')

# 3. Update Webhook URL just in case valid URL changed (Unlikely but good practice)
# echo "🔗 Updating Webhook Env Var..."
# gcloud run services update $MAIN_SERVICE \
#   --region $REGION \
#   --project $PROJECT_ID \
#   --set-env-vars="WEBHOOK_URL=$MAIN_URL" \
#   --quiet

echo "-----------------------------------"
echo "✅ Deployment Complete!"
echo "🤖 Bot Details: $MAIN_URL"
echo "⚙️ Worker Details: $WORKER_URL"
echo "-----------------------------------"
