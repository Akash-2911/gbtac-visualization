import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity, makeChartClickHandler } from './chartUtils';

export default function EmissionsChart({ data, selectedDate, onSelectDate }) {
  const fillOpacity = useFillOpacity(0.15);
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily CO2 Emissions</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart
          data={data}
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
            formatter={(value) => [`${value.toFixed(1)} kg`, 'CO2e']}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="kgCo2e"
            stroke="var(--status-red-text)"
            strokeWidth={2}
            fill="var(--status-red-text)"
            fillOpacity={fillOpacity}
            name="kg CO2e"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
