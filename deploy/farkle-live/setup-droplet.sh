#!/usr/bin/env bash
# One-time setup for the farkle.live droplet (Ubuntu 24.04, run as root).
# Usage: ACME_EMAIL=you@example.com bash setup-droplet.sh
set -euo pipefail

REPO="https://github.com/XTim97/farkle-score"
BRANCH="feature/big-updates"
APP_DIR="/srv/farkle"

: "${ACME_EMAIL:?set ACME_EMAIL to the email for Let's Encrypt registration}"

# 2G swap: image builds (npm ci + vite) do not fit in 1GB RAM alone
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Docker + compose plugin
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

# Unattended security updates
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades git ufw
dpkg-reconfigure -f noninteractive unattended-upgrades

# Firewall: web from anywhere, SSH rate-limited. After Tailscale is up,
# tighten with: ufw delete limit 22/tcp && ufw allow in on tailscale0 to any port 22
ufw default deny incoming
ufw default allow outgoing
ufw limit 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Checkout + data dir
mkdir -p "$APP_DIR/data"
if [ ! -d "$APP_DIR/repo" ]; then
  git clone --branch "$BRANCH" --single-branch "$REPO" "$APP_DIR/repo"
fi

# Persist the ACME email for compose runs
echo "ACME_EMAIL=$ACME_EMAIL" > "$APP_DIR/repo/deploy/farkle-live/.env"

# Backups: nightly SQLite copy, keep 14 days
install -m 0755 "$APP_DIR/repo/deploy/farkle-live/backup.sh" /usr/local/bin/farkle-backup
echo '15 4 * * * root /usr/local/bin/farkle-backup' > /etc/cron.d/farkle-backup

# First deploy
bash "$APP_DIR/repo/deploy/farkle-live/deploy.sh"

echo "Done. Point farkle.live (proxied) at this droplet and set Cloudflare SSL to Full (strict)."
