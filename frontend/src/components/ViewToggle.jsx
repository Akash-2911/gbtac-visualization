import React from 'react';

// Segmented control for switching between named views (e.g. Power BI vs
// Recharts). Same visual pattern as Compare.jsx's existing report-tab
// switcher — pulled out here so every page shares one implementation
// instead of six copies of the same inline style block.
export default function ViewToggle({ value, onChange, options }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        backgroundColor: 'var(--bg)',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '16px',
        alignSelf: 'flex-start',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="gbtac-btn-fx"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: value === opt.value ? 'var(--accent-blue)' : 'transparent',
            color: value === opt.value ? '#fff' : 'var(--text-secondary)',
            transition: 'background-color 0.15s',
          }}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
