import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity } from './chartUtils';

export default function SolarChart({ data, totalKwh }) {
  const collector1Opacity = useFillOpacity(0.25);
  const collector2Opacity = useFillOpacity(0.4);
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily Solar Generation by Collector</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value, name) => [`${value.toFixed(1)} kWh`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="collector1Kwh"
            stackId="1"
            stroke="var(--accent-blue)"
            strokeWidth={2}
            fill="var(--accent-blue)"
            fillOpacity={collector1Opacity}
            name="Collector 1"
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="collector2Kwh"
            stackId="1"
            stroke="var(--solar-tint-1)"
            strokeWidth={2}
            fill="var(--solar-tint-1)"
            fillOpacity={collector2Opacity}
            name="Collector 2"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
        Total: {totalKwh.toFixed(0)} kWh across {data.length} days
      </p>
    </div>
  );
}
