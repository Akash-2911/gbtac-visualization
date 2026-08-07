import React, { useMemo } from 'react';
import CategoryTotalsChart from './shared/CategoryTotalsChart';

// Same day-split swap as EnergyBySystemChart when a date is cross-filtered
// in from another chart on the page.
export default function SolarCollectorTotalsChart({ data, selectedDate }) {
  const source = selectedDate ? data.filter((r) => r.date === selectedDate) : data;
  const totals = useMemo(() => {
    const collector1 = source.reduce((sum, r) => sum + (r.collector1Kwh || 0), 0);
    const collector2 = source.reduce((sum, r) => sum + (r.collector2Kwh || 0), 0);
    return [
      { name: 'Collector 1', value: collector1, color: 'var(--accent-blue)' },
      { name: 'Collector 2', value: collector2, color: 'var(--solar-tint-1)' },
    ];
  }, [source]);

  const title = selectedDate ? `Generation by Collector — ${selectedDate}` : 'Total Generation by Collector — share of range';

  return <CategoryTotalsChart data={totals} title={title} unit="kWh" />;
}
