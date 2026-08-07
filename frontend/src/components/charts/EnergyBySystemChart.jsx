import React, { useMemo } from 'react';
import CategoryTotalsChart from './shared/CategoryTotalsChart';
import { ENERGY_GROUPS, groupBreakdown } from './energyGroups';

// When a date is cross-filtered in from another chart on the page, this
// swaps from a period total to that single day's system split instead of
// hiding/dimming — a "share of range" framing doesn't apply to one day.
export default function EnergyBySystemChart({ dailyRecords, selectedDate }) {
  const source = selectedDate ? dailyRecords.filter((r) => r.date === selectedDate) : dailyRecords;
  const data = useMemo(() => {
    const totals = { chiller: 0, lighting: 0, heating: 0, waterFiltration: 0, pumpsGrow: 0 };
    for (const r of source) {
      const grouped = groupBreakdown(r.breakdown);
      for (const key of Object.keys(totals)) totals[key] += grouped[key];
    }
    return ENERGY_GROUPS.map((group) => ({ name: group.name, value: totals[group.key], color: group.color }));
  }, [source]);

  const title = selectedDate ? `Energy by System — ${selectedDate}` : 'Total Energy by System — share of range';

  return <CategoryTotalsChart data={data} title={title} unit="kWh" />;
}
