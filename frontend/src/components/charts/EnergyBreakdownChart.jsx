import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity, makeChartClickHandler, relevantCategory, CategoryLegend } from './chartUtils';
import { ENERGY_GROUPS, groupBreakdown } from './energyGroups';

const GROUP_NAMES = ENERGY_GROUPS.map((g) => g.name);

export default function EnergyBreakdownChart({ dailyRecords, selectedDate, onSelectDate, activeCategory, onToggleCategory }) {
  const chartData = useMemo(
    () =>
      dailyRecords.map((r) => ({
        date: r.date,
        ...groupBreakdown(r.breakdown),
      })),
    [dailyRecords]
  );
  const fillOpacity = useFillOpacity(0.7);
  const activeGroup = relevantCategory(activeCategory, GROUP_NAMES);

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Energy Breakdown by System</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          onClick={makeChartClickHandler(onSelectDate)}
          style={{ cursor: onSelectDate ? 'pointer' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          {selectedDate && <ReferenceLine x={selectedDate} stroke="var(--text-muted)" strokeDasharray="4 4" />}
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value, name) => [`${value.toFixed(1)} kWh`, name]}
          />
          {ENERGY_GROUPS.map((group) => {
            const isDimmed = activeGroup && activeGroup !== group.name;
            return (
              <Area
                key={group.key}
                isAnimationActive={false}
                type="monotone"
                dataKey={group.key}
                stackId="1"
                stroke={group.color}
                strokeWidth={1.5}
                strokeOpacity={isDimmed ? 0.3 : 1}
                fill={group.color}
                fillOpacity={isDimmed ? fillOpacity * 0.3 : fillOpacity}
                name={group.name}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
      <CategoryLegend
        items={ENERGY_GROUPS.map((g) => ({ name: g.name, color: g.color }))}
        activeCategory={activeGroup}
        onToggle={onToggleCategory}
      />
    </div>
  );
}
