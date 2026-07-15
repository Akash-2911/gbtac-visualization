import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';

export default function Compare() {
  return (
    <PageContainer title="Compare" subtitle="Energy consumed vs energy generated">
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Energy vs Solar</p>
      <ReportCard>
        <PowerBIReport reportKey="energyVsSolar" />
      </ReportCard>

      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '24px 0 8px' }}>Energy & Solar Breakdown</p>
      <ReportCard>
        <PowerBIReport reportKey="energySolarBreakdown" />
      </ReportCard>
    </PageContainer>
  );
}