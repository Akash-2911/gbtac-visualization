import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity, makeChartClickHandler } from './chartUtils';

export default function CompareSelfSufficiencyChart({ data, selectedDate, onSelectDate }) {
  const fillOpacity = useFillOpacity(0.15);
  const chartData = useMemo(
    () =>
      data.map((r) => ({
        date: r.date,
        pct: r.energyKwh > 0 ? (r.solarKwh / r.energyKwh) * 100 : 0,
      })),
    [data]
  );

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Solar Self-Sufficiency</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          onClick={makeChartClickHandler(onSelectDate)}
          style={{ cursor: onSelectDate ? 'pointer' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} unit="%" />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(0)}%`, 'Self-sufficiency']}
          />
          <ReferenceLine y={100} stroke="var(--status-green-text)" strokeDasharray="4 4" label={{ value: '100%', fontSize: 10, fill: 'var(--status-green-text)' }} />
          {selectedDate && <ReferenceLine x={selectedDate} stroke="var(--text-muted)" strokeDasharray="4 4" />}
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="pct"
            stroke="var(--status-green-text)"
            strokeWidth={2}
            fill="var(--status-green-text)"
            fillOpacity={fillOpacity}
            name="Self-sufficiency"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
