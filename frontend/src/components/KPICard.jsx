import React from 'react';

export default function KPICard({ label, value, unit, trend, trendLabel }) {
  const trendColor = trend?.startsWith('▲') ? 'var(--status-green-text)' : 'var(--status-red-text)';

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '18px 20px',
        flex: 1,
      }}
    >
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.02em' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700 }}>{value}</span>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{unit}</span>
      </div>
      {trend && (
        <p style={{ fontSize: '12px', margin: '6px 0 0', color: trendColor }}>
          {trend} <span style={{ color: 'var(--text-secondary)' }}>{trendLabel}</span>
        </p>
      )}
    </div>
  );
}