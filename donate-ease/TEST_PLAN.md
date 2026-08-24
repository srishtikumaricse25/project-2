# Test Plan
## Donation & Reuse Platform — DonateEase

**Version:** 1.0

---

## 1. Objectives

Verify that the platform meets the functional requirements in `SRS.md`, the business rules in `PRD.md`, the architecture in `ARCHITECTURE.md`, and the security/privacy requirements in `SECURITY.md`, prior to each release.

---

## 2. Test Levels

### 2.1 Unit Testing
Scope: Individual services and functions in isolation.
- **Authentication**: Password hashing (`bcryptjs`), JWT token issuance & verification (`auth.js`), account lockout counter logic (FR-AUTH-04).
- **Donation Validation**: Mandatory field checks (`category_id`, `item_type`, `quantity`, `condition`), prohibited item filtering (FR-DON-06).
- **Status State Machine**: Enforcing allowed status transitions (FR-DON-03).
- **Matching Algorithm**: Scoring NGOs by category, city, and active demands.
- **Input Validation**: Sanitizing input DTOs across all API routes.

### 2.2 Integration Testing
Scope: API route handlers, database transactions, and notification dispatch.
- **Frontend → API Contracts**: JSON payload & HTTP status verification across all 20+ API endpoints.
- **API → SQLite/PostgreSQL**: Transaction safety, foreign key constraint enforcement, and audit log generation (`donation_status_history`).
- **API → Object Storage**: Signed URL generation for photos and verification documents.
- **API → Notification Dispatch**: Decoupled in-app notification insertion and mock worker dispatch.
- **Slot Locking**: Concurrency-safe pickup time slot reservation.

### 2.3 End-to-End (E2E) Testing
Full automated end-to-end user journeys (e.g. Playwright / Cypress):

```
Register Donor → Verify Account → Create Donation → Select Category & Item Type
→ Select NGO → Schedule Pickup → NGO Accepts → Pickup Completed → NGO Receives
→ Record Distribution Quantities → Status COMPLETED → Impact Karma Updated
```

Additional E2E scenarios:
- **NGO Verification**: Register NGO → Upload registration details → Admin reviews queue → Admin verifies → NGO listed in public directory (FR-ADM-01).
- **Dispute Resolution**: User files complaint → Admin inspects complaints queue → Admin resolves with findings notes (FR-ADM-04).
- **Donor Cancellation**: Donor cancels pending donation → Status updated to `cancelled` with reason notes.
- **Completed Donation Deletion Prevention**: Attempting `DELETE /api/donations/:id` on a `completed` donation returns `400 Bad Request` (FR-DON-05).

### 2.4 Security Testing
Per `SECURITY.md`:
- Authentication bypass attempts on protected routes.
- IDOR checks: verifying donors/NGOs cannot access or modify unauthorized donation IDs.
- Rate limit verification on login & registration endpoints.
- SQL injection & XSS sanitization checks.
- Account lockout verification after 5 consecutive failed login attempts.

### 2.5 Performance Testing
- **Page Load & API Targets**: Common read endpoints (`/api/organizations`, `/api/donations`) target < 500ms response time under normal load; page load target < 3s.
- **Search Queries**: NGO directory search targets < 2s response time.
- **Concurrency**: Stress test pickup slot booking to prevent double-booking.

### 2.6 Accessibility Testing
- **Keyboard Navigation**: Full tab & keyboard navigation through forms, dashboards, and modals.
- **Screen Reader Compatibility**: ARIA labels on dynamic elements (Status Badges, Notification dropdown, Toast alerts).
- **Color Contrast**: WCAG AA contrast compliance for emerald/teal theme.

### 2.7 User Acceptance Testing (UAT)
Conducted in staging with pilot NGOs and test donors prior to production deployment.

---

## 3. Acceptance Criteria (Given / When / Then)

### 3.1 Donation Creation (FR-DON-01, FR-DON-02)
```gherkin
Given a registered and verified donor
When they submit a valid donation payload (category, item_type, quantity, condition, pickup details)
Then the system assigns a unique donation ID (DON-YYYY-XXXXXX), sets status to SUBMITTED, and logs the creation in donation_status_history
```

### 3.2 NGO Acceptance (FR-NGO-04)
```gherkin
Given an assigned or matched verified NGO
When the NGO accepts the incoming donation
Then the donation status becomes ACCEPTED, an audit log entry is written, and an in-app notification is sent to the donor
```

### 3.3 Pickup Scheduling (FR-PICK-01, FR-PICK-02)
```gherkin
Given an ACCEPTED donation
When the donor/NGO schedules a pickup slot
Then the slot is reserved, status becomes PICKUP_SCHEDULED, and double-booking on the same slot is prevented
```

### 3.4 Distribution & Completion (FR-NGO-06)
```gherkin
Given an NGO that has received the donated items
When the NGO records received, accepted, and distributed quantities with beneficiary notes
Then status transitions to DISTRIBUTED and then COMPLETED, and the donor's impact karma score increases
```

### 3.5 Server-Side Authorization Guard
```gherkin
Given an authenticated user with role DONOR
When they attempt to access or modify /api/admin/* endpoints
Then the API returns 403 FORBIDDEN regardless of frontend routing
```

---

## 4. Requirement Traceability Matrix (RTM)

| Requirement ID | Module / Feature | Test Type | Test Case Description |
|---|---|---|---|
| **FR-AUTH-01** | Auth | Integration | Register account with required fields |
| **FR-AUTH-04** | Auth | Security | Account lockout after 5 failed login attempts |
| **FR-DON-01** | Donations | E2E | Donor creates a multi-item donation |
| **FR-DON-02** | Donations | Unit | Generation of unique code `DON-YYYY-XXXXXX` |
| **FR-DON-03** | Donations | Unit | Enforce donation status state machine transitions |
| **FR-DON-05** | Donations | Integration | Prevent deletion of `completed` donations |
| **FR-DON-06** | Donations | Unit | Reject donations with prohibited items |
| **FR-NGO-01** | NGO | E2E | Organization registration flow |
| **FR-NGO-03** | NGO | Integration | Only `verified` NGOs appear in public directory |
| **FR-NGO-05** | NGO | E2E | NGO publishes demand requirements |
| **FR-NGO-06** | NGO | Integration | Record received/accepted/distributed quantities |
| **FR-PICK-01** | Pickups | Integration | Schedule pickup date and slot |
| **FR-PICK-02** | Pickups | Concurrency | Prevent double-booking on same slot |
| **FR-ADM-01** | Admin | E2E | Review NGO documents and update verification status |
| **FR-ADM-02** | Admin | Integration | Suspend / reactivate user account |
| **FR-ADM-03** | Admin | Integration | Add category and prohibited item rules |
| **FR-ADM-04** | Admin | E2E | Investigate and resolve user complaint |
| **FR-ADM-05** | Admin | Integration | Aggregate platform KPIs and analytics report |

---

## 5. Defect Severity Classification

| Severity | Definition | SLA / Resolution |
|---|---|---|
| **P0 (Blocker)** | Core donation flow broken, auth bypass, data loss, build failure | Immediate fix before any deployment |
| **P1 (Critical)** | Major feature broken with no workaround (e.g. NGO accept fails) | Resolve within 24 hours |
| **P2 (Major)** | Feature degraded, workaround exists (e.g. search filter glitch) | Resolve in current sprint |
| **P3 (Minor)** | Cosmetic or low-impact UI issue | Scheduled backlog item |

---

## 6. Verification Execution Summary

- **Production Build**: `npm run build` executed successfully (**0 errors across all 36 app routes**).
- **Database Seed**: Test database seeded with demo accounts for Admin, Donor, and NGO roles (`node src/lib/seed.js`).
