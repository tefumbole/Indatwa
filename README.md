# Indatwa Protocol & Services Agency (IPS)

Enterprise-grade Protocol and Event Services Management Platform.

**Developed by:** [Alpha Bridge Technologies](https://alphabridge.tech)

## Company

| Field | Value |
|-------|-------|
| Name | Indatwa Protocol & Services Agency |
| Location | Kimironko, Kigali, Rwanda |
| WhatsApp | +250 780 759 253 |
| Primary Color | Royal Blue `#0B3D91` |
| Secondary Color | Gold `#D4AF37` |

## Stack (Hostinger Shared Hosting Optimized)

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, ShadCN UI | Built to static assets |
| Backend | Laravel 12 API, Sanctum | Native PHP on shared hosting |
| Database | **MySQL 8 / MariaDB** | PostgreSQL not available on shared hosting |
| Queue | Database driver + Cron | No Redis on shared hosting |
| Storage | Local disk → AWS S3 later | |
| WhatsApp | WasenderAPI | Same pattern as Manukeza |
| Payments | Flutterwave, MTN MoMo, Airtel Money | |

## Project Structure

```
indatwa/
├── docs/                  # Architecture & deployment documentation
├── backend/               # Laravel 12 API
├── frontend/              # React 19 SPA
└── assets/                # Brand images & logo
```

## Documentation

| Document | Description |
|----------|-------------|
| [Database Schema](docs/DATABASE_SCHEMA.md) | Full table definitions |
| [ERD](docs/ERD.md) | Entity relationship diagram |
| [API Documentation](docs/API_DOCUMENTATION.md) | REST API reference |
| [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) | Hostinger shared hosting |
| [Notifications Setup](docs/NOTIFICATIONS.md) | WhatsApp, email, queue config |
| [Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md) | Phased delivery plan |

## Quick Start (Development)

```bash
# Backend
cd backend && composer install && cp .env.example .env
php artisan key:generate && php artisan migrate --seed
php artisan serve

# Frontend
cd frontend && npm install && npm run dev
```

## License

Proprietary — Alpha Bridge Technologies © 2026
# Indatwa
