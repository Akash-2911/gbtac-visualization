import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle } from './chartUtils';

// Diverging pair (avg = cool/neutral pole, peak = warm pole) — same
// convention as WeatherChart's temperature range.
export default function SolarSunlightChart({ data }) {
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Sunlight Intensity</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={55} unit=" W/m²" />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value, name) => [`${value.toFixed(0)} W/m²`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="avgSunlightWm2" stroke="var(--accent-blue)" strokeWidth={2} dot={false} name="Average" isAnimationActive={false} />
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="peakSunlightWm2"
            stroke="var(--status-orange-text)"
            strokeWidth={2}
            dot={false}
            name="Peak"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
