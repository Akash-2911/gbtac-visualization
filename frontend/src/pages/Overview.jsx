import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import KPICard from '../components/KPICard';

export default function Overview() {
  return (
    <div>
      <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Overview</h1>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
        Sprung Greenhouse — Black Diamond, Alberta
      </p>

      {/* NOTE: placeholder values matching the Figma mockup — swap for real data once
          available (likely from vw_daily_energy_summary / vw_daily_solar_summary) */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <KPICard label="TOTAL ENERGY USED" value="728" unit="kWh" trend="▲ 4.2%" trendLabel="vs prior period" />
        <KPICard label="TOTAL SOLAR GENERATED" value="4,284" unit="kWh" trend="▲ 11.6%" trendLabel="Nov '22–Jul '23" />
        <KPICard label="PEAK DEMAND" value="13.0" unit="kW" trendLabel="March 2023" />
        <KPICard label="TOTAL CO2 EMISSIONS" value="393" unit="kg" trend="▲ 3.8%" trendLabel="vs prior period" />
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        <PowerBIReport reportKey="overview" />
      </div>
    </div>
  );
}