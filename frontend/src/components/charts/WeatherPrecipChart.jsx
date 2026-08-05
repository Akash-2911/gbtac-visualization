import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle } from './chartUtils';

export default function WeatherPrecipChart({ data }) {
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily Precipitation</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} unit="mm" />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} mm`, 'Precipitation']}
          />
          <Bar dataKey="totalPrecipMm" fill="var(--accent-teal)" radius={[4, 4, 0, 0]} name="Precipitation" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
