import React from 'react';
import PowerBIReport from '../components/PowerBIReport';

export default function Compare() {
  return (
    <div>
      <h1 style={{ fontSize: '26px', marginBottom: '20px' }}>Compare</h1>

      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Energy vs Solar</p>
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
        <PowerBIReport reportKey="energyVsSolar" />
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Energy & Solar Breakdown</p>
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <PowerBIReport reportKey="energySolarBreakdown" />
      </div>
    </div>
  );
}