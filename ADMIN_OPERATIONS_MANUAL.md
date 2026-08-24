# Admin Operations Manual
## Donation & Reuse Platform — DonateEase

**Version:** 1.0 | **Owner:** Operations & Trust & Safety Team

---

## 1. Admin Dashboard Control Center

```
                 ADMIN DASHBOARD
Users        NGOs       Donations       Pickups
12,420       284        18,540          4,820
------------------------------------------------
Pending NGO Verification         14
Pending Beneficiary Verification  8
Open Complaints                    6
Failed Pickups                    12
------------------------------------------------
Donations by City
Patna          █████████
Delhi          ███████
Mumbai         ██████
Bengaluru      █████
```

The Admin Dashboard ([/dashboard/admin](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/src/app/dashboard/admin/page.js)) serves as the primary operational control center for platform moderators and system administrators.

---

## 2. Operational Modules & Workflows

### 2.1 User Management & Moderation ([/dashboard/admin/users](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/src/app/dashboard/admin/users/page.js))
- **Search & Filter**: Query registered users by name, email, phone, city, or role (`donor`, `ngo`, `admin`).
- **Account Suspension**: Suspend account access (`is_active = 0`) via `PATCH /api/admin/users` if terms of service or safety guidelines are violated.
- **Account Reactivation**: Restore suspended user access (`is_active = 1`).
- **History Inspection**: Review a user's donation history, completed deliveries, and associated complaint logs prior to taking administrative actions.

### 2.2 NGO Verification Queue ([/dashboard/admin/organizations](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/src/app/dashboard/admin/organizations/page.js))
- Follow the 7-step review protocol detailed in [SOP_NGO_VERIFICATION.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/SOP_NGO_VERIFICATION.md).
- Actions: Approve (`VERIFIED`), Decline (`REJECTED`), Request Additional Documents, or `SUSPEND` active verified organizations via `PATCH /api/admin/organizations/:id/verify`.

### 2.3 Donation Moderation & Disputed Records
- **Search & Audit**: Search donations across all states (`submitted`, `accepted`, `pickup_scheduled`, `picked_up`, `received`, `distributed`, `completed`, `cancelled`).
- **Dispute Investigation**: Cross-reference state transition audit logs (`donation_status_history`) and timeline notes.
- **Cancellation of Fraudulent Offers**: Cancel fake or fraudulent donations with recorded cancellation notes.
- **NGO Reassignment**: Reassign accepted donations if the assigned NGO becomes suspended or unresponsive.
- **Immutability Enforcement**: Completed donations (`status = completed`) cannot be deleted (FR-DON-05).

### 2.4 Category & Prohibited Items Management ([/dashboard/admin/categories](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/src/app/dashboard/admin/categories/page.js))
- Create, edit, and toggle item categories and sub-item types without requiring a code re-deployment (`/api/categories`).
- Configure accepted item conditions per category (`new`, `like_new`, `good`, `fair`).
- Maintain the dynamic prohibited items list (`/api/prohibited-items`) (FR-ADM-03).

### 2.5 Complaint & Dispute Resolution ([/dashboard/admin/complaints](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/src/app/dashboard/admin/complaints/page.js))
1. **Intake**: New issue enters state `OPEN`.
2. **Review**: Admin reviews complaint description, reporter credentials, and linked donation history (`status → UNDER_REVIEW`).
3. **Investigation**: Admin contacts involved parties (donor, NGO, collection partner) for clarification.
4. **Resolution (`PATCH /api/complaints`)**: Record resolution notes and close complaint as `RESOLVED` or `REJECTED`.
5. **Repeat Offender Trigger**: Repeated substantiated complaints against an organization or user trigger account suspension review.

### 2.6 Reporting & Analytics KPIs ([/api/admin/stats](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/src/app/api/admin/stats/route.js))
Track platform performance using standard KPI definitions:

$$\text{Repeat Donation Rate} = \left( \frac{\text{Users with } \ge 2 \text{ completed donations}}{\text{Users with } \ge 1 \text{ completed donation}} \right) \times 100$$

$$\text{Pickup Success Rate} = \left( \frac{\text{Completed Pickups}}{\text{Scheduled Pickups}} \right) \times 100$$

$$\text{Donation Completion Rate} = \left( \frac{\text{Completed Donations}}{\text{Submitted Donations}} \right) \times 100$$

---

## 3. RBAC Role Boundaries

| Administrative Action | ADMIN | SUPER_ADMIN |
|---|---|---|
| Approve / Reject NGO Verification | ✅ | ✅ |
| Suspend / Reactivate User or Organization | ✅ | ✅ |
| Create & Manage Item Categories | ✅ | ✅ |
| Resolve Complaints & Disputes | ✅ | ✅ |
| Manage Other Admin User Accounts | ❌ | ✅ |
| Full Database & Audit Log Export | ❌ | ✅ |
| Platform System Configuration | ❌ | ✅ |

---

## 4. Daily Admin Operational Checklist

- [ ] **Verification Queue**: Review and process pending NGO verification submissions (target SLA: 48–72h).
- [ ] **Open Complaints**: Process newly filed complaints in `OPEN` status.
- [ ] **Pickup Failure Spikes**: Check `failed_pickup` status alerts and investigate logistic bottlenecks.
- [ ] **Account Lockout Audits**: Inspect failed login attempt spikes (`failed_login_attempts >= 5`).
- [ ] **Disputed Donations**: Spot-check flagged items and verify audit trail timeline completeness.

---

## 5. Escalation Protocols

- **Child / Vulnerable Beneficiary Safety**: Immediately escalate suspected safety or minor abuse issues to Trust & Safety leadership.
- **Data Breach / Compromise**: Follow Security Incident Response protocols ([SECURITY.md](file:///c:/Users/HP/OneDrive/Desktop/projectt%202/donate-ease/SECURITY.md) §10).
- **Legal Inquiries**: Direct formal regulatory or legal inquiries to the designated legal compliance officer.
