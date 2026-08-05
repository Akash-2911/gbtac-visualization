import React from 'react';
import { Zap, Sun, Activity, Cloud } from 'lucide-react';
import { chartCardStyle } from './chartUtils';

const TILES = [
  { key: 'totalEnergyUsedKwh', label: 'Total Energy Used', unit: 'kWh', icon: Zap, color: 'var(--accent-purple)' },
  { key: 'totalSolarGeneratedKwh', label: 'Total Solar Generated', unit: 'kWh', icon: Sun, color: 'var(--accent-blue)' },
  { key: 'peakDemandKw', label: 'Peak Demand', unit: 'kW', icon: Activity, color: 'var(--text-secondary)' },
  { key: 'totalCo2EmissionsKg', label: 'Total CO2 Emissions', unit: 'kg', icon: Cloud, color: 'var(--status-red-text)' },
];

function StatTile({ label, value, unit, Icon, color }) {
  return (
    <div
      style={{
        ...chartCardStyle,
        flex: '1 1 200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color,
            color: '#fff',
          }}
        >
          <Icon size={16} />
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
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

export default function OverviewChart({ summary }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      {TILES.map((tile) => (
        <StatTile key={tile.key} label={tile.label} value={summary[tile.key] || 0} unit={tile.unit} Icon={tile.icon} color={tile.color} />
      ))}
    </div>
  );
}
