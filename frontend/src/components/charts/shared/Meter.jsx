import React from 'react';
import { chartCardStyle, chartTitleStyle } from '../chartUtils';

// "A single ratio against a limit" gets its own form per the dataviz
// skill (a Meter, not a chart) — the trend area chart for this metric
// stays where it is; this is the headline snapshot next to it. The track
// is a fixed low-alpha version of the same hue as the fill (not a second
// color), so state reads across the whole bar the way the skill's meter
// spec calls for.
export default function Meter({
  title,
  pct,
  targetPct = 100,
  color = 'var(--status-green-text)',
  trackColor = 'rgba(22, 163, 74, 0.16)', // status-green-text at low alpha — matches the default `color`
  caption,
}) {
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            flex: 1,
            height: '16px',
            borderRadius: '8px',
            backgroundColor: trackColor,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: '100%', width: `${clamped}%`, borderRadius: '8px', backgroundColor: color, transition: 'width 0.2s' }} />
          {targetPct <= 100 && (
            <div
              style={{
                position: 'absolute',
                top: '-3px',
                bottom: '-3px',
                left: `${targetPct}%`,
                width: '2px',
                backgroundColor: 'var(--text-muted)',
              }}
            />
          )}
        </div>
        <span style={{ fontWeight: 700, fontSize: '1.1875rem', color, minWidth: '54px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
      </div>
      {caption && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>{caption}</div>}
    </div>
  );
}
