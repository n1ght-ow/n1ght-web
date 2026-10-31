#!/bin/sh
# Run the MyScore relay where the host has Docker but no Node (the deployed
# setup). Copy myscore/shared.mjs, provider.mjs, sources.mjs, media.mjs and
# team-names.mjs to /opt/myscore, and myscore/server/{index,store}.mjs to
# /opt/myscore/server. Then run this script with ALLOWED_ORIGINS set.
set -eu
ORIGIN="${ALLOWED_ORIGINS:-https://YOUR_GITHUB_PAGES_HOST}"

docker rm -f myscore-api 2>/dev/null || true
docker run -d --name myscore-api \
  --restart unless-stopped \
  --memory=288m --memory-reservation=200m --cpus=1 \
  --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges \
  --log-driver local --log-opt max-size=10m --log-opt max-file=2 \
  --health-cmd "wget -qO- http://127.0.0.1:3101/api/v1/health || exit 1" \
  --health-interval 60s --health-timeout 5s --health-retries 3 \
  -p 127.0.0.1:3101:3101 \
  -e API_HOST=0.0.0.0 -e API_PORT=3101 -e CACHE_DIR=/cache \
  -e ALLOWED_ORIGINS="$ORIGIN" \
  -v /opt/myscore:/app:ro -v myscore-cache:/cache \
  node:24-alpine node --max-old-space-size=128 /app/server/index.mjs
