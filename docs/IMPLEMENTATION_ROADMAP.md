# IPS Implementation Roadmap

## Overview

12-phase delivery plan for the Indatwa Protocol & Services Agency platform. Each phase produces a deployable increment.

**Estimated Timeline:** 16–20 weeks (1 developer) | 10–12 weeks (2 developers)

---

## Phase 0: Foundation ✅ (Week 1)

- [x] Project documentation (schema, ERD, API, deployment, roadmap)
- [x] Repository structure (monorepo: `backend/` + `frontend/`)
- [x] Brand assets (logo, landing images, color tokens)
- [x] Laravel 12 API scaffold with MySQL
- [x] React 19 + Vite + TailwindCSS + ShadCN UI scaffold
- [x] Environment configuration templates
- [x] CI/CD pipeline skeleton

**Deliverable:** Runnable dev environment with landing page.

---

## Phase 1: Public Website ✅ (Weeks 2–3)

### Pages
- [x] Home (hero with Landing image, video banner, overview, services, why choose us, testimonials, contact)
- [x] About Us
- [x] Services listing (dynamic from API with fallback)
- [x] Gallery
- [x] Blog (list + detail)
- [x] FAQ
- [x] Contact Us

### Features
- [x] Responsive design (mobile-first)
- [x] Dark/light mode toggle
- [x] Framer Motion animations
- [x] Glassmorphism cards
- [x] SEO meta tags
- [x] Modern IPS logo (SVG, favicon, social OG image)

**Deliverable:** Premium public website live on Hostinger.

---

## Phase 2: Services & Request Workflow ✅ (Weeks 4–5)

### Backend
- [x] Service request submission endpoint (multipart)
- [x] Multi-service selection
- [x] Document upload (passport, ID, other)
- [x] Digital signature capture + storage
- [x] Reference number generation (IPS-2026-XXXXXX)
- [x] Request PDF generation (DomPDF)
- [x] Status history tracking
- [x] PDF download endpoint
- [ ] Services CRUD (admin) — Phase 5

### Frontend
- [x] Request Service wizard (6-step form)
  - Step 1: Select services (from API)
  - Step 2: Client information
  - Step 3: Event details
  - Step 4: Document upload
  - Step 5: Digital signature
  - Step 6: Review & submit
- [x] Zod validation per step
- [x] Signature pad component
- [x] Success page with reference number
- [x] Track request page with status timeline

**Deliverable:** End-to-end service request submission with PDF.

---

## Phase 3: Notifications ✅ (Week 6)

- [x] WasenderAPI integration (port from Manukeza pattern)
- [x] WhatsApp: client confirmation + PDF + tracking link
- [x] WhatsApp: admin alert with review link
- [x] Email notifications (Laravel Mailable)
- [x] Dashboard notifications (Laravel Notifications)
- [x] Notification logging table (`whatsapp_notifications`)
- [x] Phone number normalization (E.164)
- [x] Queued notification job
- [x] Wasender delivery webhook

**Deliverable:** Automatic notifications on request submission.

---

## Phase 4: Authentication & Client Portal ✅ (Weeks 7–8)

### Auth
- [x] Laravel Sanctum API tokens
- [x] Client registration/login (phone + password)
- [x] OTP login via WhatsApp
- [x] Admin login with 2FA (TOTP)
- [x] Role-based access control (7 roles)

### Client Portal
- [x] Track requests by reference/token
- [x] View status timeline
- [x] Download PDF
- [x] Upload additional documents
- [x] Message admin
- [x] Payment initiation (placeholder)

**Deliverable:** Client portal with authentication.

---

## Phase 5: Admin Dashboard & Request Review ✅ (Weeks 9–10)

### Dashboard
- [x] Statistics cards (requests, revenue, services, clients)
- [x] Charts: monthly revenue, service popularity, request trends
- [x] Recent activity feed

### Request Management
- [x] Request list with filters/search
- [x] Request detail view
- [x] Per-service approve/reject with comments
- [x] Status transitions
- [x] Assign to operations manager
- [x] Internal notes

### Admin UI
- [x] Sidebar navigation
- [x] Data tables with pagination
- [x] Admin layout with role-aware menu

**Deliverable:** Functional admin dashboard with request review.

---

## Phase 6: Quotation Management (Week 11)

- [ ] Create quotation from approved request
- [ ] Line items (service, qty, unit price)
- [ ] Auto-calculate subtotal, tax (18%), discount, total
- [ ] Quotation PDF generation
- [ ] Send quotation to client (WhatsApp + email)
- [ ] Quotation status tracking

**Deliverable:** Full quotation workflow with PDF.

---

## Phase 7: Payment Integration (Weeks 12–13)

- [ ] Flutterwave integration (Visa, Mastercard, international)
- [ ] MTN MoMo Rwanda
- [ ] Airtel Money Rwanda
- [ ] Payment status webhooks
- [ ] Payment confirmation notifications
- [ ] Manual payment recording (cash, bank transfer)
- [ ] Payment history and receipts

**Deliverable:** Multi-channel payment processing.

---

## Phase 8: Staff Management (Week 14)

- [ ] Staff profiles (protocol, drivers, translators, etc.)
- [ ] Document management
- [ ] Availability calendar
- [ ] Skills and languages
- [ ] Rating system
- [ ] Staff assignment to requests
- [ ] Assignment notifications

**Deliverable:** Staff management with assignment workflow.

---

## Phase 9: Task Management (Week 15)

Port from Alpha Bridge System:
- [ ] Projects (linked to service requests)
- [ ] Tasks with subtasks
- [ ] Kanban board view
- [ ] Calendar view
- [ ] Team assignments
- [ ] Deadlines and priorities
- [ ] Task comments
- [ ] Progress tracking
- [ ] Task notifications

**Deliverable:** Project and task management module.

---

## Phase 10: Announcements & Calendar (Week 16)

### Announcements (port from Manukeza)
- [ ] Compose with templates
- [ ] Schedule or send immediately
- [ ] WhatsApp broadcast with attachments
- [ ] Email broadcast
- [ ] Target groups: clients, staff, vendors
- [ ] Serial reference numbers
- [ ] Cron-based scheduled processing

### Calendar
- [ ] Events, assignments, meetings, deadlines
- [ ] Calendar UI (month/week/day views)
- [ ] Google Calendar sync (OAuth2)

**Deliverable:** Communication and scheduling modules.

---

## Phase 11: Reports & CMS (Week 17)

### Reports
- [ ] Revenue reports (PDF + Excel export)
- [ ] Service popularity reports
- [ ] Staff performance reports
- [ ] Client reports
- [ ] Payment reports
- [ ] Date range filters

### CMS Admin
- [ ] Blog post management
- [ ] Gallery management
- [ ] Testimonials management
- [ ] FAQ management
- [ ] Site settings

**Deliverable:** Reporting and content management.

---

## Phase 12: Security, Polish & Production (Weeks 18–20)

### Security
- [ ] Activity logs and audit trails
- [ ] Encrypted document storage
- [ ] Rate limiting (per route)
- [ ] 2FA for all admin roles
- [ ] Input sanitization
- [ ] CSRF protection
- [ ] File upload validation

### Production
- [ ] Hostinger shared hosting deployment
- [ ] SSL configuration
- [ ] Cron jobs (scheduler, queue, backups)
- [ ] Error monitoring
- [ ] Performance optimization (caching, lazy loading)
- [ ] Final UI polish and accessibility
- [ ] User acceptance testing
- [ ] Documentation handover

**Deliverable:** Production-ready platform on Hostinger.

---

## Priority Matrix

| Priority | Module | Business Impact |
|----------|--------|----------------|
| P0 | Public Website + Landing | Brand presence |
| P0 | Service Request Workflow | Core revenue driver |
| P0 | Notifications (WhatsApp) | Client communication |
| P1 | Admin Dashboard + Review | Operations efficiency |
| P1 | Quotations | Revenue conversion |
| P1 | Payments | Revenue collection |
| P2 | Client Portal | Client self-service |
| P2 | Staff Management | Service delivery |
| P2 | Task Management | Internal operations |
| P3 | Announcements | Marketing/comms |
| P3 | Calendar | Scheduling |
| P3 | Reports | Business intelligence |
| P3 | CMS (Blog/Gallery) | Content marketing |

---

## Tech Debt & Future Enhancements

- Migrate from shared hosting to VPS when traffic grows
- PostgreSQL migration (VPS only)
- AWS S3 for file storage
- Redis for queues and caching
- Real-time notifications (WebSockets/Pusher)
- Mobile app (React Native)
- Multi-language support (Kinyarwanda, French, English)
- AI-powered quotation suggestions
- Client review/rating system post-event
