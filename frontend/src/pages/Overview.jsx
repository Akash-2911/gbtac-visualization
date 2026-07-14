import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import KPICard from '../components/KPICard';

export default function Overview() {
  return (
    <PageContainer title="Overview" subtitle="Sprung Greenhouse — Black Diamond, Alberta">
      {/* NOTE: placeholder values matching the Figma mockup — not real data yet */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <KPICard label="TOTAL ENERGY USED" value="728" unit="kWh" trend="▲ 4.2%" trendLabel="vs prior period" />
        <KPICard label="TOTAL SOLAR GENERATED" value="4,284" unit="kWh" trend="▲ 11.6%" trendLabel="Nov '22–Jul '23" />
        <KPICard label="PEAK DEMAND" value="13.0" unit="kW" trendLabel="March 2023" />
        <KPICard label="TOTAL CO2 EMISSIONS" value="393" unit="kg" trend="▲ 3.8%" trendLabel="vs prior period" />
      </div>
      <ReportCard>
        <PowerBIReport reportKey="overview" />
      </ReportCard>
    </PageContainer>
  );
}