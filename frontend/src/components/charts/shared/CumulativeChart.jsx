import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle } from '../chartUtils';

// Generic running-total line chart — reused for cumulative energy,
// cumulative solar generation, cumulative precipitation, cumulative net
// energy, and cumulative CO2, so each page doesn't reimplement the same
// running-sum reducer.
export default function CumulativeChart({ data, title, label, color, unit, showZeroLine = false }) {
  const chartData = useMemo(() => {
    let running = 0;
    return data.map((d) => {
      running += d.value || 0;
      return { date: d.date, cumulative: running };
    });
  }, [data]);

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={55} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} ${unit}`, label]}
          />
          {showZeroLine && <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="4 4" />}
          <Line type="monotone" dataKey="cumulative" stroke={color} strokeWidth={2} dot={false} name={label} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
