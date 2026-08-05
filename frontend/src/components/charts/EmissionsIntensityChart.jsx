import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle } from './chartUtils';

export default function EmissionsIntensityChart({ data }) {
  const chartData = useMemo(
    () =>
      data.map((r) => ({
        date: r.date,
        intensity: r.totalKwh > 0 ? r.kgCo2e / r.totalKwh : 0,
      })),
    [data]
  );

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>CO2 Intensity (kg per kWh)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={55} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(3)} kg/kWh`, 'Intensity']}
          />
          <Line type="monotone" dataKey="intensity" stroke="var(--status-red-text)" strokeWidth={2} dot={false} name="kg CO2e / kWh" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
