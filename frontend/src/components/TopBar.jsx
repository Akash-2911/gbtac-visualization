import React from 'react';

export default function TopBar({ pageTitle }) {
  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
      }}
    >
      <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '15px' }}>
        GBTAC
      </span>

      <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
        GBTAC {pageTitle} Dashboard
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#DBEAFE',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          AX
        </div>
        <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>ABC XYZ</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
          ADMIN
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <a href="#logout" style={{ fontSize: '14px', color: 'var(--status-red-text)', textDecoration: 'none', fontWeight: 500 }}>↪ Logout</a>
      </div>
    </header>
  );
}