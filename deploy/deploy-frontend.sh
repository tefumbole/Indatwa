#!/bin/bash
# Run on your Mac to build React and upload to Hostinger.
# Usage: bash deploy/deploy-frontend.sh
#
# Uses SSH host alias "hostinger" (~/.ssh/config) which jumps via Tailscale VPS
# when Starlink cannot reach Hostinger directly. Override: INDATWA_SSH_HOST=user@host

set -e

DOMAIN="indatwagency.com"
SSH_TARGET="${INDATWA_SSH_HOST:-hostinger}"
REMOTE_BUILD="domains/indatwagency.com/public_html/build"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Building frontend for https://${DOMAIN}"
cd "${ROOT}/frontend"
npm ci
VITE_API_URL="https://${DOMAIN}/api/v1" npm run build

echo "==> Uploading to Hostinger via ${SSH_TARGET}..."
ssh "${SSH_TARGET}" "mkdir -p ~/${REMOTE_BUILD}"
scp -r dist/* "${SSH_TARGET}:~/${REMOTE_BUILD}/"

echo "==> Done. Visit https://${DOMAIN}"
