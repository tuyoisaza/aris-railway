#!/bin/bash
# Check if Google Cloud SDK is installed
if ! command -v gcloud &> /dev/null
then
    echo "gcloud could not be found. Please install the Google Cloud SDK."
    exit 1
fi

echo "Building Docker image..."
docker build -t aris .

echo "Deploying to Cloud Run..."
# Replace [YOUR_PROJECT_ID] and [REGION] with actual values or use interactive mode
gcloud run deploy aris \
  --image aris \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1 \
  --source .

echo "Deployment complete!"
