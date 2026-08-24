# 🎁 DonateEase — Donation & Reuse Platform

A full-stack web application connecting generous donors with verified NGOs, orphanages, and community trusts for seamless donation of reusable clothes, books, bedding, and household items.

---

## 🏗️ Architecture & Documentation

- **[PRD.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/PRD.md)** — Product Requirements Document & Feature Compliance Matrix (100% Implemented Audit).
- **[ARCHITECTURE.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/ARCHITECTURE.md)** — Complete Technical Architecture Document (Three-Tier Modular Monolith, Stack Rationale, Module Structure, Event Flow, Scalability Path, and ADRs).
- **[DATABASE.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/DATABASE.md)** — Full Database Design Document (Schema, Entity-Relationship Diagram, Table Definitions, Status State Enums, Indexing Guidance, Data Integrity Rules).
- **[API.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/API.md)** — REST API v1 Specification Document (Endpoints, Request/Response Payloads, Authentication, RBAC, Status Transitions, and Error Codes).
- **[SECURITY.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/SECURITY.md)** — Security & Privacy Document (Authentication Security, Server-Side RBAC Guards, Data Protection, File Upload Security, Application Controls, and Audit Logging).
- **[TEST_PLAN.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/TEST_PLAN.md)** — Comprehensive Test Plan & Requirement Traceability Matrix (Unit, Integration, E2E, Security, Performance, Accessibility, Given/When/Then Acceptance Criteria, and Defect Classification).
- **[DEPLOYMENT.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/DEPLOYMENT.md)** — Deployment Guide (Infrastructure Architecture, CI/CD Pipeline, Environment Variables, Database Migrations, Release Process, Rollback Strategy, and Disaster Recovery).
- **[SOP_NGO_VERIFICATION.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/SOP_NGO_VERIFICATION.md)** — NGO Verification Standard Operating Procedure (Status Lifecycles, Review Protocol, Post-Verification Monitoring, SLA Targets, Reapplication, and Fraud Escalation).
- **[ADMIN_OPERATIONS_MANUAL.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/ADMIN_OPERATIONS_MANUAL.md)** — Admin Operations Manual (Control Center Modules, User Moderation, Dispute Handling, Category Rules, KPI Formulas, RBAC Boundaries, Daily Checklist, and Escalation Protocols).
- **[PRODUCT_ROADMAP.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/PRODUCT_ROADMAP.md)** — Product Roadmap (MVP Phase 1, Phase 2 Operational Depth, Phase 3 Intelligence & Scale, Cross-Cutting Workstreams, and Strategic Sequencing Rationale).

---

## 🌟 Key Features

- **Multi-Role Authentication & Security**: Secure JWT authentication, server-enforced Role-Based Access Control (`donor`, `ngo`, `admin`), account lockout after 5 failed login attempts (FR-AUTH-04), and password reset flow.
- **Donor Portal**: 5-step donation creation wizard, real-time item tracking, status timeline audit logs, donor karma impact scoring, cancellation controls, and dispute filing.
- **NGO Portal**: Organization verification workflow, incoming donation management panel, received/accepted/distributed quantity ledger (FR-NGO-06), demand request publisher with priority tags (FR-NGO-05), and service area configuration.
- **Admin Control Panel**: Real-time KPI analytics overview (FR-ADM-05), user moderation & account suspension (FR-ADM-02), NGO compliance verification queue (FR-ADM-01), dispute resolution panel (FR-ADM-04), and category/prohibited items rule manager (FR-ADM-03).
- **Design System**: Emerald/Teal responsive design system built with Vanilla CSS variables, dark mode elements, status badges, empty states, modals, and toasts.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Database**: SQLite (`better-sqlite3`) with PostgreSQL migration schema
- **Authentication**: Custom JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`)
- **Styling**: Custom CSS Design System ([globals.css](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/src/app/globals.css))

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
```bash
node src/lib/seed.js
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@donateease.org` | `admin123` |
| **Donor** | `priya@example.com` | `password123` |
| **NGO** | `hope@example.com` | `password123` |

---

## 🧪 Build & Verification

To test the production build:
```bash
npm run build
```
All static and dynamic routes compile with 0 errors.
