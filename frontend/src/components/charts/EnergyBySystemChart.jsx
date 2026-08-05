import React, { useMemo } from 'react';
import CategoryTotalsChart from './shared/CategoryTotalsChart';
import { ENERGY_GROUPS, groupBreakdown } from './energyGroups';

export default function EnergyBySystemChart({ dailyRecords }) {
  const data = useMemo(() => {
    const totals = { chiller: 0, lighting: 0, heating: 0, waterFiltration: 0, pumpsGrow: 0 };
    for (const r of dailyRecords) {
      const grouped = groupBreakdown(r.breakdown);
      for (const key of Object.keys(totals)) totals[key] += grouped[key];
    }
    return ENERGY_GROUPS.map((group) => ({ name: group.name, value: totals[group.key] }));
  }, [dailyRecords]);

  return (
    <CategoryTotalsChart data={data} title="Total Energy by System (selected range)" color="var(--accent-purple)" unit="kWh" />
  );
}
