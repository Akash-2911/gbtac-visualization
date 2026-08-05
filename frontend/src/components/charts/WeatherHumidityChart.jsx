import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle } from './chartUtils';

export default function WeatherHumidityChart({ data }) {
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Average Humidity</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} unit="%" domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(0)}%`, 'Humidity']}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="avgHumidityPct"
            stroke="var(--accent-purple)"
            strokeWidth={2}
            fill="var(--accent-purple)"
            fillOpacity={0.15}
            name="Avg Humidity"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
