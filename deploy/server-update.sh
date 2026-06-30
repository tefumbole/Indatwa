#!/bin/bash
# Run on Hostinger after git pull (also used by GitHub Actions deploy).
# Manual: cd ~/Indatwa && git pull origin main && bash deploy/server-update.sh
set -e

REPO_DIR="${HOME}/Indatwa"
BACKEND_DIR="${REPO_DIR}/backend"
PUBLIC_HTML="${HOME}/domains/indatwagency.com/public_html"

cd "${BACKEND_DIR}"

if command -v composer >/dev/null 2>&1; then
  composer install --no-dev --optimize-autoloader
else
  php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
  php composer-setup.php --quiet
  php composer.phar install --no-dev --optimize-autoloader
  rm -f composer-setup.php composer.phar
fi

php artisan migrate --force
php artisan config:cache
php artisan route:cache

# Hostinger cron (hourly task reminders + minute announcements):
# curl -s "https://indatwagency.com/api/v1/cron/run?token=YOUR_CRON_SECRET"
# curl -s "https://indatwagency.com/api/v1/cron/announcements?token=YOUR_CRON_SECRET"

mkdir -p "${PUBLIC_HTML}/build"
mkdir -p "${PUBLIC_HTML}/media/requests"
chmod 755 "${PUBLIC_HTML}/media" "${PUBLIC_HTML}/media/requests" 2>/dev/null || true
cp "${REPO_DIR}/deploy/public_html/index.php" "${PUBLIC_HTML}/index.php"
cp "${REPO_DIR}/deploy/public_html/.htaccess" "${PUBLIC_HTML}/.htaccess"

echo "==> Backend updated."
