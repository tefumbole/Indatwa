#!/bin/bash
# Run on your Mac to build React and upload to Hostinger.
# Usage: bash deploy/deploy-frontend.sh

set -e

DOMAIN="indatwagency.com"
SSH_HOST="193.203.189.131"
SSH_PORT="65002"
SSH_USER="u152889834"
REMOTE_BUILD="domains/indatwagency.com/public_html/build"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Building frontend for https://${DOMAIN}"
cd "${ROOT}/frontend"
npm ci
VITE_API_URL="https://${DOMAIN}/api/v1" npm run build

echo "==> Uploading to Hostinger..."
ssh -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}" "mkdir -p ~/${REMOTE_BUILD}"
scp -P "${SSH_PORT}" -r dist/* "${SSH_USER}@${SSH_HOST}:~/${REMOTE_BUILD}/"

echo "==> Done. Visit https://${DOMAIN}"
