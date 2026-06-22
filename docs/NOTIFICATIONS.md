# IPS Notifications Setup

## Overview

When a service request is submitted, the system automatically sends:

| Channel | Recipient | Content |
|---------|-----------|---------|
| WhatsApp | Client | Confirmation + tracking link + PDF |
| WhatsApp | Admin(s) | Alert + review link + PDF |
| Email | Admin(s) | HTML email + PDF attachment |
| Dashboard | Admin users | Database notification (Phase 5 UI) |

All WhatsApp messages are logged in `whatsapp_notifications`.

---

## Environment Variables

```env
WASENDER_API_KEY=your_wasender_api_key
WASENDER_BASE_URL=https://wasenderapi.com/api
COMPANY_NAME="Indatwa Protocol & Services Agency"
ADMIN_PHONE=+250780759253
ADMIN_EMAIL=admin@indatwa.rw

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_USERNAME=noreply@indatwa.rw
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=noreply@indatwa.rw

QUEUE_CONNECTION=database
```

For **local development** without a queue worker, use:

```env
QUEUE_CONNECTION=sync
```

---

## WasenderAPI Webhook

Register this URL in your WasenderAPI dashboard for delivery status updates:

```
https://indatwa.rw/api/v1/webhooks/wasender
```

---

## Queue Worker

Notifications run via `SendRequestSubmittedNotifications` job.

**Development:**
```bash
php artisan queue:work
```

**Hostinger shared hosting (cron):**
```cron
* * * * * cd /path/to/laravel && php artisan queue:work --stop-when-empty --max-time=55
```

---

## Phone Number Format

All phones are normalized to E.164 before sending:
- `0780759253` → `+250780759253`
- `+250 780 759 253` → `+250780759253`

---

## Admin Recipients

Notifications are sent to:
1. `ADMIN_PHONE` and `ADMIN_EMAIL` from `.env`
2. Users with roles: `super_admin`, `director`, `operations_manager`, `customer_service`

Default seeded admin:
- Email: `admin@indatwa.rw`
- Password: `IPSAdmin@2026` (change in production)

---

## Message Flow (Request Submitted)

```
Client submits request
        ↓
PDF generated
        ↓
Job dispatched (queue)
        ↓
┌───────────────────────────────────────┐
│ 1. Upload PDF to Wasender (public URL) │
│ 2. WhatsApp → Client (text + PDF)     │
│ 3. WhatsApp → Admin(s) (text + PDF)   │
│ 4. Email → Admin(s)                   │
│ 5. Database notification → Admin users│
└───────────────────────────────────────┘
```

Rate limits (Manukeza defaults):
- 6 seconds between recipients
- 3 seconds between text and attachment

---

## Testing Without WasenderAPI

If `WASENDER_API_KEY` is empty:
- WhatsApp sends are skipped (logged as failed)
- Email and dashboard notifications still work
- PDF uses local public storage URL

---

## Future Templates (Phase 6+)

| Event | Template Key |
|-------|--------------|
| Status changed | `status_update` |
| Quotation ready | `quotation_ready` |
| Payment received | `payment_confirmed` |
| Request completed | `request_completed` |

Templates are in `app/Services/WhatsApp/MessageTemplates.php`.
