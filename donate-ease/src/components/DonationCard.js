'use client';

import Link from 'next/link';
import StatusBadge from './StatusBadge';

export default function DonationCard({ donation, userRole = 'donor' }) {
  const formattedDate = donation.created_at
    ? new Date(donation.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Link href={`/dashboard/${userRole}/donations/${donation.id}`} className="card card-clickable flex-col justify-between" style={{ display: 'flex' }}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-tertiary">{donation.donation_id}</span>
          <StatusBadge status={donation.status} />
        </div>

        <div className="flex items-start gap-3 mt-2">
          <span style={{ fontSize: '2rem' }}>{donation.category_icon || '📦'}</span>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{donation.quantity} × {donation.item_type}</h4>
            <p className="text-xs text-secondary mt-1">
              Category: <span className="font-medium text-primary">{donation.category_name || 'General'}</span> • Condition: <span className="font-medium capitalize">{donation.condition?.replace(/_/g, ' ')}</span>
            </p>
          </div>
        </div>

        {donation.description && (
          <p className="text-xs text-tertiary mt-3 truncate" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal' }}>
            {donation.description}
          </p>
        )}
      </div>

      <div className="divider" style={{ margin: '0.75rem 0' }} />

      <div className="flex items-center justify-between text-xs text-secondary">
        <div>
          {userRole === 'donor' && donation.org_name && (
            <span>NGO: <strong>{donation.org_name}</strong></span>
          )}
          {userRole === 'ngo' && donation.donor_name && (
            <span>Donor: <strong>{donation.donor_name}</strong></span>
          )}
          {userRole === 'admin' && (
            <span>{donation.donor_name || 'Donor'} → {donation.org_name || 'Unassigned'}</span>
          )}
        </div>
        <span className="text-tertiary">{formattedDate}</span>
      </div>
    </Link>
  );
}
