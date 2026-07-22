#!/usr/bin/env bash
# Deploy the latest commit of the working branch. Run on the droplet:
#   /srv/farkle/repo/deploy/farkle-live/deploy.sh
# or from anywhere with SSH access:
#   ssh root@<droplet> /srv/farkle/repo/deploy/farkle-live/deploy.sh
set -euo pipefail

APP_DIR="/srv/farkle/repo"
BRANCH="feature/big-updates"

cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

cd deploy/farkle-live
docker compose build farkle-score
docker compose up -d
docker image prune -f

echo "Deployed $(git -C "$APP_DIR" rev-parse --short HEAD): $(git -C "$APP_DIR" log -1 --format=%s)"
