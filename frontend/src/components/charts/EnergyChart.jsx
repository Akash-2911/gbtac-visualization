import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity } from './chartUtils';

// Presentational — receives already-fetched daily records (page-level
// fetch is shared across this page's other charts) rather than fetching
// its own copy of the same endpoint.
export default function EnergyChart({ data, totalKwh }) {
  const fillOpacity = useFillOpacity(0.15);
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily Energy Consumption</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} kWh`, 'Total Energy']}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="totalKwh"
            stroke="var(--accent-purple)"
            strokeWidth={2}
            fill="var(--accent-purple)"
            fillOpacity={fillOpacity}
            name="Total kWh"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
        Total: {totalKwh.toFixed(0)} kWh across {data.length} days
      </p>
    </div>
  );
}
