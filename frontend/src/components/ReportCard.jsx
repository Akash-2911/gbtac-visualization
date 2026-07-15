import React from 'react';

export default function ReportCard({ children }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}