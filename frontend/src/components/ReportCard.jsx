import React from 'react';

export default function ReportCard({ children }) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        overflow: 'hidden',
        width: '100%',
        padding: '4px',
        boxShadow: '0 0 0 1px var(--border)',
      }}
    >
      {children}
    </div>
  );
}