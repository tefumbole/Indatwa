# IPS Database Schema

> **Database:** MySQL 8 / MariaDB 10.6+  
> **Charset:** `utf8mb4_unicode_ci`  
> **Engine:** InnoDB  
> **Note:** PostgreSQL was specified in the original brief but is **not supported on Hostinger shared hosting**. MySQL is the production database.

---

## 1. Authentication & Users

### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AI | |
| uuid | CHAR(36) | UNIQUE | Public identifier |
| name | VARCHAR(255) | NOT NULL | |
| email | VARCHAR(255) | UNIQUE, NULLABLE | Optional for clients |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | E.164 format |
| password | VARCHAR(255) | NULLABLE | Null for OTP-only clients |
| avatar | VARCHAR(500) | NULLABLE | |
| nationality | VARCHAR(100) | NULLABLE | |
| country | VARCHAR(100) | NULLABLE | |
| city | VARCHAR(100) | NULLABLE | |
| email_verified_at | TIMESTAMP | NULLABLE | |
| phone_verified_at | TIMESTAMP | NULLABLE | |
| two_factor_secret | TEXT | NULLABLE | Encrypted TOTP |
| two_factor_recovery_codes | TEXT | NULLABLE | Encrypted |
| two_factor_confirmed_at | TIMESTAMP | NULLABLE | |
| is_active | BOOLEAN | DEFAULT true | |
| last_login_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete |

### `roles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| name | VARCHAR(50) | UNIQUE — super_admin, director, operations_manager, finance_officer, protocol_officer, customer_service, client |
| display_name | VARCHAR(100) | |
| description | TEXT | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `permissions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| name | VARCHAR(100) | UNIQUE — e.g. `requests.review`, `payments.manage` |
| module | VARCHAR(50) | — services, requests, quotations, payments, staff, tasks, announcements, reports, settings |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `role_permission` (pivot)
| Column | Type | Constraints |
|--------|------|-------------|
| role_id | BIGINT UNSIGNED | FK → roles |
| permission_id | BIGINT UNSIGNED | FK → permissions |

### `user_role` (pivot)
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | BIGINT UNSIGNED | FK → users |
| role_id | BIGINT UNSIGNED | FK → roles |

### `personal_access_tokens` (Sanctum)
Standard Laravel Sanctum table.

### `password_reset_tokens`
Standard Laravel table.

---

## 2. Services

### `service_categories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(120) | UNIQUE |
| description | TEXT | NULLABLE |
| icon | VARCHAR(100) | NULLABLE |
| sort_order | INT | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `services`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| category_id | BIGINT UNSIGNED | FK → service_categories, NULLABLE |
| name | VARCHAR(200) | NOT NULL |
| slug | VARCHAR(220) | UNIQUE |
| description | TEXT | NULLABLE |
| short_description | VARCHAR(500) | NULLABLE |
| base_price | DECIMAL(12,2) | DEFAULT 0 |
| price_unit | ENUM | per_hour, per_day, per_event, per_person, fixed |
| currency | CHAR(3) | DEFAULT 'RWF' |
| image_path | VARCHAR(500) | NULLABLE |
| is_featured | BOOLEAN | DEFAULT false |
| is_active | BOOLEAN | DEFAULT true |
| sort_order | INT | DEFAULT 0 |
| metadata | JSON | NULLABLE — extra fields per service |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | NULLABLE |

---

## 3. Service Requests

### `service_requests`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AI | |
| reference_number | VARCHAR(20) | UNIQUE | IPS-2026-000001 |
| user_id | BIGINT UNSIGNED | FK → users, NULLABLE | Registered client |
| status | ENUM | NOT NULL | submitted, under_review, quotation_prepared, awaiting_payment, approved, in_progress, completed, rejected |
| client_name | VARCHAR(255) | NOT NULL | |
| client_nationality | VARCHAR(100) | NULLABLE | |
| client_country | VARCHAR(100) | NULLABLE | |
| client_city | VARCHAR(100) | NULLABLE | |
| client_phone | VARCHAR(20) | NOT NULL | |
| client_email | VARCHAR(255) | NULLABLE | |
| event_title | VARCHAR(255) | NOT NULL | |
| event_type | VARCHAR(100) | NOT NULL | |
| event_date | DATE | NOT NULL | |
| event_start_date | DATE | NULLABLE | |
| event_end_date | DATE | NULLABLE | |
| number_of_guests | INT UNSIGNED | NULLABLE | |
| venue | VARCHAR(500) | NULLABLE | |
| event_description | TEXT | NULLABLE | |
| signature_path | VARCHAR(500) | NULLABLE | PNG signature image |
| pdf_path | VARCHAR(500) | NULLABLE | Generated request PDF |
| tracking_token | CHAR(64) | UNIQUE | Public tracking without login |
| assigned_to | BIGINT UNSIGNED | FK → users, NULLABLE | Operations manager |
| reviewed_by | BIGINT UNSIGNED | FK → users, NULLABLE | |
| reviewed_at | TIMESTAMP | NULLABLE | |
| admin_notes | TEXT | NULLABLE | Internal notes |
| client_notes | TEXT | NULLABLE | |
| submitted_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULLABLE |

### `service_request_items`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| service_request_id | BIGINT UNSIGNED | FK → service_requests |
| service_id | BIGINT UNSIGNED | FK → services |
| service_name | VARCHAR(200) | Snapshot at submission |
| status | ENUM | pending, approved, rejected |
| admin_comment | TEXT | NULLABLE |
| reviewed_by | BIGINT UNSIGNED | FK → users, NULLABLE |
| reviewed_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `service_request_documents`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| service_request_id | BIGINT UNSIGNED | FK → service_requests |
| document_type | ENUM | passport, national_id, other_identification, additional |
| original_name | VARCHAR(255) | |
| file_path | VARCHAR(500) | Encrypted storage path |
| mime_type | VARCHAR(100) | |
| file_size | INT UNSIGNED | Bytes |
| uploaded_by | BIGINT UNSIGNED | FK → users, NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `service_request_status_history`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| service_request_id | BIGINT UNSIGNED | FK |
| from_status | VARCHAR(50) | NULLABLE |
| to_status | VARCHAR(50) | NOT NULL |
| changed_by | BIGINT UNSIGNED | FK → users, NULLABLE |
| comment | TEXT | NULLABLE |
| created_at | TIMESTAMP | |

### `service_request_messages`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| service_request_id | BIGINT UNSIGNED | FK |
| sender_id | BIGINT UNSIGNED | FK → users |
| message | TEXT | NOT NULL |
| is_internal | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 4. Quotations & Payments

### `quotations`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| service_request_id | BIGINT UNSIGNED | FK, UNIQUE per active |
| reference_number | VARCHAR(20) | UNIQUE — IPS-Q-2026-000001 |
| subtotal | DECIMAL(12,2) | |
| tax_rate | DECIMAL(5,2) | DEFAULT 18.00 |
| tax_amount | DECIMAL(12,2) | |
| discount_amount | DECIMAL(12,2) | DEFAULT 0 |
| total | DECIMAL(12,2) | |
| currency | CHAR(3) | DEFAULT 'RWF' |
| notes | TEXT | NULLABLE |
| valid_until | DATE | NULLABLE |
| pdf_path | VARCHAR(500) | NULLABLE |
| prepared_by | BIGINT UNSIGNED | FK → users |
| status | ENUM | draft, sent, accepted, rejected, expired |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `quotation_items`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| quotation_id | BIGINT UNSIGNED | FK |
| service_id | BIGINT UNSIGNED | FK, NULLABLE |
| description | VARCHAR(255) | |
| quantity | DECIMAL(10,2) | |
| unit_price | DECIMAL(12,2) | |
| line_total | DECIMAL(12,2) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `payments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| service_request_id | BIGINT UNSIGNED | FK |
| quotation_id | BIGINT UNSIGNED | FK, NULLABLE |
| reference_number | VARCHAR(30) | UNIQUE |
| amount | DECIMAL(12,2) | |
| currency | CHAR(3) | |
| method | ENUM | mtn_momo, airtel_money, flutterwave_card, flutterwave_bank, cash, bank_transfer |
| provider | VARCHAR(50) | flutterwave, mtn, airtel |
| provider_reference | VARCHAR(255) | NULLABLE |
| status | ENUM | pending, paid, failed, refunded |
| paid_at | TIMESTAMP | NULLABLE |
| metadata | JSON | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 5. Staff Management

### `staff_profiles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| user_id | BIGINT UNSIGNED | FK → users, UNIQUE |
| staff_type | ENUM | protocol_officer, driver, translator, event_coordinator, hostess, vendor, security |
| employee_id | VARCHAR(20) | UNIQUE |
| bio | TEXT | NULLABLE |
| skills | JSON | NULLABLE |
| languages | JSON | NULLABLE |
| rating_avg | DECIMAL(3,2) | DEFAULT 0 |
| rating_count | INT | DEFAULT 0 |
| is_available | BOOLEAN | DEFAULT true |
| hire_date | DATE | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `staff_documents`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| staff_profile_id | BIGINT UNSIGNED | FK |
| document_type | VARCHAR(100) | |
| file_path | VARCHAR(500) | |
| expires_at | DATE | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `staff_assignments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| service_request_id | BIGINT UNSIGNED | FK |
| staff_profile_id | BIGINT UNSIGNED | FK |
| role | VARCHAR(100) | |
| start_at | DATETIME | |
| end_at | DATETIME | NULLABLE |
| status | ENUM | assigned, confirmed, in_progress, completed, cancelled |
| notes | TEXT | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `staff_availability`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| staff_profile_id | BIGINT UNSIGNED | FK |
| date | DATE | |
| is_available | BOOLEAN | DEFAULT true |
| notes | VARCHAR(255) | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 6. Task Management

### `projects`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| service_request_id | BIGINT UNSIGNED | FK, NULLABLE |
| name | VARCHAR(255) | |
| description | TEXT | NULLABLE |
| status | ENUM | planning, active, on_hold, completed, cancelled |
| start_date | DATE | NULLABLE |
| end_date | DATE | NULLABLE |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `tasks`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| project_id | BIGINT UNSIGNED | FK |
| parent_id | BIGINT UNSIGNED | FK → tasks, NULLABLE |
| title | VARCHAR(255) | |
| description | TEXT | NULLABLE |
| status | ENUM | todo, in_progress, review, done, cancelled |
| priority | ENUM | low, medium, high, urgent |
| assigned_to | BIGINT UNSIGNED | FK → users, NULLABLE |
| due_date | DATETIME | NULLABLE |
| completed_at | TIMESTAMP | NULLABLE |
| sort_order | INT | DEFAULT 0 |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `task_comments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| task_id | BIGINT UNSIGNED | FK |
| user_id | BIGINT UNSIGNED | FK |
| comment | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 7. Announcements

### `announcements`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| title | VARCHAR(255) | |
| message | TEXT | |
| serial_reference | VARCHAR(30) | NULLABLE — IPS/ANN-000001 |
| target_group | ENUM | clients, staff, vendors, all |
| channels | JSON | — whatsapp, email |
| status | ENUM | draft, scheduled, sending, sent, failed |
| scheduled_at | TIMESTAMP | NULLABLE |
| sent_at | TIMESTAMP | NULLABLE |
| recipient_count | INT | DEFAULT 0 |
| success_count | INT | DEFAULT 0 |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | NULLABLE |

### `announcement_recipients`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| announcement_id | BIGINT UNSIGNED | FK |
| user_id | BIGINT UNSIGNED | FK, NULLABLE |
| phone | VARCHAR(20) | NULLABLE |
| email | VARCHAR(255) | NULLABLE |
| name | VARCHAR(255) | |
| status | ENUM | pending, sent, failed |
| sent_at | TIMESTAMP | NULLABLE |
| error_message | TEXT | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `announcement_attachments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| announcement_id | BIGINT UNSIGNED | FK |
| file_path | VARCHAR(500) | |
| original_name | VARCHAR(255) | |
| mime_type | VARCHAR(100) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `announcement_settings`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| company_name | VARCHAR(255) | |
| default_header | TEXT | NULLABLE |
| serial_prefix | VARCHAR(20) | DEFAULT 'IPS/ANN' |
| next_serial | INT | DEFAULT 1 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `announcement_templates`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| name | VARCHAR(100) | |
| title | VARCHAR(255) | |
| message | TEXT | |
| created_by | BIGINT UNSIGNED | FK |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 8. Calendar

### `calendar_events`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| title | VARCHAR(255) | |
| description | TEXT | NULLABLE |
| event_type | ENUM | event, assignment, meeting, deadline |
| start_at | DATETIME | |
| end_at | DATETIME | |
| all_day | BOOLEAN | DEFAULT false |
| location | VARCHAR(500) | NULLABLE |
| service_request_id | BIGINT UNSIGNED | FK, NULLABLE |
| staff_profile_id | BIGINT UNSIGNED | FK, NULLABLE |
| google_event_id | VARCHAR(255) | NULLABLE |
| color | VARCHAR(7) | NULLABLE |
| created_by | BIGINT UNSIGNED | FK |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 9. CMS (Public Website)

### `blog_posts`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| title | VARCHAR(255) | |
| slug | VARCHAR(280) | UNIQUE |
| excerpt | TEXT | NULLABLE |
| content | LONGTEXT | |
| featured_image | VARCHAR(500) | NULLABLE |
| author_id | BIGINT UNSIGNED | FK → users |
| status | ENUM | draft, published |
| published_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `gallery_items`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| title | VARCHAR(255) | NULLABLE |
| image_path | VARCHAR(500) | |
| category | VARCHAR(100) | NULLABLE |
| sort_order | INT | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `testimonials`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| client_name | VARCHAR(255) | |
| client_title | VARCHAR(255) | NULLABLE |
| content | TEXT | |
| rating | TINYINT | 1-5 |
| avatar_path | VARCHAR(500) | NULLABLE |
| is_featured | BOOLEAN | DEFAULT false |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `faqs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| question | VARCHAR(500) | |
| answer | TEXT | |
| category | VARCHAR(100) | NULLABLE |
| sort_order | INT | DEFAULT 0 |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `site_settings`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| key | VARCHAR(100) | UNIQUE |
| value | JSON | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 10. Notifications & Audit

### `notifications` (Laravel)
Standard Laravel notifications table.

### `whatsapp_notifications`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| user_id | BIGINT UNSIGNED | FK, NULLABLE |
| phone | VARCHAR(20) | |
| message_type | VARCHAR(50) | |
| message | TEXT | |
| status | ENUM | pending, sent, delivered, failed |
| provider_sid | VARCHAR(255) | NULLABLE |
| related_type | VARCHAR(100) | NULLABLE — polymorphic |
| related_id | BIGINT UNSIGNED | NULLABLE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `activity_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| user_id | BIGINT UNSIGNED | FK, NULLABLE |
| action | VARCHAR(100) | |
| module | VARCHAR(50) | |
| description | TEXT | NULLABLE |
| subject_type | VARCHAR(100) | NULLABLE |
| subject_id | BIGINT UNSIGNED | NULLABLE |
| properties | JSON | NULLABLE |
| ip_address | VARCHAR(45) | NULLABLE |
| user_agent | VARCHAR(500) | NULLABLE |
| created_at | TIMESTAMP | |

### `reference_counters`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT UNSIGNED | PK, AI |
| type | VARCHAR(30) | UNIQUE — request, quotation, payment, announcement |
| year | SMALLINT | |
| last_number | INT UNSIGNED | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Unique index:** `(type, year)`

---

## Indexes (Key)

```sql
-- Performance indexes
CREATE INDEX idx_requests_status ON service_requests(status);
CREATE INDEX idx_requests_phone ON service_requests(client_phone);
CREATE INDEX idx_requests_submitted ON service_requests(submitted_at);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, status);
CREATE INDEX idx_calendar_dates ON calendar_events(start_at, end_at);
CREATE INDEX idx_activity_user ON activity_logs(user_id, created_at);
```
