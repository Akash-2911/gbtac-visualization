import React, { useState } from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';

const views = [
  { key: 'energyVsSolar', label: 'Energy vs Solar' },
  { key: 'energySolarBreakdown', label: 'Energy & Solar Breakdown' },
];

export default function Compare() {
  const [activeView, setActiveView] = useState('energyVsSolar');

  return (
    <PageContainer title="Compare" subtitle="Energy consumed vs energy generated">
      <div
        style={{
          display: 'inline-flex',
          backgroundColor: 'var(--bg)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '16px',
          alignSelf: 'flex-start',
        }}
      >
        {views.map((view) => (
          <button
            key={view.key}
            type="button"
            onClick={() => setActiveView(view.key)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === view.key ? 'var(--accent-blue)' : 'transparent',
              color: activeView === view.key ? '#fff' : 'var(--text-secondary)',
              transition: 'background-color 0.15s',
            }}
          >
            {view.label}
          </button>
        ))}
      </div>

      <ReportCard>
        <PowerBIReport reportKey={activeView} />
      </ReportCard>
    </PageContainer>
  );
}