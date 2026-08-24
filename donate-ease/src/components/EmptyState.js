'use client';

import Link from 'next/link';

export default function EmptyState({
  icon = '📦',
  title = 'No items found',
  description = 'There are no items to display right now.',
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="empty-state card">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && (
        actionHref ? (
          <Link href={actionHref} className="btn btn-primary">
            {actionLabel}
          </Link>
        ) : (
          <button onClick={onAction} className="btn btn-primary">
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
