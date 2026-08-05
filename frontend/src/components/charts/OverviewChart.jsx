import React from 'react';
import { Zap, Sun, Activity, Cloud } from 'lucide-react';
import { fetchSummaryData } from '../../services/dataService';
import { useChartData, ChartStatus, chartCardStyle } from './chartUtils';
import CompareChart from './CompareChart';

const TILES = [
  { key: 'totalEnergyUsedKwh', label: 'Total Energy Used', unit: 'kWh', icon: Zap },
  { key: 'totalSolarGeneratedKwh', label: 'Total Solar Generated', unit: 'kWh', icon: Sun },
  { key: 'peakDemandKw', label: 'Peak Demand', unit: 'kW', icon: Activity },
  { key: 'totalCo2EmissionsKg', label: 'Total CO2 Emissions', unit: 'kg', icon: Cloud },
];

function StatTile({ label, value, unit, Icon }) {
  return (
    <div
      style={{
        ...chartCardStyle,
        flex: '1 1 200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
        <Icon size={16} />
        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
          {unit}
        </span>
      </span>
    </div>
  );
}

export default function OverviewChart() {
  const { data, error, loading } = useChartData(fetchSummaryData);

  const status = <ChartStatus loading={loading} error={error} loadingLabel="Loading summary…" />;
  if (loading || error) {
    return <div style={chartCardStyle}>{status}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {TILES.map((tile) => (
          <StatTile key={tile.key} label={tile.label} value={data[tile.key] || 0} unit={tile.unit} Icon={tile.icon} />
        ))}
      </div>
      <CompareChart />
    </div>
  );
}
