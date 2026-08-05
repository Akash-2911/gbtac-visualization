import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchSolarData } from '../../services/dataService';
import { useChartData, ChartStatus, shortDate, chartCardStyle, chartTitleStyle } from './chartUtils';

export default function SolarChart() {
  const { data, error, loading } = useChartData(fetchSolarData);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.dailyRecords.map((r) => ({
      date: shortDate(r.date),
      collector1Kwh: r.collector1Kwh,
      collector2Kwh: r.collector2Kwh,
    }));
  }, [data]);

  const status = <ChartStatus loading={loading} error={error} loadingLabel="Loading solar data…" />;
  if (loading || error) {
    return <div style={chartCardStyle}>{status}</div>;
  }

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily Solar Generation by Collector</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value, name) => [`${value.toFixed(1)} kWh`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area
            type="monotone"
            dataKey="collector1Kwh"
            stackId="1"
            stroke="var(--accent-blue)"
            strokeWidth={2}
            fill="var(--accent-blue)"
            fillOpacity={0.25}
            name="Collector 1"
          />
          <Area
            type="monotone"
            dataKey="collector2Kwh"
            stackId="1"
            stroke="var(--accent-purple)"
            strokeWidth={2}
            fill="var(--accent-purple)"
            fillOpacity={0.25}
            name="Collector 2"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
        Total: {data.totalKwh.toFixed(0)} kWh across {chartData.length} days
      </p>
    </div>
  );
}
