import React from 'react';

export default function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        fontSize: '0.875rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>{label}</span>
      <span
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '38px',
          height: '22px',
          borderRadius: '11px',
          background: checked ? 'var(--accent-blue)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '18px' : '2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.15s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      </span>
    </label>
  );
}