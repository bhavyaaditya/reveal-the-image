#!/usr/bin/bash
# cd /mnt/shared/F/reveal-the-image/backend

set -e  # exit immediately if any command fails

cd "$(dirname "$0")"    # Go to the directory where this script itself lives

docker build -t reveal-backend .

docker tag reveal-backend \
  us-central1-docker.pkg.dev/reveal-the-image-app/reveal-backend-repo/reveal-backend:latest

docker push us-central1-docker.pkg.dev/reveal-the-image-app/reveal-backend-repo/reveal-backend:latest

gcloud run deploy reveal-backend \
  --image us-central1-docker.pkg.dev/reveal-the-image-app/reveal-backend-repo/reveal-backend:latest \
  --region us-central1 \
  --allow-unauthenticated