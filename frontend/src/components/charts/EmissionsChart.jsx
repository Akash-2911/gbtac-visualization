import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity } from './chartUtils';

export default function EmissionsChart({ data, totalCo2Kg }) {
  const fillOpacity = useFillOpacity(0.15);
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily CO2 Emissions</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
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
      {totalCo2Kg != null && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
          Total: {totalCo2Kg.toFixed(0)} kg CO2e across {data.length} days
        </p>
      )}
    </div>
  );
}
