import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { chartCardStyle, formatShortDate } from '../chartUtils';

// Same KPI tile used on every page's Recharts view (Overview, Energy,
// Solar, Emissions, Compare) so the "total X, trending up/down vs
// [previous day]" treatment looks identical everywhere instead of drifting
// page to page.
//
// `goodDirection` ('up' | 'down' | null) says which direction of change is
// actually good for this metric, so the arrow's color reflects that
// instead of a naive "up = green" that would be backwards for
// consumption/emissions (less is good) vs generation (more is good).
// Pass trend={null} (e.g. no daily breakdown available for this metric)
// to render the tile with no arrow rather than a fabricated one.

// `trend.prevDate` is the actual previous day in whatever data was
// fetched, which is only really "yesterday" when no date-range filter (or
// the default "All" range ending today) is active. Naming the real date
// instead of always saying "yesterday" keeps the label honest once a
// narrower range is selected.
function comparisonLabel(prevDate) {
  const prev = new Date(`${prevDate}T00:00:00`);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return prev.toDateString() === yesterday.toDateString() ? 'yesterday' : formatShortDate(prevDate);
}

// A colored arrow alone assumes the viewer already knows whether up or down
// is good for this particular metric (backwards for consumption/emissions
// vs. generation) — this pill states the verdict in words too, so the color
// is reinforcement rather than the only signal. Also makes the judgment
// legible to colorblind viewers, which color-only never was.
function VerdictPill({ isGood }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.625rem',
        fontWeight: 700,
        padding: '1px 7px',
        borderRadius: '20px',
        marginLeft: '2px',
        backgroundColor: isGood ? 'var(--status-green-bg)' : 'var(--status-red-bg)',
        color: isGood ? 'var(--status-green-text)' : 'var(--status-red-text)',
      }}
    >
      {isGood ? 'Good' : 'Needs attention'}
    </span>
  );
}

function TrendBadge({ trend, goodDirection }) {
  if (!trend) return null;
  const { direction, deltaPct, prevDate } = trend;
  const vs = comparisonLabel(prevDate);

  let color = 'var(--text-muted)';
  let ArrowIcon = Minus;
  if (direction === 'up') ArrowIcon = ArrowUp;
  if (direction === 'down') ArrowIcon = ArrowDown;
  const hasVerdict = direction !== 'flat' && Boolean(goodDirection);
  const isGood = hasVerdict && direction === goodDirection;
  if (hasVerdict) {
    color = isGood ? 'var(--status-green-text)' : 'var(--status-red-text)';
  }

  const label =
    direction === 'flat'
      ? `No change vs ${vs}`
      : `${deltaPct == null ? '' : `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`} vs ${vs}`;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 600, color }}>
      <ArrowIcon size={13} />
      {label}
      {hasVerdict && <VerdictPill isGood={isGood} />}
    </span>
  );
}

// `note` renders a plain muted line in place of the trend arrow — for
// tiles with no day-over-day comparison to show (range averages, peak-day
// dates, categorical values like "Top System") — so every KPI tile keeps
// the same 3-row shape instead of some being visibly shorter than others.
// `decimals` (default 0) only matters for numeric `value`; string values
// (e.g. a system name) render as-is.
export default function StatTile({ label, value, unit, Icon, trend, goodDirection, note, decimals = 0 }) {
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
        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: decimals }) : value}
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
          {unit}
        </span>
      </span>
      {trend ? (
        <TrendBadge trend={trend} goodDirection={goodDirection} />
      ) : note ? (
        <span style={{ fontSize: '0.75rem', fontWeight: 500, fontStyle: 'italic', color: 'var(--text-muted)' }}>
          {note}
        </span>
      ) : null}
    </div>
  );
}
