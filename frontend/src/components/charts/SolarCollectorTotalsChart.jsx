import React, { useMemo } from 'react';
import CategoryTotalsChart from './shared/CategoryTotalsChart';

export default function SolarCollectorTotalsChart({ data }) {
  const totals = useMemo(() => {
    const collector1 = data.reduce((sum, r) => sum + (r.collector1Kwh || 0), 0);
    const collector2 = data.reduce((sum, r) => sum + (r.collector2Kwh || 0), 0);
    return [
      { name: 'Collector 1', value: collector1 },
      { name: 'Collector 2', value: collector2 },
    ];
  }, [data]);

  return (
    <CategoryTotalsChart data={totals} title="Total Generation by Collector (selected range)" color="var(--accent-blue)" unit="kWh" />
  );
}
