# IPS REST API Documentation

> **Base URL:** `https://indatwa.rw/api/v1`  
> **Auth:** Laravel Sanctum (Bearer token)  
> **Format:** JSON  
> **Rate Limit:** 60 req/min (public), 120 req/min (authenticated)

---

## Authentication

### POST `/auth/register`
Register a client account.

```json
{
  "name": "Jean Baptiste",
  "phone": "+250780123456",
  "email": "jean@example.com",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!"
}
```

### POST `/auth/login`
```json
{ "phone": "+250780123456", "password": "SecurePass123!" }
```
**Response:** `{ "token": "...", "user": { ... } }`

### POST `/auth/login/otp`
Request OTP via WhatsApp for passwordless client login.
```json
{ "phone": "+250780123456" }
```

### POST `/auth/verify-otp`
```json
{ "phone": "+250780123456", "otp": "123456" }
```

### POST `/auth/logout` 🔒
### GET `/auth/me` 🔒
### POST `/auth/2fa/enable` 🔒 Admin only
### POST `/auth/2fa/verify` 🔒

---

## Public Endpoints (No Auth)

### GET `/services`
List active services for the public website.
```
?category=protocol&featured=1&page=1
```

### GET `/services/{slug}`
Single service detail.

### GET `/service-categories`
All active categories.

### POST `/requests/submit`
Submit a new service request (multipart/form-data).

| Field | Type | Required |
|-------|------|----------|
| services[] | array of service IDs | Yes |
| client_name | string | Yes |
| client_phone | string | Yes |
| client_email | string | No |
| client_nationality | string | No |
| client_country | string | No |
| client_city | string | No |
| event_title | string | Yes |
| event_type | string | Yes |
| event_date | date | Yes |
| event_start_date | date | No |
| event_end_date | date | No |
| number_of_guests | integer | No |
| venue | string | No |
| event_description | string | No |
| signature | base64 PNG | Yes |
| documents[] | files (PDF/JPG/PNG) | No |
| document_types[] | array | No |

**Response:**
```json
{
  "success": true,
  "data": {
    "reference_number": "IPS-2026-000001",
    "tracking_url": "https://indatwa.rw/track/abc123token",
    "pdf_url": "https://indatwa.rw/storage/requests/IPS-2026-000001.pdf"
  }
}
```

### GET `/track/{token}`
Public request tracking (no login required).

### GET `/blog`
### GET `/blog/{slug}`
### GET `/gallery`
### GET `/testimonials`
### GET `/faqs`
### GET `/settings/public`
Company info, contact, social links.

### POST `/contact`
Contact form submission.

---

## Client Portal 🔒 (role: client)

### GET `/portal/requests`
List own requests.

### GET `/portal/requests/{id}`
Request detail with status history.

### GET `/portal/requests/{id}/pdf`
Download request PDF.

### GET `/portal/requests/{id}/quotation`
View quotation if prepared.

### POST `/portal/requests/{id}/documents`
Upload additional documents.

### POST `/portal/requests/{id}/messages`
Send message to admin.

### GET `/portal/requests/{id}/messages`
Message thread.

### POST `/portal/payments/initiate`
```json
{
  "request_id": 1,
  "method": "mtn_momo",
  "phone": "+250780123456"
}
```

### GET `/portal/payments/{id}/status`
Check payment status.

---

## Admin — Dashboard 🔒

### GET `/admin/dashboard/stats`
```json
{
  "total_requests": 150,
  "pending_requests": 12,
  "approved_requests": 98,
  "revenue": { "total": 45000000, "currency": "RWF", "this_month": 5200000 },
  "active_services": 11,
  "new_clients": 8
}
```

### GET `/admin/dashboard/charts`
```
?chart=revenue|service_popularity|request_trends&period=12m
```

---

## Admin — Services 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/services` | services.view |
| POST | `/admin/services` | services.create |
| GET | `/admin/services/{id}` | services.view |
| PUT | `/admin/services/{id}` | services.update |
| DELETE | `/admin/services/{id}` | services.delete |
| PATCH | `/admin/services/{id}/toggle` | services.update |
| POST | `/admin/services/{id}/image` | services.update |

### POST `/admin/service-categories`
### PUT `/admin/service-categories/{id}`
### DELETE `/admin/service-categories/{id}`

---

## Admin — Requests 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/requests` | requests.view |
| GET | `/admin/requests/{id}` | requests.view |
| PATCH | `/admin/requests/{id}/status` | requests.update |
| PATCH | `/admin/requests/{id}/items/{itemId}` | requests.review |
| POST | `/admin/requests/{id}/assign` | requests.assign |
| GET | `/admin/requests/{id}/pdf` | requests.view |

### PATCH `/admin/requests/{id}/items/{itemId}`
Per-service approval:
```json
{
  "status": "approved",
  "admin_comment": "Protocol team available for this date"
}
```

---

## Admin — Quotations 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/quotations` | quotations.view |
| POST | `/admin/quotations` | quotations.create |
| GET | `/admin/quotations/{id}` | quotations.view |
| PUT | `/admin/quotations/{id}` | quotations.update |
| POST | `/admin/quotations/{id}/send` | quotations.send |
| GET | `/admin/quotations/{id}/pdf` | quotations.view |

### POST `/admin/quotations`
```json
{
  "service_request_id": 1,
  "items": [
    { "service_id": 1, "description": "Protocol Services", "quantity": 3, "unit_price": 100000 },
    { "service_id": 4, "description": "Translator", "quantity": 1, "unit_price": 150000 }
  ],
  "tax_rate": 18,
  "discount_amount": 0,
  "notes": "Valid for 14 days",
  "valid_until": "2026-06-22"
}
```

---

## Admin — Payments 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/payments` | payments.view |
| GET | `/admin/payments/{id}` | payments.view |
| POST | `/admin/payments/{id}/verify` | payments.manage |
| POST | `/admin/payments/manual` | payments.manage |

### Webhooks (no auth, signature verified)
- `POST /webhooks/flutterwave`
- `POST /webhooks/mtn-momo`
- `POST /webhooks/airtel-money`
- `POST /webhooks/wasender`

---

## Admin — Staff 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/staff` | staff.view |
| POST | `/admin/staff` | staff.create |
| GET | `/admin/staff/{id}` | staff.view |
| PUT | `/admin/staff/{id}` | staff.update |
| DELETE | `/admin/staff/{id}` | staff.delete |
| POST | `/admin/staff/{id}/documents` | staff.update |
| GET | `/admin/staff/{id}/availability` | staff.view |
| PUT | `/admin/staff/{id}/availability` | staff.update |
| POST | `/admin/staff/assignments` | staff.assign |

---

## Admin — Tasks 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/projects` | tasks.view |
| POST | `/admin/projects` | tasks.create |
| GET | `/admin/projects/{id}` | tasks.view |
| PUT | `/admin/projects/{id}` | tasks.update |
| GET | `/admin/projects/{id}/tasks` | tasks.view |
| POST | `/admin/tasks` | tasks.create |
| PUT | `/admin/tasks/{id}` | tasks.update |
| PATCH | `/admin/tasks/{id}/status` | tasks.update |
| POST | `/admin/tasks/{id}/comments` | tasks.comment |

### GET `/admin/tasks/kanban?project_id=1`
Returns tasks grouped by status columns.

---

## Admin — Announcements 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/announcements` | announcements.view |
| POST | `/admin/announcements` | announcements.create |
| POST | `/admin/announcements/{id}/send` | announcements.send |
| GET | `/admin/announcements/settings` | announcements.view |
| PUT | `/admin/announcements/settings` | announcements.manage |
| GET | `/admin/announcements/templates` | announcements.view |
| POST | `/admin/announcements/templates` | announcements.create |
| GET | `/admin/announcements/recipients/{group}` | announcements.view |
| POST | `/admin/announcements/process-scheduled` | announcements.send |

---

## Admin — Calendar 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/calendar` | calendar.view |
| POST | `/admin/calendar` | calendar.create |
| PUT | `/admin/calendar/{id}` | calendar.update |
| DELETE | `/admin/calendar/{id}` | calendar.delete |
| POST | `/admin/calendar/sync-google` | calendar.sync |

---

## Admin — CMS 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET/POST | `/admin/blog` | cms.manage |
| PUT/DELETE | `/admin/blog/{id}` | cms.manage |
| GET/POST | `/admin/gallery` | cms.manage |
| GET/POST | `/admin/testimonials` | cms.manage |
| GET/POST | `/admin/faqs` | cms.manage |
| GET/PUT | `/admin/settings` | settings.manage |

---

## Admin — Reports 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/reports/revenue` | reports.view |
| GET | `/admin/reports/services` | reports.view |
| GET | `/admin/reports/staff` | reports.view |
| GET | `/admin/reports/clients` | reports.view |
| GET | `/admin/reports/payments` | reports.view |

Query params: `?from=2026-01-01&to=2026-12-31&format=json|pdf|xlsx`

---

## Admin — Users & Roles 🔒

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/admin/users` | users.view |
| POST | `/admin/users` | users.create |
| PUT | `/admin/users/{id}` | users.update |
| GET | `/admin/roles` | roles.view |
| PUT | `/admin/roles/{id}/permissions` | roles.manage |
| GET | `/admin/activity-logs` | audit.view |

---

## Standard Response Format

### Success
```json
{
  "success": true,
  "data": { },
  "meta": { "current_page": 1, "last_page": 5, "per_page": 20, "total": 98 }
}
```

### Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "client_phone": ["Phone number is required"] }
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

---

## WhatsApp Notification Events

| Event | Recipient | Template Key |
|-------|-----------|--------------|
| Request submitted | Client + Admin | `request_received` |
| Status changed | Client | `status_update` |
| Quotation ready | Client | `quotation_ready` |
| Payment received | Client + Admin | `payment_confirmed` |
| Assignment made | Staff | `staff_assignment` |
| Reminder | Client | `payment_reminder` |
| Completed | Client | `request_completed` |
| Announcement | Target group | `announcement` |
