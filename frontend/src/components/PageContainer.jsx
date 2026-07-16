import React from 'react';

// NOTE: reconstructed based on usage across Energy.jsx / Solar.jsx / Weather.jsx /
// Compare.jsx (title + subtitle props, wraps ReportCard children). If your real
// file has more (e.g. breadcrumbs), re-add them — keep flex:1 on the wrapper below.
export default function PageContainer({ title, subtitle, children }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 4px' }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}