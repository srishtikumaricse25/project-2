'use client';

export default function StatsCard({ icon, value, label, trend, color = 'green' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value !== undefined && value !== null ? value : 0}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div className={`stat-trend ${trend.type}`}>
            {trend.type === 'up' ? '↑' : '↓'} {trend.text}
          </div>
        )}
      </div>
    </div>
  );
}
