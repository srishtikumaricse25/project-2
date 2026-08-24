# Database Design Document
## Donation & Reuse Platform — DonateEase

**Version:** 1.0

---

## 1. Core Entities

`User`, `DonorProfile`, `Organization`, `Beneficiary`, `Donation`, `DonationItem`, `CollectionRequest`, `PickupAssignment`, `Location`, `Category`, `OrganizationRequirement`, `Notification`, `Complaint`, `Verification`, `Distribution`, `AuditLog`

---

## 2. Entity-Relationship Overview

```
USER
 │
 ├── DONOR_PROFILE
 │       │
 │       └── DONATION
 │              │
 │              ├── DONATION_ITEM
 │              │
 │              ├── COLLECTION_REQUEST
 │              │       │
 │              │       └── PICKUP_ASSIGNMENT
 │              │
 │              └── DISTRIBUTION
 │
 └── ORGANIZATION
         │
         ├── VERIFICATION
         ├── ORGANIZATION_REQUIREMENT
         └── DISTRIBUTION
```

---

## 3. Table Definitions

### 3.1 `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Auto-incrementing or UUID primary key |
| role | TEXT / ENUM | `donor`, `ngo`, `beneficiary`, `collection_partner`, `admin`, `super_admin` |
| name | TEXT | Full user or contact name |
| email | TEXT UNIQUE | Unique login email |
| phone | TEXT | Contact phone number |
| password_hash | TEXT | Bcrypt hashed password |
| city | TEXT | Primary city |
| pin_code | TEXT | Postal PIN code |
| is_verified | INTEGER / BOOLEAN | Email/phone verification status |
| is_active | INTEGER / BOOLEAN | Account active status (`1`/`ACTIVE` vs `0`/`SUSPENDED`) |
| donation_count | INTEGER | Denormalized count of total donations created |
| completed_donations | INTEGER | Denormalized count of completed donations |
| impact_score | INTEGER | Derived karma score |
| failed_login_attempts | INTEGER | Counter for security lockout (FR-AUTH-04) |
| locked_until | TEXT / TIMESTAMPTZ | ISO timestamp for account unlock |
| created_at | TEXT / TIMESTAMPTZ | Creation timestamp |
| updated_at | TEXT / TIMESTAMPTZ | Last update timestamp |

### 3.2 `organizations`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| user_id | INTEGER / UUID FK → users | Linked user account |
| org_name | TEXT | Legal or brand name |
| registration_number | TEXT UNIQUE | Government registration ID |
| contact_person | TEXT | Primary contact name |
| phone | TEXT | Contact phone |
| email | TEXT | Official email |
| address | TEXT | Registered office address |
| city | TEXT | Primary city |
| service_area | TEXT / JSON | Service PIN codes or city names |
| org_type | TEXT / ENUM | `ngo`, `orphanage`, `shelter`, `old_age_home`, `community_org`, `other` |
| website | TEXT | Organization URL |
| verification_status | TEXT / ENUM | `pending`, `under_review`, `verified`, `rejected`, `suspended` |
| verification_notes | TEXT | Compliance/audit notes |
| verified_by | INTEGER / UUID FK → users | Admin user who reviewed |
| verified_at | TEXT / TIMESTAMPTZ | Timestamp of verification |
| accepted_categories | TEXT / JSON | Array of category IDs |
| created_at | TEXT / TIMESTAMPTZ | Creation timestamp |
| updated_at | TEXT / TIMESTAMPTZ | Last update timestamp |

### 3.3 `categories`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| name | TEXT UNIQUE | Category title (e.g., Clothing, Books) |
| slug | TEXT UNIQUE | URL-friendly identifier |
| description | TEXT | Detailed description |
| icon | TEXT | Emoji or icon class |
| accepted_conditions | TEXT / JSON | Array of accepted conditions |
| is_active | INTEGER / BOOLEAN | Active flag |
| sort_order | INTEGER | Display priority |
| created_at | TEXT / TIMESTAMPTZ | Creation timestamp |

### 3.4 `item_types`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| category_id | INTEGER / UUID FK → categories | Parent category |
| name | TEXT | Item name (e.g. Shirts, Jackets, Novels) |
| slug | TEXT | URL slug |
| is_active | INTEGER / BOOLEAN | Active status flag |

### 3.5 `donations`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| donation_id | TEXT UNIQUE | Human-readable code (e.g. `DON-2026-000182`) |
| donor_id | INTEGER / UUID FK → users | Donor user ID |
| organization_id | INTEGER / UUID FK → organizations | Matched NGO ID (nullable until assigned) |
| category_id | INTEGER / UUID FK → categories | Item category ID |
| item_type | TEXT | Specific item name |
| quantity | INTEGER | Quantity of items |
| condition | TEXT / ENUM | `new`, `like_new`, `good`, `fair`, `repair_required` |
| description | TEXT | Item description and donor notes |
| photos | TEXT / JSON | Array of photo URLs/paths |
| size_weight | TEXT | Size/weight estimate |
| status | TEXT / ENUM | Single source of truth status (§4) |
| pickup_address | TEXT | Street pickup address |
| pickup_city | TEXT | Pickup city |
| pickup_pin_code | TEXT | Pickup PIN code |
| pickup_date | TEXT | Preferred date |
| pickup_time_slot | TEXT | Preferred time slot |
| pickup_instructions | TEXT | Special instructions |
| pickup_contact_phone | TEXT | Contact phone number |
| rejection_reason | TEXT | NGO decline reason |
| cancellation_reason | TEXT | Donor cancellation reason |
| received_qty | INTEGER | Quantity received by NGO (FR-NGO-06) |
| accepted_qty | INTEGER | Quantity accepted by NGO |
| rejected_qty | INTEGER | Quantity rejected/damaged |
| distributed_qty | INTEGER | Quantity distributed to beneficiaries |
| distribution_date | TEXT | Date of distribution |
| distribution_notes | TEXT | Beneficiary & location notes |
| created_at | TEXT / TIMESTAMPTZ | Creation timestamp |
| updated_at | TEXT / TIMESTAMPTZ | Last update timestamp |

### 3.6 `donation_status_history` (Audit Log)
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| donation_id | INTEGER / UUID FK → donations | Target donation |
| from_status | TEXT | Previous state |
| to_status | TEXT | New state |
| changed_by | INTEGER / UUID FK → users | Actor who performed state change |
| notes | TEXT | Reason or automated log comment |
| created_at | TEXT / TIMESTAMPTZ | Immutable timestamp |

### 3.7 `donation_requests` (NGO Demand Requirements)
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| organization_id | INTEGER / UUID FK → organizations | Publishing NGO |
| category_id | INTEGER / UUID FK → categories | Target category |
| item_type | TEXT | Item needed |
| quantity_needed | INTEGER | Total quantity required |
| quantity_fulfilled | INTEGER | Quantity fulfilled so far |
| priority | TEXT / ENUM | `low`, `medium`, `high`, `urgent` |
| required_before | TEXT | Target deadline date |
| description | TEXT | Purpose and urgency description |
| beneficiary_category | TEXT | Grouping (e.g. `children`, `families`, `elderly`) |
| status | TEXT / ENUM | `active`, `partially_fulfilled`, `fulfilled`, `expired`, `cancelled` |
| created_at | TEXT / TIMESTAMPTZ | Creation timestamp |
| updated_at | TEXT / TIMESTAMPTZ | Last update timestamp |

### 3.8 `notifications`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| user_id | INTEGER / UUID FK → users | Recipient user ID |
| type | TEXT | Notification type (`donation_accepted`, `pickup_scheduled`, etc.) |
| title | TEXT | Short notification title |
| message | TEXT | Detailed notification message |
| donation_id | INTEGER / UUID FK → donations | Optional linked donation |
| is_read | INTEGER / BOOLEAN | Read flag (`0` / `1`) |
| created_at | TEXT / TIMESTAMPTZ | Creation timestamp |

### 3.9 `complaints`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| reporter_id | INTEGER / UUID FK → users | User filing issue |
| donation_id | INTEGER / UUID FK → donations | Optional related donation |
| type | TEXT / ENUM | `pickup_not_completed`, `wrong_status`, `damaged_items`, `misrepresentation`, `ngo_misconduct`, `partner_misconduct`, `harassment`, `fraudulent_account`, `other` |
| description | TEXT | Detailed complaint description |
| status | TEXT / ENUM | `open`, `under_review`, `resolved`, `rejected` |
| resolution | TEXT | Admin resolution notes |
| resolved_by | INTEGER / UUID FK → users | Admin user ID |
| created_at | TEXT / TIMESTAMPTZ | Submission timestamp |
| resolved_at | TEXT / TIMESTAMPTZ | Resolution timestamp |

### 3.10 `pickup_slots`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| slot_label | TEXT | Display label (e.g., Morning 9:00 - 11:00) |
| start_time | TEXT | Start time |
| end_time | TEXT | End time |
| is_active | INTEGER / BOOLEAN | Active flag |

### 3.11 `prohibited_items`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER / UUID PK | Primary key |
| name | TEXT | Prohibited item name |
| description | TEXT | Rationale / description |
| created_at | TEXT / TIMESTAMPTZ | Creation timestamp |

---

## 4. Donation Status Enum (Single Source of Truth)

```
DRAFT, SUBMITTED, PENDING_ACCEPTANCE, ACCEPTED, PICKUP_SCHEDULED,
PICKUP_ASSIGNED, PICKED_UP, RECEIVED, SORTED, DISTRIBUTED, COMPLETED,
CANCELLED, REJECTED, EXPIRED, FAILED_PICKUP, DISPUTED
```

This enum is the single source of truth for donation state machine transitions across backend services, audit logs, and frontend components.

---

## 5. Sample Record Format

```json
{
  "donationId": "DON-2026-000182",
  "donorId": 2,
  "organizationId": 1,
  "categoryId": 2,
  "itemType": "Winter Jackets",
  "quantity": 5,
  "condition": "good",
  "pickup": {
    "address": "12 Marine Drive, Apartment 5A",
    "city": "Mumbai",
    "pinCode": "400002",
    "date": "2026-08-12",
    "timeSlot": "Morning (9:00 - 11:00)"
  },
  "status": "pickup_scheduled"
}
```

---

## 6. Indexing Guidance

- `donations(status)`, `donations(donor_id)`, `donations(organization_id)`, `donations(donation_id)` — for fast dashboard, detail, and search queries.
- `organizations(verification_status, city)` — for donor-facing NGO discovery.
- `donation_status_history(donation_id)` — for rapid per-donation audit trail retrieval.
- `notifications(user_id, is_read)` — for real-time unread count queries.
- `users(email)` and `users(role)` — for fast login and user moderation filtering.

---

## 7. Data Integrity Rules

1. **Foreign Keys**: Enforced at the database level (`ON DELETE RESTRICT` / `CASCADE`).
2. **State Machine Transitions**: Transitions validated against allowed transition matrix before commit.
3. **Deletion Restriction (FR-DON-05)**: Hard deletion blocked for donations in `completed` status to preserve audit trails and impact statistics.
4. **Account Lockout (FR-AUTH-04)**: 5 consecutive failed login attempts automatically trigger temporary account lockout.
