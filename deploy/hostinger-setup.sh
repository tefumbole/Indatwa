#!/bin/bash
# Run on Hostinger via SSH after cloning the repo.
# Usage: bash deploy/hostinger-setup.sh

set -e

USER_HOME="${HOME}"
REPO_DIR="${USER_HOME}/Indatwa"
BACKEND_DIR="${REPO_DIR}/backend"
PUBLIC_HTML="${USER_HOME}/domains/indatwagency.com/public_html"
DOMAIN="indatwagency.com"

echo "==> IPS Hostinger setup for ${DOMAIN}"
echo "    Home: ${USER_HOME}"
echo "    Backend: ${BACKEND_DIR}"
echo "    Web root: ${PUBLIC_HTML}"

if [ ! -d "${BACKEND_DIR}" ]; then
  echo "ERROR: ${BACKEND_DIR} not found. Clone first:"
  echo "  cd ~ && git clone https://github.com/tefumbole/Indatwa.git"
  exit 1
fi

mkdir -p "${PUBLIC_HTML}/build"

cd "${BACKEND_DIR}"

if ! command -v composer >/dev/null 2>&1; then
  echo "==> Installing Composer locally..."
  php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
  php composer-setup.php --quiet
  php composer.phar install --no-dev --optimize-autoloader
  rm -f composer-setup.php composer.phar
else
  composer install --no-dev --optimize-autoloader
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "IMPORTANT: Edit ${BACKEND_DIR}/.env with production values, then re-run:"
  echo "  php artisan key:generate && php artisan migrate --force --seed"
  echo ""
fi

php artisan storage:link 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Deploy public entry + htaccess
cp "${REPO_DIR}/deploy/public_html/index.php" "${PUBLIC_HTML}/index.php"
cp "${REPO_DIR}/deploy/public_html/.htaccess" "${PUBLIC_HTML}/.htaccess"

# Storage symlink for public files
ln -sfn "${BACKEND_DIR}/storage/app/public" "${PUBLIC_HTML}/storage" 2>/dev/null || \
  echo "Note: Could not symlink storage — copy manually if uploads fail."

echo ""
echo "==> Backend setup done."
echo "Next steps:"
echo "  1. nano ${BACKEND_DIR}/.env  (set DB, APP_URL=https://${DOMAIN}, etc.)"
echo "  2. php artisan key:generate"
echo "  3. php artisan migrate --force --seed"
echo "  4. php artisan config:cache && php artisan route:cache"
echo "  5. On your Mac, build frontend and upload to public_html/build/"
echo "     See deploy/deploy-frontend.sh"
