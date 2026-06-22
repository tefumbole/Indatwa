# IPS Deployment Guide — Hostinger Shared Hosting

## Hosting Decision

| Requirement | Shared Hosting | VPS |
|-------------|---------------|-----|
| PHP/Laravel | ✅ Native | ✅ |
| MySQL | ✅ Included | ✅ Manual setup |
| PostgreSQL | ❌ Not available | ✅ |
| Node.js runtime | ❌ Build locally | ✅ |
| Redis | ❌ Use DB queue | ✅ |
| SSH access | ⚠️ Limited | ✅ Full |
| Cost | Lower | Higher |

**Recommendation:** Deploy on **Hostinger Shared Hosting** using **Laravel + MySQL**. Build the React frontend locally and deploy compiled static assets. Upgrade to VPS when traffic or queue volume requires it.

---

## Prerequisites

- Hostinger shared hosting plan with PHP **7.4+** (7.4 or 8.x)
- MySQL database (created in hPanel)
- Domain pointed to Hostinger (e.g. `indatwa.rw`)
- Free SSL via Hostinger (Let's Encrypt)
- GitHub repository
- Local dev: PHP **7.4+**, Composer, Node 20+, npm

---

## Architecture on Shared Hosting

```
public_html/                    ← Hostinger web root
├── index.php                   ← Laravel front controller
├── .htaccess                   ← Apache rewrite rules
├── build/                      ← React production build (Vite output)
│   ├── index.html
│   └── assets/
├── storage/                    ← Symlinked from Laravel
└── api/                        ← Optional: API-only subdomain setup

laravel/                        ← One level ABOVE public_html (not web-accessible)
├── app/
├── bootstrap/
├── config/
├── database/
├── routes/
├── storage/
├── vendor/
└── .env
```

> **Security:** Place Laravel application files **outside** `public_html`. Only the `public/` folder contents are copied into `public_html`.

---

## Step 1: Prepare Laravel Backend

### 1.1 Environment Configuration

```env
APP_NAME="Indatwa Protocol & Services"
APP_ENV=production
APP_KEY=base64:...generated...
APP_DEBUG=false
APP_URL=https://indatwa.rw

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u123456789_ips
DB_USERNAME=u123456789_ips
DB_PASSWORD=your_secure_password

QUEUE_CONNECTION=database
SESSION_DRIVER=database
CACHE_STORE=database

FILESYSTEM_DISK=local
# Future S3:
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_DEFAULT_REGION=
# AWS_BUCKET=

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USERNAME=noreply@indatwa.rw
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@indatwa.rw

WASENDER_API_KEY=your_key
WASENDER_BASE_URL=https://wasenderapi.com/api
COMPANY_NAME="Indatwa Protocol & Services Agency"
ADMIN_PHONE=+250780759253
ADMIN_EMAIL=admin@indatwa.rw

FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_ENCRYPTION_KEY=

MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
MTN_MOMO_ENV=production

AIRTEL_MONEY_CLIENT_ID=
AIRTEL_MONEY_CLIENT_SECRET=

SANCTUM_STATEFUL_DOMAINS=indatwa.rw,www.indatwa.rw
SESSION_DOMAIN=.indatwa.rw
FRONTEND_URL=https://indatwa.rw
```

### 1.2 Database Queue Setup

Shared hosting has no Redis. Use database queues:

```bash
php artisan queue:table
php artisan migrate
```

---

## Step 2: Build React Frontend

```bash
cd frontend
npm ci
VITE_API_URL=https://indatwa.rw/api/v1 npm run build
```

Copy `frontend/dist/*` to deployment package.

---

## Step 3: Deploy to Hostinger

### 3.1 Upload via FTP/SFTP or Git

**Option A — FTP (FileZilla):**
1. Upload `laravel/` folder to `/home/u123456789/laravel/`
2. Copy `laravel/public/*` to `/home/u123456789/domains/indatwa.rw/public_html/`
3. Copy React `dist/*` to `public_html/build/`

**Option B — Git Deploy (recommended):**
```bash
# On local machine
git push origin main

# On Hostinger via SSH (if available) or deploy script
cd /home/u123456789/laravel
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3.2 Directory Permissions

```bash
chmod -R 775 storage bootstrap/cache
chown -R u123456789:u123456789 storage bootstrap/cache
```

### 3.3 Storage Symlink

```bash
php artisan storage:link
# If symlink not allowed on shared hosting, copy storage/app/public to public_html/storage
```

### 3.4 Apache .htaccess (public_html/.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # API requests → Laravel
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^ index.php [L]

    # Storage files
    RewriteCond %{REQUEST_URI} ^/storage/
    RewriteRule ^ index.php [L]

    # React SPA — serve index.html for non-file routes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_URI} !^/storage/
    RewriteRule ^ build/index.html [L]
</IfModule>
```

### 3.5 PHP Version

In Hostinger hPanel → **Advanced → PHP Configuration**:
- PHP Version: **8.2** or **8.3**
- Extensions: `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`, `gd`

---

## Step 4: Cron Jobs (hPanel → Cron Jobs)

```cron
# Laravel Scheduler (every minute)
* * * * * cd /home/u123456789/laravel && php artisan schedule:run >> /dev/null 2>&1

# Queue Worker (every minute — shared hosting workaround)
* * * * * cd /home/u123456789/laravel && php artisan queue:work --stop-when-empty --max-time=55 >> /dev/null 2>&1

# Process scheduled announcements (every 5 minutes)
*/5 * * * * cd /home/u123456789/laravel && php artisan announcements:process-scheduled >> /dev/null 2>&1

# Daily database backup
0 2 * * * cd /home/u123456789/laravel && php artisan backup:run >> /dev/null 2>&1
```

---

## Step 5: SSL Certificate

1. hPanel → **SSL** → Enable free SSL for `indatwa.rw`
2. Enable **Force HTTPS** in hPanel
3. Verify: `https://indatwa.rw`

---

## Step 6: Database Backup Strategy

### Automated (via cron + spatie/laravel-backup)
- Daily MySQL dump to `storage/app/backups/`
- Retain 7 daily, 4 weekly backups
- Optional: upload to S3 when migrated

### Manual (hPanel)
- hPanel → **Databases → phpMyAdmin → Export**

---

## Step 7: CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Hostinger

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, pdo_mysql

      - name: Install Backend Dependencies
        run: cd backend && composer install --no-dev --optimize-autoloader

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build Frontend
        run: |
          cd frontend && npm ci
          VITE_API_URL=https://indatwa.rw/api/v1 npm run build

      - name: Deploy via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./deploy-package/
          server-dir: /
```

---

## Step 8: Post-Deployment Checklist

- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` generated
- [ ] Database migrated and seeded
- [ ] Super admin account created
- [ ] SSL active and forced
- [ ] Cron jobs configured
- [ ] Storage writable and linked
- [ ] WasenderAPI key tested
- [ ] Email SMTP tested
- [ ] Flutterwave webhook URL registered
- [ ] Test service request end-to-end
- [ ] Test WhatsApp notification delivery
- [ ] Test PDF generation
- [ ] Test payment flow (sandbox first)

---

## Upgrade Path: Shared → VPS

When ready to migrate to Hostinger VPS:

1. Provision Ubuntu 22.04 VPS
2. Install Nginx, PHP 8.3-FPM, MySQL 8, Node.js
3. Install Redis + Supervisor for queue workers
4. Optionally migrate to PostgreSQL
5. Configure Nginx reverse proxy
6. Set up Let's Encrypt via Certbot
7. Enable AWS S3 for file storage
8. Use proper `queue:work` daemon via Supervisor

See `docs/VPS_MIGRATION.md` (Phase 2) for full VPS setup.

---

## Local Development (PHP 7.4)

IPS backend targets **PHP 7.4+** (Laravel 8). Your system PHP **7.4.33** is supported.

```bash
# Backend (from project root)
cd backend
composer install
cp .env.example .env   # if needed
php artisan key:generate
php artisan migrate --seed
php artisan serve      # http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

> **Note:** Run `cd frontend` from the project root (`indatwa/`), not from `backend/`.

Admin login after seed: `admin@indatwa.rw` / `IPSAdmin@2026` → `/admin`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `unexpected '\|'` or Parse error in vendor | PHP version too old for Laravel 13; IPS now uses Laravel 8 on PHP 7.4+ |
| `composer.lock` out of date | Run `cd backend && composer install` |
| `cd: no such file or directory: frontend` | You are inside `backend/`; go up one level first |
| 500 error | Check `storage/logs/laravel.log`, verify permissions |
| API CORS errors | Configure `config/cors.php` with frontend domain |
| Queue not processing | Verify cron is running `queue:work --stop-when-empty` |
| PDF generation fails | Ensure `gd` PHP extension enabled |
| WhatsApp not sending | Verify WasenderAPI key, check phone format E.164 |
| Large file uploads fail | Increase `upload_max_filesize` and `post_max_size` in PHP config |
| React routes 404 | Verify `.htaccess` SPA fallback rule |
