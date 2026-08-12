import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, makeChartClickHandler } from './chartUtils';

// Diverging job: positive net (solar > consumption, a net-zero surplus day)
// in green, negative net (deficit day) in red, zero as the neutral midpoint.
export default function CompareNetEnergyChart({ data, selectedDate, onSelectDate }) {
  const chartData = useMemo(
    () => data.map((r) => ({ date: r.date, net: r.solarKwh - r.energyKwh })),
    [data]
  );

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Net Energy (Solar − Consumed)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          onClick={makeChartClickHandler(onSelectDate)}
          style={{ cursor: onSelectDate ? 'pointer' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={55} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} kWh`, value >= 0 ? 'Surplus' : 'Deficit']}
          />
          <ReferenceLine y={0} stroke="var(--text-muted)" />
          {selectedDate && <ReferenceLine x={selectedDate} stroke="var(--text-muted)" strokeDasharray="4 4" />}
          <Bar dataKey="net" radius={[3, 3, 3, 3]} isAnimationActive={false}>
            {chartData.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.net >= 0 ? 'var(--status-green-text)' : 'var(--status-red-text)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
