import React from 'react';

export default function PageContainer({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <h1 style={{ fontSize: '26px', marginBottom: subtitle ? '4px' : '20px' }}>{title}</h1>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px', fontSize: '14px' }}>
          {subtitle}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}