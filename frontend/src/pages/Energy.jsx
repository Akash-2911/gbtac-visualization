import React from 'react';
import PowerBIReport from '../components/PowerBIReport';

export default function Energy() {
  return (
    <div>
      <h1 style={{ fontSize: '26px', marginBottom: '20px' }}>Energy</h1>
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <PowerBIReport reportKey="greenhouseEnergy" />
      </div>
    </div>
  );
}