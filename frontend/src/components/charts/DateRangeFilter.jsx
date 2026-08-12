import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const PRESETS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: null },
];

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const todayIso = () => new Date().toISOString().slice(0, 10);

// Shared date-range control for every page's Recharts view — one filter
// per page, applied to all of that page's charts at once (the Power BI
// view keeps its own native slicers, this is unrelated to that).
export default function DateRangeFilter({ range, onChange }) {
  const [selectedPreset, setSelectedPreset] = useState('All');

  const applyPreset = (preset) => {
    setSelectedPreset(preset.label);
    if (preset.days === null) {
      onChange({ from: undefined, to: undefined });
    } else {
      onChange({ from: isoDaysAgo(preset.days), to: todayIso() });
    }
  };

  const applyCustom = (field, value) => {
    setSelectedPreset(null);
    onChange({ ...range, [field]: value || undefined });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          backgroundColor: 'var(--bg)',
          borderRadius: '8px',
          padding: '4px',
        }}
      >
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="gbtac-btn-fx"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedPreset === preset.label ? 'var(--accent-blue)' : 'transparent',
              color: selectedPreset === preset.label ? '#fff' : 'var(--text-secondary)',
              transition: 'background-color 0.15s',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Calendar size={14} color="var(--text-muted)" />
        <input
          type="date"
          value={range.from || ''}
          max={range.to || undefined}
          onChange={(e) => applyCustom('from', e.target.value)}
          style={{
            fontSize: '12px',
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
        <input
          type="date"
          value={range.to || ''}
          min={range.from || undefined}
          onChange={(e) => applyCustom('to', e.target.value)}
          style={{
            fontSize: '12px',
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
    </div>
  );
}
