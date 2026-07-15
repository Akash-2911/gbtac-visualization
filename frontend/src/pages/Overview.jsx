import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import KPICard from '../components/KPICard';

export default function Overview() {
  return (
    <PageContainer title="Overview" subtitle="Sprung Greenhouse — Black Diamond, Alberta">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <KPICard label="TOTAL ENERGY USED" value={null} unit="kWh" />
        <KPICard label="TOTAL SOLAR GENERATED" value={null} unit="kWh" />
        <KPICard label="PEAK DEMAND" value={null} unit="kW" />
        <KPICard label="TOTAL CO2 EMISSIONS" value={null} unit="kg" />
      </div>
      <ReportCard>
        <PowerBIReport reportKey="overview" />
      </ReportCard>
    </PageContainer>
  );
}