#!/bin/bash
# Complete deployment and configuration script
# This script automates the entire deployment process

set -e

echo "=========================================="
echo "TeleGate Deployment Automation"
echo "=========================================="
echo ""

# Check if running in Cloud Shell
if [[ -z "${GOOGLE_CLOUD_PROJECT}" ]]; then
    echo "⚠️  Not running in Google Cloud Shell"
    echo "This script should be run in Cloud Shell for automatic deployment"
    echo "Continuing with local preparation..."
    LOCAL_MODE=true
else
    echo "✅ Running in Google Cloud Shell"
    LOCAL_MODE=false
fi

echo ""
echo "Step 1: Running test suite..."
python3 scripts/test_suite.py
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Fix errors before deploying."
    exit 1
fi

echo ""
echo "Step 2: Committing changes to Git..."
git add -A
git commit -m "Automated deployment - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main

if [ "$LOCAL_MODE" = true ]; then
    echo ""
    echo "=========================================="
    echo "✅ Local preparation complete!"
    echo "=========================================="
    echo ""
    echo "Next steps (run these in Cloud Shell):"
    echo "1. cd ~/FullTechnoChannels"
    echo "2. git pull"
    echo "3. ./deploy-and-configure.sh"
    exit 0
fi

echo ""
echo "Step 3: Deploying to Cloud Run..."
gcloud run deploy membership-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=postgresql://postgres:DiUtFs5IRxls7G0F@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres,JWT_SECRET_KEY=84d57d1155888a8a991e2326c39648dd46575675ceb1a164995fef82ee97627f" \
  --project full-techno-channels \
  --quiet

echo ""
echo "Step 4: Getting service URL..."
SERVICE_URL=$(gcloud run services describe membership-backend --region=us-central1 --format='value(status.url)' --project=full-techno-channels)
echo "Service deployed at: $SERVICE_URL"

echo ""
echo "Step 5: Configuring Telegram webhook..."
BOT_TOKEN=$(gcloud secrets versions access latest --secret="BOT_TOKEN" --project=full-techno-channels)

# Get the webhook path from bot configuration
WEBHOOK_PATH="/bot/webhook/${BOT_TOKEN}"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${SERVICE_URL}${WEBHOOK_PATH}\"}"

echo ""
echo ""
echo "Step 6: Verifying webhook..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Service URL: $SERVICE_URL"
echo "API Documentation: ${SERVICE_URL}/api/docs"
echo "Bot Webhook: ${SERVICE_URL}${WEBHOOK_PATH}"
echo ""
echo "Test your bot by sending /start in Telegram"
echo ""
