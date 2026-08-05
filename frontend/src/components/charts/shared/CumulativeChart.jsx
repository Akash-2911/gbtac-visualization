import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity } from '../chartUtils';

// Generic running-total chart — reused for cumulative energy, cumulative
// solar generation, cumulative precipitation, cumulative net energy, and
// cumulative CO2, so each page doesn't reimplement the same running-sum
// reducer. Filled (not a bare line) so it reads immediately as "running
// total" rather than a generic trend.
export default function CumulativeChart({ data, title, label, color, unit, showZeroLine = false }) {
  const chartData = useMemo(() => {
    let running = 0;
    return data.map((d) => {
      running += d.value || 0;
      return { date: d.date, cumulative: running };
    });
  }, [data]);
  const fillOpacity = useFillOpacity(0.18);

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={55} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} ${unit}`, label]}
          />
          {showZeroLine && <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="4 4" />}
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="cumulative"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={fillOpacity}
            name={label}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
