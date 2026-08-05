import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle } from './chartUtils';

export default function CompareChart({ data, totalEnergyKwh, totalSolarKwh }) {
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Energy Consumed vs Solar Generated</h3>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value, name) => [`${value.toFixed(1)} kWh`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="energyKwh" stroke="var(--accent-blue)" strokeWidth={2} dot={false} name="Energy Consumed" isAnimationActive={false} />
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="solarKwh"
            stroke="var(--status-green-text)"
            strokeWidth={2}
            dot={false}
            name="Solar Generated"
          />
        </LineChart>
      </ResponsiveContainer>
      {totalEnergyKwh != null && totalSolarKwh != null && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
          Total consumed: {totalEnergyKwh.toFixed(0)} kWh · Total generated: {totalSolarKwh.toFixed(0)} kWh
        </p>
      )}
    </div>
  );
}
