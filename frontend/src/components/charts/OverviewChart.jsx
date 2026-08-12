import React from 'react';
import { Zap, Sun, Activity, Cloud } from 'lucide-react';
import StatTile from './shared/StatTile';

// goodDirection: which direction of day-over-day change counts as "good"
// for this metric (see StatTile). Peak Demand has no daily breakdown
// fetched on this page, so it gets no trend arrow rather than a
// fabricated one.
const TILES = [
  { key: 'totalEnergyUsedKwh', label: 'Total Energy Used', unit: 'kWh', icon: Zap, goodDirection: 'down' },
  { key: 'totalSolarGeneratedKwh', label: 'Total Solar Generated', unit: 'kWh', icon: Sun, goodDirection: 'up' },
  { key: 'peakDemandKw', label: 'Peak Demand', unit: 'kW', icon: Activity, goodDirection: null },
  { key: 'totalCo2EmissionsKg', label: 'Total CO2 Emissions', unit: 'kg', icon: Cloud, goodDirection: 'down' },
];

export default function OverviewChart({ summary, trends = {} }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
      {TILES.map((tile) => (
        <StatTile
          key={tile.key}
          label={tile.label}
          value={summary[tile.key] || 0}
          unit={tile.unit}
          Icon={tile.icon}
          trend={trends[tile.key]}
          goodDirection={tile.goodDirection}
        />
      ))}
    </div>
  );
}
