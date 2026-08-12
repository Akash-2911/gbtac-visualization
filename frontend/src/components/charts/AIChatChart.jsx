import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFillOpacity } from './chartUtils';

// Same per-domain colors used on the Energy/Solar/Emissions Recharts pages,
// so a chart surfaced in AI Chat reads as the same series rather than a
// disconnected one-off color.
const SERIES_COLOR = {
  energy: 'var(--accent-purple)',
  solar: 'var(--accent-blue)',
  emissions: 'var(--status-red-text)',
};

// Renders the chart data the backend already attached to an AI Chat answer
// (real SQL values, picked by the model only for *which* series to show —
// see aiChat.js's CHART_TAG_PATTERN). Never fetches or fabricates its own data.
export default function AIChatChart({ chart }) {
  const fillOpacity = useFillOpacity(0.18);
  if (!chart || !chart.data?.length) return null;

  const color = SERIES_COLOR[chart.series] || 'var(--ai-accent)';

  return (
    <div
      className="gbtac-fade-in"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '14px 14px 6px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{chart.label}</span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{chart.unit}/day</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chart.data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fontSize: 10 }} width={38} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} ${chart.unit}`, chart.label]}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={fillOpacity}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
