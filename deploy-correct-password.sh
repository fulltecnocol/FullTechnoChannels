#!/bin/bash

# Deploy with CORRECT password
set -e

gcloud run deploy membership-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=postgresql://postgres:DiUtFs5IRxls7G0F@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres,JWT_SECRET_KEY=84d57d1155888a8a991e2326c39648dd46575675ceb1a164995fef82ee97627f" \
  --project full-techno-channels \
  --quiet

echo ""
echo "✅ Deployment complete!"
gcloud run services describe membership-backend --region=us-central1 --format='value(status.url)' --project=full-techno-channels
