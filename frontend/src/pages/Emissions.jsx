import React from 'react';
import PageContainer from '../components/PageContainer';

export default function Emissions() {
  return (
    <PageContainer title="Emissions" subtitle="CO2 tracking — Sprung Greenhouse">
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌱</div>
        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Emissions dashboard in progress</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto' }}>
          CO2 calculations are being updated to reflect solar and mains power sources correctly.
        </p>
      </div>
    </PageContainer>
  );
}