import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle } from '../chartUtils';

// A scatter's two axes are magnitudes, not a date, so it can't trigger a
// date selection itself — it only reacts, emphasizing the point for
// whatever date got selected on another chart on the page.
function selectableDot(color, selectedDate) {
  return (props) => {
    const { cx, cy, payload } = props;
    const isSelected = selectedDate && payload.date === selectedDate;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 7 : 4}
        fill={color}
        fillOpacity={isSelected ? 1 : 0.65}
        stroke={isSelected ? 'var(--text-primary)' : 'none'}
        strokeWidth={isSelected ? 1.5 : 0}
      />
    );
  };
}

// Generic x/y relationship scatter — reused for sunlight-vs-generation and
// energy-vs-emissions. Two magnitude measures of different units belong on
// a scatter (each its own axis) rather than forced onto one shared axis.
export default function ScatterCorrelationChart({ data, title, xKey, yKey, xLabel, yLabel, color, selectedDate }) {
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey={xKey}
            type="number"
            name={xLabel}
            tick={{ fontSize: 11 }}
            label={{ value: xLabel, position: 'insideBottom', offset: -5, fontSize: 11, fill: 'var(--text-secondary)' }}
          />
          <YAxis
            dataKey={yKey}
            type="number"
            name={yLabel}
            tick={{ fontSize: 11 }}
            width={55}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-secondary)' }}
          />
          <ZAxis range={[40, 40]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
          />
          <Scatter data={data} fill={color} fillOpacity={0.65} isAnimationActive={false} shape={selectableDot(color, selectedDate)} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
