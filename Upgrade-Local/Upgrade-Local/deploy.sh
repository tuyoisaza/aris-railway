#!/bin/bash

# Upgrade Project Deployment Script
# Usage: ./deploy.sh [PROJECT_ID]

PROJECT_ID=$1
SERVICE_NAME="upgrade-platform"
REGION="us-central1"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Project ID is required."
  echo "Usage: ./deploy.sh [PROJECT_ID]"
  exit 1
fi

echo "Deploying $SERVICE_NAME to project $PROJECT_ID in region $REGION..."

# Submit build to Cloud Build
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME . --project $PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production"

echo "Deployment complete."
