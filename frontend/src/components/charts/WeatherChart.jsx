import React, { useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity } from './chartUtils';

// Filled min-max range band (teal min line, orange max line+fill) with a
// dashed avg line through the middle, instead of three separate plain
// lines — shows the daily spread at a glance rather than three traces to
// mentally connect. The band is built from Recharts' stacked-area trick:
// an invisible base area at `minTempC`, then a visible area for the
// `rangeTempC` (max - min) delta stacked on top of it, whose top edge lands
// exactly at maxTempC.
function TempTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '8px 10px',
        fontSize: '12px',
      }}
    >
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--status-orange-text)' }}>Max: {point.maxTempC.toFixed(1)}°C</div>
      <div style={{ color: 'var(--text-secondary)' }}>Avg: {point.avgTempC.toFixed(1)}°C</div>
      <div style={{ color: 'var(--accent-teal)' }}>Min: {point.minTempC.toFixed(1)}°C</div>
    </div>
  );
}

export default function WeatherChart({ data }) {
  const chartData = useMemo(
    () => data.map((r) => ({ ...r, rangeTempC: r.maxTempC - r.minTempC })),
    [data]
  );
  const fillOpacity = useFillOpacity(0.14);

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily Temperature Range</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} unit="°C" />
          <Tooltip content={<TempTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            payload={[
              { value: 'Max', type: 'line', color: 'var(--status-orange-text)' },
              { value: 'Avg', type: 'line', color: 'var(--text-secondary)' },
              { value: 'Min', type: 'line', color: 'var(--accent-teal)' },
            ]}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="minTempC"
            stackId="range"
            stroke="none"
            fill="transparent"
            legendType="none"
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="rangeTempC"
            stackId="range"
            stroke="var(--status-orange-text)"
            strokeWidth={2}
            fill="var(--status-orange-text)"
            fillOpacity={fillOpacity}
            legendType="none"
          />
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="minTempC"
            stroke="var(--accent-teal)"
            strokeWidth={2}
            dot={false}
            legendType="none"
          />
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="avgTempC"
            stroke="var(--text-secondary)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
