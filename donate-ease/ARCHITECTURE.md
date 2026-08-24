# Technical Architecture Document
## Donation & Reuse Platform — DonateEase

**Version:** 1.0

---

## 1. Architecture Overview

Three-tier, modular monolith-first architecture (splittable into microservices later as scale demands):

```
                    USERS
                      │
                      ▼
                NEXT.JS FRONTEND
                      │
                      ▼
                 API / BACKEND (App Router / NestJS)
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      PostgreSQL /  Redis       Object Storage
       SQLite (MVP)               │
          │           │           │
          └───────────┼───────────┘
                      │
                Notification Service
                      │
               Email / SMS Providers
```

---

## 2. Recommended Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js + React (App Router) | SSR/SSG for SEO on public NGO pages, strong DX, unified full-stack router |
| **UI System** | CSS Design System & Custom Tokens | Fast, consistent, mobile-first styling down to 360px viewports |
| **Data Fetching** | Native Fetch + Context API | Real-time state management, notifications, and auth context |
| **Backend API** | Next.js API Routes / NestJS | Modular, event-driven API endpoints with server-enforced RBAC. See [API.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/API.md) |
| **Database** | PostgreSQL (Prod) / SQLite (MVP) | Relational integrity across Donor → Donation → Items → Pickup → NGO → Distribution. See [DATABASE.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/DATABASE.md) |
| **ORM / Client** | Prisma / better-sqlite3 | Type-safe queries, migrations, transactional execution |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Secure bearer token auth, account lockout, role-based authorization guards. See [SECURITY.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/SECURITY.md) |
| **Cache & Queue** | Redis (Phase 2) / Event Emitter | Session store, rate limiting, slot-locking for pickup scheduling |
| **Storage** | S3-compatible (AWS S3 / Cloudflare R2) | Signed URLs for item photos & verification documents |
| **Maps & Geocoding** | Google Maps / Mapbox | Address geocoding, service-area PIN code matching |
| **Email** | Resend / AWS SES | Transactional notifications |
| **SMS / WhatsApp** | Twilio or local provider | Phase 2 SMS notification dispatch |
| **Monitoring & Logs** | Sentry & Audit Log History | Error tracking and immutable donation status history logging. See [TEST_PLAN.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/TEST_PLAN.md) |

*Rationale for relational DB over MongoDB:* The domain is heavily relational (`Donor → Donation → Items → Pickup → Organization → Distribution`), requiring strict transactional integrity, foreign key cascades, and audit reporting.

---

## 3. Backend Module Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/             # Stats, user moderation, NGO verification
│   │   ├── auth/              # Registration, login, me, account lockout, forgot password
│   │   ├── categories/        # Category & item types management
│   │   ├── complaints/        # Dispute lifecycle & resolution
│   │   ├── donation-requests/ # NGO demand publishing & fulfillment
│   │   ├── donations/         # Donation CRUD + lifecycle state machine
│   │   ├── notifications/     # Notification dispatch & read markers
│   │   ├── organizations/     # NGO profiles & directory
│   │   ├── pickup-slots/      # Time slot inventory
│   │   └── prohibited-items/  # Prohibited item rule engine
├── components/                # Modular UI design system components
├── contexts/                  # AuthContext & NotificationContext
└── lib/                       # Database connection, auth helpers, schema, seeders
```

### 3.1 Module Responsibilities

- **auth:** Issues/validates JWTs, manages password reset & verification tokens, enforces account lockout after 5 failed login attempts.
- **donations:** Owns the donation state machine (`DRAFT → SUBMITTED → PENDING_ACCEPTANCE → ACCEPTED → PICKUP_SCHEDULED → PICKED_UP → RECEIVED → SORTED → DISTRIBUTED → COMPLETED`). All state transitions write to an immutable audit log (`donation_status_history`).
- **organizations:** Owns NGO registration workflow, verification status (`PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`), and service-area PIN code matching. See [SOP_NGO_VERIFICATION.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/SOP_NGO_VERIFICATION.md).
- **pickups:** Manages time slot inventory (`pickup_slots`) and schedule locking to prevent double-booking.
- **distributions:** Manages received, accepted, rejected, and distributed quantity ledgers per donation record.
- **notifications:** Event-driven notification dispatch for key lifecycle events.
- **admin:** Cross-cutting analytics, user moderation, dispute resolution, and category management gated strictly by `admin` role. See [ADMIN_OPERATIONS_MANUAL.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/ADMIN_OPERATIONS_MANUAL.md).

---

## 4. Event-Driven Notification Flow

To decouple notification delivery from core transaction latency, state-changing services publish domain events:

```
Donation Service → emits "donation.accepted" event
        ↓
Notification Queue / In-App Event Handler
        ↓
Notification Worker → renders template → dispatches In-App / Email / SMS alert
```

---

## 5. Request Flow Example — Creating a Donation

```
1. Donor submits form (Frontend) → POST /api/donations
2. Auth Guard validates JWT bearer token and role = donor
3. Donations API validates payload (category_id, item_type, quantity, condition, prohibited items check)
4. Database transaction creates record in `donations` table (assigns ID: DON-YYYY-XXXXXX)
5. Audit log transaction writes to `donation_status_history` (status: NULL → SUBMITTED)
6. System emits `new_donation` notification to matched NGO / target organization
7. Response returns donation reference ID and status to Frontend
```

---

## 6. Scalability & Roadmap Path

```
1 City → 10 Cities → 100 Cities → Multi-Region Deployment
```

For the feature roadmap across phases (MVP Phase 1, Phase 2 Operational Depth, and Phase 3 Intelligence & Scale), see [PRODUCT_ROADMAP.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/PRODUCT_ROADMAP.md).

Supporting measures:
- Database indexing on `city`, `pin_code`, `category_id`, and `status` columns.
- Pagination (`limit` & `offset`) on all list endpoints.
- Caching for category lists, verified NGO directory, and slot availability.
- Cloud object storage for photos and verification documents.
- Stateless API routes suitable for horizontal auto-scaling.

---

## 7. Environments

For complete infrastructure specifications, CI/CD pipeline, environment variable keys, migration strategies, and disaster recovery procedures, see [DEPLOYMENT.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/DEPLOYMENT.md).

| Environment | Purpose |
|---|---|
| Local | Developer machines, Dockerized Postgres/Redis |
| Staging | Pre-production, mirrors prod config, used for QA/UAT |
| Production | Live traffic, monitored, backed up |

---

## 8. Key Architectural Decisions (ADR Summary)

| Decision | Alternative Considered | Reason Chosen |
|---|---|---|
| **PostgreSQL / Relational DB** | MongoDB | Transactional integrity across multi-entity donation workflows and immutable audit logs |
| **Next.js App Router Monolith** | Microservices from day 1 | Low operational overhead for MVP while keeping modular boundaries clean for future extraction |
| **Server-Enforced RBAC** | Frontend-only role checks | All endpoints validate JWT roles server-side; frontend checks are purely UX hints |
| **Event-Driven Notifications** | Synchronous delivery | Decouples third-party email/SMS provider latency from API response times |
| **Immutable Audit Log** | In-place status mutation only | Every state change is recorded in `donation_status_history` with actor ID and timestamp |
