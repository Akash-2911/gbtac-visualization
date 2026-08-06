import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { chartCardStyle } from '../chartUtils';

// Same KPI tile used on every page's Recharts view (Overview, Energy,
// Solar, Emissions, Compare) so the "total X, trending up/down vs
// yesterday" treatment looks identical everywhere instead of drifting
// page to page.
//
// `goodDirection` ('up' | 'down' | null) says which direction of change is
// actually good for this metric, so the arrow's color reflects that
// instead of a naive "up = green" that would be backwards for
// consumption/emissions (less is good) vs generation (more is good).
// Pass trend={null} (e.g. no daily breakdown available for this metric)
// to render the tile with no arrow rather than a fabricated one.
function TrendBadge({ trend, goodDirection }) {
  if (!trend) return null;
  const { direction, deltaPct } = trend;

  let color = 'var(--text-muted)';
  let ArrowIcon = Minus;
  if (direction === 'up') ArrowIcon = ArrowUp;
  if (direction === 'down') ArrowIcon = ArrowDown;
  if (direction !== 'flat' && goodDirection) {
    color = direction === goodDirection ? 'var(--status-green-text)' : 'var(--status-red-text)';
  }

  const label =
    direction === 'flat'
      ? 'No change vs yesterday'
      : `${deltaPct == null ? '' : `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`} vs yesterday`;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 600, color }}>
      <ArrowIcon size={13} />
      {label}
    </span>
  );
}

export default function StatTile({ label, value, unit, Icon, trend, goodDirection }) {
  return (
    <div
      style={{
        ...chartCardStyle,
        flex: '1 1 200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
        <Icon size={16} />
        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
          {unit}
        </span>
      </span>
      <TrendBadge trend={trend} goodDirection={goodDirection} />
    </div>
  );
}
