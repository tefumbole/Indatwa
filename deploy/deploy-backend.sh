#!/bin/bash
# Pull latest code on Hostinger and run server-update.sh
# Usage: bash deploy/deploy-backend.sh
#
# Run git push on your Mac first if you have unpushed commits.

set -e

SSH_TARGET="${INDATWA_SSH_HOST:-hostinger}"

echo "==> Updating backend on Hostinger via ${SSH_TARGET}..."
ssh "${SSH_TARGET}" "cd ~/Indatwa && git pull origin main && bash deploy/server-update.sh"

echo "==> Backend deploy complete."
