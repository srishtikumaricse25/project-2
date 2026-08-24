# API Documentation
## Donation & Reuse Platform — REST API v1

**Base URL:** `http://localhost:3000/api` (Dev) / `https://api.donateease.org/api` (Prod)
**Format:** JSON over HTTPS
**Auth:** Bearer JWT Header (`Authorization: Bearer <token>`) or Cookie

---

## 1. Conventions

- All list endpoints support `?page=&limit=` pagination and return `{ data, page, limit, total }`.
- All timestamps are ISO 8601 UTC format.
- Errors return `{ "error": "Message string" }` or `{ "error": { "code": "...", "message": "..." } }` with an appropriate HTTP status.
- Every mutating endpoint requires a valid JWT; user role is verified server-side against the RBAC permissions matrix.

---

## 2. Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new Donor or NGO account |
| POST | `/api/auth/login` | Public | Login with email & password, returns JWT token |
| GET | `/api/auth/me` | Authenticated | Fetch current authenticated user & organization profile |
| POST | `/api/auth/logout` | Authenticated | Logout current session |
| POST | `/api/auth/forgot-password` | Public | Request password reset instructions |
| POST | `/api/auth/reset-password` | Public (with token) | Set a new password |

### Register Request Example
```json
{
  "role": "donor",
  "name": "Srishti Kumar",
  "email": "srishti@example.com",
  "phone": "9876543210",
  "password": "password123",
  "city": "Patna",
  "pin_code": "800001"
}
```

### Login Response Example
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "role": "donor",
    "city": "Mumbai",
    "donation_count": 3,
    "completed_donations": 1,
    "impact_score": 10
  }
}
```

---

## 3. Donations Lifecycle

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/donations` | DONOR | Create a donation (status → `submitted`) |
| GET | `/api/donations` | DONOR (own), NGO (assigned), ADMIN (all) | List donations, filterable by `status`, `page`, `limit` |
| GET | `/api/donations/:id` | Owner, assigned NGO, ADMIN | Fetch donation detail + audit log history |
| PATCH | `/api/donations/:id` | DONOR, NGO, ADMIN | Transition donation status / record distribution quantities |
| DELETE | `/api/donations/:id` | DONOR, ADMIN | Cancel/delete donation; blocked if status is `completed` (FR-DON-05) |

### Create Donation Request Example
```json
{
  "category_id": 1,
  "item_type": "Jackets",
  "quantity": 5,
  "condition": "good",
  "description": "Clean winter jackets in great shape.",
  "organization_id": 1,
  "pickup_address": "12 Marine Drive, Apartment 5A",
  "pickup_city": "Mumbai",
  "pickup_pin_code": "400002",
  "pickup_date": "2026-08-12",
  "pickup_time_slot": "Morning (9:00 - 11:00)",
  "pickup_contact_phone": "9100000001"
}
```

### Status Transition Request Example — `PATCH /api/donations/:id`
```json
{
  "status": "accepted",
  "notes": "Accepted by Hope Foundation Trust"
}
```

### Record Distribution Request Example — `PATCH /api/donations/:id`
```json
{
  "status": "distributed",
  "received_qty": 5,
  "accepted_qty": 5,
  "rejected_qty": 0,
  "distributed_qty": 5,
  "distribution_notes": "Distributed to 5 families in Ward 4 area."
}
```

---

## 4. Organizations (NGOs) & Demand Requirements

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/organizations` | Public / Authenticated | Search verified organizations (filter by `city`, `status`, `search`) |
| GET | `/api/organizations/:id` | Public / Authenticated | Organization profile, stats, and accepted categories |
| PATCH | `/api/organizations/:id` | NGO (own), ADMIN | Update organization profile, address, or accepted categories |
| GET | `/api/donation-requests` | Public / Authenticated | List published NGO item demands / requirements |
| POST | `/api/donation-requests` | Verified NGO | Publish a new item demand requirement (FR-NGO-05) |

---

## 5. Pickups & Time Slots

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/pickup-slots` | Public / Authenticated | Fetch active time slot options for pickup scheduling |
| GET | `/api/prohibited-items` | Public / Authenticated | Fetch prohibited items rules |
| POST | `/api/prohibited-items` | ADMIN | Add a new prohibited item rule (FR-ADM-03) |
| DELETE | `/api/prohibited-items` | ADMIN | Remove a prohibited item rule |

---

## 6. Admin Control Panel

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | ADMIN | Aggregate platform KPIs & analytics (FR-ADM-05) |
| GET | `/api/admin/users` | ADMIN | Search/filter users, view profile details (FR-ADM-02) |
| PATCH | `/api/admin/users` | ADMIN | Suspend or reactivate a user account |
| PATCH | `/api/admin/organizations/:id/verify` | ADMIN | Approve, reject, or suspend NGO verification (FR-ADM-01) |
| GET | `/api/categories` | Public / Authenticated | List item categories and item types |
| POST | `/api/categories` | ADMIN | Create new item category & sub-item types (FR-ADM-03) |

---

## 7. Complaints & Dispute Resolution

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/complaints` | Reporter (own), ADMIN (all) | List complaints, filterable by `status` |
| POST | `/api/complaints` | Authenticated | File a complaint linked to a donation or user (FR-CMP-01) |
| PATCH | `/api/complaints` | ADMIN | Update complaint status and resolution notes (FR-ADM-04) |

---

## 8. Notifications

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/notifications` | Authenticated | List user notifications (unread first) & count |
| PATCH | `/api/notifications/:id/read` | Authenticated | Mark a notification as read |
| PATCH | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |

---

## 9. Error Codes & HTTP Statuses

| HTTP | Code / Reason | Meaning |
|---|---|---|
| `400` | `Validation Error` | Request payload failed validation or missing required fields |
| `401` | `Unauthorized` | Missing, invalid, or expired JWT bearer token |
| `403` | `Forbidden / Account Locked` | User lacks role permission or account is locked/suspended |
| `404` | `Not Found` | Requested resource does not exist |
| `409` | `Conflict / Duplicate` | Email already registered or category name conflict |
| `500` | `Server Error` | Internal server exception |

---

## 10. API Versioning

Path-prefixed versioning is supported for future breaking changes: `/api/v1/...`. All endpoints above are implicitly `v1`.
