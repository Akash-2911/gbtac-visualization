import React, { useState } from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ForecastChart from '../components/ForecastChart';

export default function Energy() {
  const [showForecast, setShowForecast] = useState(false);

  return (
    <PageContainer title="Energy" subtitle="Energy consumption across all greenhouse systems">
      <button
        type="button"
        onClick={() => setShowForecast((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: '8px',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          backgroundColor: showForecast ? 'var(--accent-blue)' : 'var(--surface)',
          color: showForecast ? '#fff' : 'var(--text-secondary)',
          marginBottom: '16px',
          alignSelf: 'flex-start',
        }}
      >
        {showForecast ? 'Hide energy forecast' : 'Show energy forecast'}
      </button>

      {showForecast && (
        <div style={{ marginBottom: '20px' }}>
          <ForecastChart />
        </div>
      )}

      <ReportCard>
        <PowerBIReport reportKey="greenhouseEnergy" />
      </ReportCard>
    </PageContainer>
  );
}