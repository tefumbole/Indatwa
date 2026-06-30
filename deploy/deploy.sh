#!/bin/bash
# Full deploy: push git (optional), backend pull + migrate, frontend build + upload
# Usage: bash deploy/deploy.sh [--no-push]

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

if [[ "${1:-}" != "--no-push" ]]; then
  echo "==> Pushing to origin/main..."
  git push origin main
fi

bash deploy/deploy-backend.sh
bash deploy/deploy-frontend.sh

echo "==> Full deploy complete: https://indatwagency.com"
