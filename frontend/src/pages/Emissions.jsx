import React from 'react';

export default function Emissions() {
  return (
    <div>
      <h1 style={{ fontSize: '26px', marginBottom: '20px' }}>Emissions</h1>
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: '10px',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Emissions dashboard coming soon.
        <br />
        <span style={{ fontSize: '13px' }}>
          (Known issue: CO2 values need recalculating once Aryan's emissions script is updated.)
        </span>
      </div>
    </div>
  );
}