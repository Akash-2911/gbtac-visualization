import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity, makeChartClickHandler } from './chartUtils';
import { ENERGY_GROUPS, groupBreakdown } from './energyGroups';

export default function EnergyBreakdownChart({ dailyRecords, selectedDate, onSelectDate }) {
  const chartData = useMemo(
    () =>
      dailyRecords.map((r) => ({
        date: r.date,
        ...groupBreakdown(r.breakdown),
      })),
    [dailyRecords]
  );
  const fillOpacity = useFillOpacity(0.7);

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
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {ENERGY_GROUPS.map((group) => (
            <Area
              key={group.key}
              isAnimationActive={false}
              type="monotone"
              dataKey={group.key}
              stackId="1"
              stroke={group.color}
              strokeWidth={1.5}
              fill={group.color}
              fillOpacity={fillOpacity}
              name={group.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
