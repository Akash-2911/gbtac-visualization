import React, { useState, useEffect } from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import KPICard from '../components/KPICard';
import { fetchSummary } from '../services/summaryService';

function formatNumber(value) {
  if (value === null || value === undefined) return null;
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  useEffect(() => {
    fetchSummary()
      .then(setSummary)
      .catch((err) => setSummaryError(err.message));
  }, []);

  return (
    <PageContainer title="Overview" subtitle="Sprung Greenhouse — Black Diamond, Alberta">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <KPICard
          label="TOTAL ENERGY USED"
          value={formatNumber(summary?.totalEnergyUsedKwh)}
          unit="kWh"
        />
        <KPICard
          label="TOTAL SOLAR GENERATED"
          value={formatNumber(summary?.totalSolarGeneratedKwh)}
          unit="kWh"
        />
        <KPICard
          label="PEAK DEMAND"
          value={formatNumber(summary?.peakDemandKw)}
          unit="kW"
        />
        <KPICard
          label="TOTAL CO2 EMISSIONS"
          value={formatNumber(summary?.totalCo2EmissionsKg)}
          unit="kg"
        />
      </div>

      {summaryError && (
        <p style={{ color: 'var(--status-red-text)', fontSize: '13px', marginBottom: '16px' }}>
          Could not load summary data: {summaryError}
        </p>
      )}

      {/* Render directly inside the layout flow */}

  <PowerBIReport reportKey="overview" />
<ReportCard>
        <PowerBIReport reportKey="weather" />
      </ReportCard>
    </PageContainer>
  );
}