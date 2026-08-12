import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { chartCardStyle, chartTitleStyle, useFillOpacity, makeChartClickHandler, relevantCategory, CategoryLegend } from './chartUtils';

const COLLECTOR_NAMES = ['Collector 1', 'Collector 2'];

export default function SolarChart({ data, selectedDate, onSelectDate, activeCategory, onToggleCategory }) {
  const collector1Opacity = useFillOpacity(0.25);
  const collector2Opacity = useFillOpacity(0.4);
  const activeCollector = relevantCategory(activeCategory, COLLECTOR_NAMES);
  const collector1Dimmed = activeCollector && activeCollector !== 'Collector 1';
  const collector2Dimmed = activeCollector && activeCollector !== 'Collector 2';

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily Solar Generation by Collector</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          onClick={makeChartClickHandler(onSelectDate)}
          style={{ cursor: onSelectDate ? 'pointer' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          {selectedDate && <ReferenceLine x={selectedDate} stroke="var(--text-muted)" strokeDasharray="4 4" />}
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value, name) => [`${value.toFixed(1)} kWh`, name]}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="collector1Kwh"
            stackId="1"
            stroke="var(--accent-blue)"
            strokeWidth={2}
            strokeOpacity={collector1Dimmed ? 0.3 : 1}
            fill="var(--accent-blue)"
            fillOpacity={collector1Dimmed ? collector1Opacity * 0.3 : collector1Opacity}
            name="Collector 1"
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="collector2Kwh"
            stackId="1"
            stroke="var(--solar-tint-1)"
            strokeWidth={2}
            strokeOpacity={collector2Dimmed ? 0.3 : 1}
            fill="var(--solar-tint-1)"
            fillOpacity={collector2Dimmed ? collector2Opacity * 0.3 : collector2Opacity}
            name="Collector 2"
          />
        </AreaChart>
      </ResponsiveContainer>
      <CategoryLegend
        items={[
          { name: 'Collector 1', color: 'var(--accent-blue)' },
          { name: 'Collector 2', color: 'var(--solar-tint-1)' },
        ]}
        activeCategory={activeCollector}
        onToggle={onToggleCategory}
      />
    </div>
  );
}
