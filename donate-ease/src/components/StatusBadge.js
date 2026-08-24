'use client';

export default function StatusBadge({ status, type = 'donation' }) {
  if (!status) return null;

  const donationStatusMap = {
    draft: { label: 'Draft', class: 'badge-neutral' },
    submitted: { label: 'Submitted', class: 'badge-info' },
    pending_acceptance: { label: 'Pending Acceptance', class: 'badge-warning' },
    accepted: { label: 'Accepted', class: 'badge-primary' },
    rejected: { label: 'Declined', class: 'badge-error' },
    pickup_scheduled: { label: 'Pickup Scheduled', class: 'badge-info' },
    pickup_assigned: { label: 'Pickup Assigned', class: 'badge-info' },
    picked_up: { label: 'Picked Up', class: 'badge-primary' },
    received: { label: 'Received', class: 'badge-primary' },
    sorted: { label: 'Sorted', class: 'badge-primary' },
    distributed: { label: 'Distributed', class: 'badge-success' },
    completed: { label: 'Completed', class: 'badge-success' },
    cancelled: { label: 'Cancelled', class: 'badge-neutral' },
    expired: { label: 'Expired', class: 'badge-neutral' },
    failed_pickup: { label: 'Failed Pickup', class: 'badge-error' },
    disputed: { label: 'Disputed', class: 'badge-warning' },
  };

  const orgStatusMap = {
    pending: { label: 'Pending Verification', class: 'badge-warning' },
    under_review: { label: 'Under Review', class: 'badge-info' },
    verified: { label: 'Verified', class: 'badge-success' },
    rejected: { label: 'Verification Declined', class: 'badge-error' },
    suspended: { label: 'Suspended', class: 'badge-error' },
  };

  const complaintStatusMap = {
    open: { label: 'Open', class: 'badge-warning' },
    under_review: { label: 'Under Review', class: 'badge-info' },
    resolved: { label: 'Resolved', class: 'badge-success' },
    rejected: { label: 'Rejected', class: 'badge-neutral' },
  };

  const priorityMap = {
    low: { label: 'Low Priority', class: 'badge-neutral' },
    medium: { label: 'Medium Priority', class: 'badge-info' },
    high: { label: 'High Priority', class: 'badge-warning' },
    urgent: { label: 'Urgent', class: 'badge-error' },
  };

  let map = donationStatusMap;
  if (type === 'org' || type === 'organization') map = orgStatusMap;
  if (type === 'complaint') map = complaintStatusMap;
  if (type === 'priority') map = priorityMap;

  const item = map[status] || { label: status.replace(/_/g, ' '), class: 'badge-neutral' };

  return (
    <span className={`badge ${item.class}`}>
      {item.label}
    </span>
  );
}
