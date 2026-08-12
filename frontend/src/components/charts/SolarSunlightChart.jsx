import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity, makeChartClickHandler } from './chartUtils';

// Both series belong to the "sunlight" category, so both stay in the
// orange family — average as a filled area, peak as a dashed line over it —
// instead of splitting them across two unrelated hues.
export default function SolarSunlightChart({ data, selectedDate, onSelectDate }) {
  const fillOpacity = useFillOpacity(0.15);
  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Sunlight Intensity</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          onClick={makeChartClickHandler(onSelectDate)}
          style={{ cursor: onSelectDate ? 'pointer' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={55} unit=" W/m²" />
          {selectedDate && <ReferenceLine x={selectedDate} stroke="var(--text-muted)" strokeDasharray="4 4" />}
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value, name) => [`${value.toFixed(0)} W/m²`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="avgSunlightWm2"
            stroke="var(--status-orange-text)"
            strokeWidth={2}
            fill="var(--status-orange-text)"
            fillOpacity={fillOpacity}
            name="Average"
          />
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="peakSunlightWm2"
            stroke="var(--status-orange-text)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            name="Peak"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
