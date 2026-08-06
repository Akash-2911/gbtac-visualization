import React, { useState } from 'react';
import { chartCardStyle, chartTitleStyle } from '../chartUtils';

// Generic "share of total by category" stacked bar — reused for
// energy-by-system and solar-by-collector period totals. This is a
// part-to-whole job, and the dataviz skill's form rules point at a
// 100%-width stacked bar for that (not a pie — a 2-slice pie, i.e. Solar's
// collectors, is explicitly called out as the wrong form there). Segment
// colors come from the caller (data[].color) so each category keeps its
// established identity color instead of one flat hue.
export default function CategoryTotalsChart({ data, title, unit }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>{title}</h3>
      <div style={{ display: 'flex', height: '34px', borderRadius: '6px', overflow: 'hidden' }}>
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div
              key={d.name}
              title={`${d.name}: ${d.value.toFixed(1)} ${unit} (${pct.toFixed(0)}%)`}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                width: `${pct}%`,
                backgroundColor: d.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                color: '#fff',
                boxShadow: i > 0 ? '-2px 0 0 var(--surface)' : 'none',
                opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.55,
                transition: 'opacity 0.15s',
              }}
            >
              {pct >= 10 ? `${pct.toFixed(0)}%` : ''}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        {data.map((d) => (
          <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: d.color, display: 'inline-block', flexShrink: 0 }} />
            {d.name} — {d.value.toFixed(0)} {unit}
          </span>
        ))}
      </div>
    </div>
  );
}
