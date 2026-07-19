#!/bin/bash

# Exit immediately if any command returns a non-zero status
set -e

# --- Configuration Settings (Adjust to match your GCP project) ---
GCP_PROJECT_ID="alberta-river-atlas"
GCP_REGION="us-central1"
AR_REPO="river-atlas-repo"

BACKEND_SERVICE_NAME="river-atlas-backend"
FRONTEND_SERVICE_NAME="river-atlas-frontend"

# Retrieve Mapbox Token from local environment variable if set, otherwise prompt or request it
MAPBOX_ACCESS_TOKEN="${REACT_APP_MAPBOX_ACCESS_TOKEN:-$1}"

if [ -z "$MAPBOX_ACCESS_TOKEN" ]; then
  echo "WARNING: No Mapbox token detected. Pass your token as an argument to embed it in the build:"
  echo "./deploy.sh <YOUR_MAPBOX_TOKEN>"
  read -p "Enter Mapbox Access Token to proceed: " MAPBOX_ACCESS_TOKEN
fi

echo "=========================================="
echo "Starting Google Cloud Run Deployment Setup"
echo "Project ID: $GCP_PROJECT_ID"
echo "Region:     $GCP_REGION"
echo "=========================================="

# 1. Authenticate with Google Cloud (Requires gcloud CLI installed)
echo "Authenticating Docker with Google Artifact Registry..."
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev --quiet

# 2. Build & Deploy Backend Container
echo "------------------------------------------"
echo "Building Backend Container..."
echo "------------------------------------------"
docker build -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${BACKEND_SERVICE_NAME}:latest ./backend

echo "Pushing Backend Container to Artifact Registry..."
docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${BACKEND_SERVICE_NAME}:latest

echo "Deploying Backend Service to Cloud Run..."
gcloud run deploy ${BACKEND_SERVICE_NAME} \
  --image ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${BACKEND_SERVICE_NAME}:latest \
  --platform managed \
  --region ${GCP_REGION} \
  --allow-unauthenticated \
  --port 5001 \
  --format="value(status.url)" > backend_url.txt

BACKEND_URL=$(cat backend_url.txt)
echo "Backend service deployed successfully: ${BACKEND_URL}"

# 3. Build & Deploy Frontend Container
echo "------------------------------------------"
echo "Building Frontend Container with Nginx..."
echo "Targeting Backend: ${BACKEND_URL}"
echo "------------------------------------------"
docker build \
  --build-arg REACT_APP_MAPBOX_ACCESS_TOKEN="${MAPBOX_ACCESS_TOKEN}" \
  --build-arg REACT_APP_API_URL="${BACKEND_URL}" \
  -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${FRONTEND_SERVICE_NAME}:latest ./frontend

echo "Pushing Frontend Container to Artifact Registry..."
docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${FRONTEND_SERVICE_NAME}:latest

echo "Deploying Frontend Service to Cloud Run..."
gcloud run deploy ${FRONTEND_SERVICE_NAME} \
  --image ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/${FRONTEND_SERVICE_NAME}:latest \
  --platform managed \
  --region ${GCP_REGION} \
  --allow-unauthenticated \
  --port 80

echo "=========================================="
echo "Deployment Orchestration Cycle Complete!"
echo "=========================================="
rm -f backend_url.txt
