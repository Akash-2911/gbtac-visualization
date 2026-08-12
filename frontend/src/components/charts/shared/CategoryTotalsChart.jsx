import React, { useState } from 'react';
import { chartCardStyle, chartTitleStyle } from '../chartUtils';

// Generic "share of total by category" stacked bar — reused for
// energy-by-system and solar-by-collector period totals. This is a
// part-to-whole job, and the dataviz skill's form rules point at a
// 100%-width stacked bar for that (not a pie — a 2-slice pie, i.e. Solar's
// collectors, is explicitly called out as the wrong form there). Segment
// colors come from the caller (data[].color) so each category keeps its
// established identity color instead of one flat hue.
// `activeCategory`/`onToggleCategory` (Model B cross-filter) are optional —
// only relevant if `activeCategory` is actually one of this chart's own
// `data[].name` values, so a category selected by an unrelated chart
// elsewhere on the page (a different domain, e.g. solar collectors while
// this one shows energy systems) leaves this chart at full brightness
// instead of wrongly dimming everything.
export default function CategoryTotalsChart({ data, title, unit, activeCategory, onToggleCategory }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const activeName = activeCategory && data.some((d) => d.name === activeCategory) ? activeCategory : null;

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>{title}</h3>
      <div style={{ display: 'flex', height: '34px', borderRadius: '6px', overflow: 'hidden' }}>
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          const isDimmed = (activeName && activeName !== d.name) || (hoverIdx !== null && hoverIdx !== i);
          return (
            <div
              key={d.name}
              title={`${d.name}: ${d.value.toFixed(1)} ${unit} (${pct.toFixed(0)}%)`}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={() => onToggleCategory && onToggleCategory(d.name)}
              style={{
                width: `${pct}%`,
                backgroundColor: d.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                color: '#fff',
                cursor: onToggleCategory ? 'pointer' : 'default',
                boxShadow: i > 0 ? '-2px 0 0 var(--surface)' : 'none',
                opacity: isDimmed ? 0.35 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {pct >= 10 ? `${pct.toFixed(0)}%` : ''}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        {data.map((d) => {
          const isActive = activeName === d.name;
          const isDimmed = Boolean(activeName) && !isActive;
          return (
            <button
              key={d.name}
              type="button"
              onClick={() => onToggleCategory && onToggleCategory(d.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                padding: '2px 4px',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 400,
                color: isDimmed ? 'var(--text-muted)' : 'var(--text-secondary)',
                opacity: isDimmed ? 0.55 : 1,
                cursor: onToggleCategory ? 'pointer' : 'default',
                transition: 'opacity 0.15s',
              }}
            >
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: d.color, display: 'inline-block', flexShrink: 0 }} />
              {d.name} — {d.value.toFixed(0)} {unit}
            </button>
          );
        })}
      </div>
    </div>
  );
}
