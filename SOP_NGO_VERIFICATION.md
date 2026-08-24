# NGO Verification — Standard Operating Procedure (SOP)
## Donation & Reuse Platform — DonateEase

**Version:** 1.0 | **Owner:** Trust & Safety / Admin Team

---

## 1. Purpose

Ensure only legitimate, accountable organizations are shown to donors as verified recipients, protecting donors and beneficiaries from fraud and misuse.

---

## 2. Verification Statuses & Lifecycle

```
PENDING → UNDER_REVIEW → VERIFIED
                        → REJECTED
VERIFIED → SUSPENDED (if issues arise post-verification)
```

**Core Rule:** Only `VERIFIED` organizations are discoverable by donors in public search results and eligible to accept item donations or publish demand requirements.

---

## 3. Required Information & Documentation

During organization registration (`/register?role=ngo`), the following fields and documents are captured:
- Organization name and government registration number
- Primary contact person, phone number, and official email address
- Registered office address, city, and service area PIN codes
- Organization type (`ngo`, `orphanage`, `shelter`, `old_age_home`, `community_org`, `other`)
- Supporting legal registration/incorporation documents (PDF/images)
- Official website URL or social media presence

---

## 4. Step-by-Step Review Protocol

1. **Intake Queue:** New organization registrations automatically enter status `PENDING` (`FR-NGO-02`). Automated validation ensures all required fields are present.
2. **Move to Active Review:** Admin selects an organization from the verification queue; status transitions to `UNDER_REVIEW`.
3. **Document Authenticity Review:** Admin cross-references registration number against official charity registries, verifies document validity, and checks address consistency.
4. **Contact Verification:** Confirm contact phone number and email are operational; verification call or email dispatched for first-time organizations.
5. **Risk Check:** Cross-check organization name and registration number against internal complaint/dispute history (`complaints` table).
6. **Decision Execution (`PATCH /api/admin/organizations/:id/verify`):**
   - **Approve**: Set status to `VERIFIED`; user `is_verified` flag set to `1`. In-app notification sent to NGO. Organization becomes discoverable in search (`FR-NGO-03`).
   - **Reject**: Set status to `REJECTED`; mandatory `verification_notes` entered. In-app notification with deficiency reasons sent to NGO.
   - **Suspend**: Set status to `SUSPENDED`; organization immediately hidden from public directory and blocked from accepting new donations.
7. **Audit Trail Logging**: All decisions write an immutable record to `donation_status_history` and `audit_logs` containing `verified_by` admin ID, decision status, notes, and timestamp.

---

## 5. Post-Verification Monitoring & Suspension

Verified organizations are subjected to ongoing automated and manual monitoring:
- **Complaint Trigger**: A complaint filed against an NGO automatically flags the organization for Trust & Safety review.
- **Anomalous Patterns**: System flags high rejection rates, non-distribution rates, or unfulfilled pickup requests.
- **Immediate Suspension**: Admin can transition status to `SUSPENDED` at any time, immediately revoking public search listing and donation acceptance privileges.

---

## 6. Turnaround SLA & Admin KPIs

- Initial verification review targets **2–3 business days (48–72 hours)** from submission.
- Pending verifications count is tracked as a core Admin KPI (`stats.pendingVerifications` in `FR-ADM-05`).

---

## 7. Rejection, Feedback & Reapplication

- Rejected organizations receive specific feedback in their notification message and profile portal.
- Organizations may reapply once documentation deficiencies are addressed. Prior rejection notes and audit logs remain permanently accessible to reviewing admins.

---

## 8. Fraud Escalation Protocol

Suspected fraudulent registrations (e.g. fake registration numbers, identity theft, or charity impersonation) must be escalated:
1. Immediately suspend account (`is_active = 0`).
2. Mark verification status as `REJECTED`.
3. Escalate to Trust & Safety Leadership per Security Incident Response (`SECURITY.md` §10).
