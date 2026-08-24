# Security & Privacy / Data Protection Document
## Donation & Reuse Platform — DonateEase

**Version:** 1.0

---

## 1. Authentication Security

- **Password Storage**: Passwords hashed using bcrypt with adaptive cost factor (12 rounds). Passwords are never stored in plaintext or reversibly encrypted.
- **Session Tokens**: JWT access tokens signed with a secret key (`JWT_SECRET`). Token expiry set to 7 days (`JWT_EXPIRES_IN`). Token transmitted via HTTP `Authorization: Bearer <token>` header or `httpOnly`, `sameSite=lax` cookie.
- **Account Verification**: Email/phone verification required prior to account activation.
- **Rate Limiting**: Rate limiting applied to `/api/auth/login`, `/api/auth/register`, and `/api/auth/forgot-password` to slow credential stuffing.
- **Account Lockout (FR-AUTH-04)**: Progressive delay and lockout enforced after 5 consecutive failed login attempts (`failed_login_attempts` counter and `locked_until` timestamp in database).

---

## 2. Authorization (RBAC)

**Roles:** `donor`, `ngo`, `beneficiary`, `collection_partner`, `admin`, `super_admin`.

**Core Rule:** Every mutating and sensitive read endpoint re-checks user role and resource ownership **server-side** (`getUserFromRequest()` & `requireAuth()`). Frontend role checks are UX hints only — never security boundaries.

### Ownership & Role Matrix

| Endpoint | DONOR | NGO | COLLECTION_PARTNER | ADMIN |
|---|---|---|---|---|
| `POST /api/donations` | ✅ (Own) | ❌ | ❌ | ✅ |
| `GET /api/donations` | ✅ (Own list) | ✅ (Assigned list) | ✅ (Assigned list) | ✅ (All) |
| `GET /api/donations/:id` | ✅ (Own) | ✅ (Assigned) | ✅ (Assigned) | ✅ (All) |
| `PATCH /api/donations/:id` | ✅ (Draft/Cancel) | ✅ (Accept/Receive/Distribute) | ✅ (Pick up) | ✅ (All) |
| `DELETE /api/donations/:id` | ✅ (Draft only) | ❌ | ❌ | ✅ (Except Completed) |
| `PATCH /api/admin/users` | ❌ | ❌ | ❌ | ✅ |
| `PATCH /api/admin/organizations/:id/verify` | ❌ | ❌ | ❌ | ✅ |
| `PATCH /api/complaints` | ❌ | ❌ | ❌ | ✅ |

- Donors can only modify or cancel their own `submitted`/`pending_acceptance` donations.
- Completed donations **cannot** be deleted by donors or admins (FR-DON-05).
- NGOs can only accept or update status on donations assigned to their organization.

---

## 3. Privacy Requirements

Sensitive data categories requiring protection:
- Donor phone number
- Donor pickup address
- Beneficiary personal information
- NGO registration papers & identification documents

### Privacy Principles
1. **Beneficiary PII**: Beneficiary personal information is never publicly searchable or exposed to donors. Only aggregated beneficiary categories (e.g. `children`, `families`) are stored.
2. **Donor Address Privacy**: Donor pickup addresses (`locations.is_private = true`) are exposed only to:
   - The donor themself
   - The matched/accepted NGO
   - The assigned collection partner
   - Admin (for complaint investigation)
3. **Public NGO Directory**: Unverified NGOs (`verification_status = pending | under_review | rejected | suspended`) are hidden from public search results and visible only to Admins and the owning NGO.

---

## 4. File Upload Security

- **File Type Validation**: Content magic-byte validation (MIME-type check) enforced for photos and verification documents.
- **File Size Limits**: Max 5MB per photo; max 10MB per document upload.
- **Storage Strategy**: Files stored in private Cloud Object Storage buckets; served via short-lived signed URLs.
- **Access Scope**: NGO verification documents accessible only to the uploading organization and Admins.

---

## 5. Application Security Controls

| Threat | Mitigation Control |
|---|---|
| **SQL Injection** | Parameterized SQL queries exclusively (`better-sqlite3` prepared statements / Prisma); string concatenation strictly forbidden |
| **XSS (Cross-Site Scripting)** | React output encoding, Content-Security-Policy (CSP) headers, rich-text sanitization |
| **CSRF** | `SameSite=Lax` cookie flags + Bearer JWT token authentication |
| **IDOR (Insecure Direct Object Reference)** | Every resource endpoint verifies that the requester owns or is explicitly assigned to the resource ID |
| **Broken Auth Bypass** | Centralized `requireAuth` middleware applied to all protected API routes (deny-by-default) |
| **Rate Abuse** | Rate limiting on login, registration, donation submission, and complaint endpoints |
| **Excessive Data Exposure** | Explicit DTO serialization — API responses strip sensitive database fields (e.g. `password_hash`, private documents) |

---

## 6. Data Retention & Deletion

- **Completed Donations**: Retained indefinitely for auditability, dispute resolution, and impact scoring (FR-DON-05). Hard-deletion is blocked.
- **Audit Logs**: Retained in `donation_status_history` and `audit_logs` tables.
- **Account Anonymization**: When a user requests account deletion, PII fields (`name`, `email`, `phone`, `address`) are anonymized while preserving aggregate donation metrics.

---

## 7. Audit Logging

Every state-changing action writes an immutable audit record to `donation_status_history` containing:
- `donation_id`: Target donation ID
- `from_status` & `to_status`: State transition
- `changed_by`: User ID of actor
- `notes`: Reason or automated description
- `created_at`: Immutable UTC timestamp

Audit logs are queryable by Admins and visible on the donation detail timeline.

---

## 8. Legal & Compliance Considerations (India Deployment)

For deployment in India:
- Privacy Policy & Terms of Service
- Donation policy & prohibited-item policy
- Organization verification guidelines
- Explicit user consent for storing location and contact information
- Dispute resolution mechanism via Admin complaints panel (FR-CMP-01 / FR-ADM-04)

---

## 9. Security Testing Checklist

- [x] Server-side RBAC guards on all mutating routes
- [x] Account lockout after 5 failed login attempts
- [x] Parameterized SQL query audit across all API routes
- [x] Completed donation deletion prevention (FR-DON-05)
- [x] Donor address privacy restricted to matched NGO/Admin
- [x] Password hashing using bcrypt (cost factor 12)
- [x] JWT token validation and expiration handling
