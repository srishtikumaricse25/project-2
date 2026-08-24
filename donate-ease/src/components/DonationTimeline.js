'use client';

export default function DonationTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <p className="text-xs text-tertiary">No status history available.</p>;
  }

  // Find the latest status from history or default to the first one
  const currentStatus = history[history.length - 1]?.to_status || history[0]?.to_status || 'submitted';

  // Standard flow stages
  const stages = [
    { key: 'created', label: 'Donation Created', triggerStatuses: ['submitted', 'pending_acceptance'] },
    { key: 'accepted', label: 'NGO Accepted', triggerStatuses: ['accepted'] },
    { key: 'scheduled', label: 'Pickup Scheduled', triggerStatuses: ['pickup_scheduled'] },
    { key: 'collected', label: 'Item Collected', triggerStatuses: ['picked_up'] },
    { key: 'received', label: 'NGO Received', triggerStatuses: ['received', 'sorted'] },
    { key: 'distributed', label: 'Distributed', triggerStatuses: ['distributed', 'completed'] },
  ];

  const failureStatuses = ['cancelled', 'rejected', 'failed_pickup'];
  const isFailed = failureStatuses.includes(currentStatus);

  // Determine how far along the timeline we are
  let currentStageIndex = -1;
  if (!isFailed) {
    // Find highest achieved stage
    for (let i = 0; i < history.length; i++) {
      const hStatus = history[i].to_status;
      const stageIdx = stages.findIndex(s => s.triggerStatuses.includes(hStatus));
      if (stageIdx > currentStageIndex) {
        currentStageIndex = stageIdx;
      }
    }
  } else {
    // If failed, find the last successful stage before failure
    for (let i = 0; i < history.length - 1; i++) {
      const hStatus = history[i].to_status;
      const stageIdx = stages.findIndex(s => s.triggerStatuses.includes(hStatus));
      if (stageIdx > currentStageIndex) {
        currentStageIndex = stageIdx;
      }
    }
  }

  // Render the timeline
  return (
    <div className="timeline">
      {stages.map((stage, index) => {
        // Find if this stage exists in history to get timestamp and notes
        const historyItem = [...history].reverse().find(h => stage.triggerStatuses.includes(h.to_status));
        
        let stateClass = 'neutral';
        let displayLabel = stage.label;
        let dateStr = '';
        let noteStr = '';

        if (historyItem) {
          dateStr = new Date(historyItem.created_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          });
          noteStr = historyItem.notes || '';
          
          if (isFailed && index === currentStageIndex) {
             stateClass = 'completed'; // The last successful stage before failure
          } else {
             stateClass = 'completed';
          }
        } else if (!isFailed && index === currentStageIndex + 1) {
          stateClass = 'active'; // The next step is active
        } else if (!isFailed && index <= currentStageIndex) {
          // Fallback if history missing but we are past this stage (shouldn't happen with proper DB but just in case)
          stateClass = 'completed';
        }

        return (
          <div key={stage.key} className="timeline-item">
            <div className={`timeline-dot ${stateClass}`} />
            <div className="timeline-content">
              <h4 style={{ color: stateClass === 'neutral' ? 'var(--gray-500)' : 'inherit' }}>
                {stateClass === 'completed' ? '✓ ' : stateClass === 'active' ? '● ' : ''}
                {displayLabel}
              </h4>
              {dateStr && <p className="text-sm font-medium text-secondary">{dateStr}</p>}
              {noteStr && <div className="timeline-note mt-1">"{noteStr}"</div>}
            </div>
          </div>
        );
      })}

      {isFailed && (
        <div className="timeline-item">
          <div className="timeline-dot cancelled" />
          <div className="timeline-content">
            <h4 className="text-red-600">
              {currentStatus === 'cancelled' ? 'Donation Cancelled' : currentStatus === 'rejected' ? 'Donation Declined' : 'Pickup Failed'}
            </h4>
            <p className="text-sm font-medium text-secondary">
              {new Date(history[history.length - 1].created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </p>
            {history[history.length - 1].notes && (
              <div className="timeline-note mt-1">"{history[history.length - 1].notes}"</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
