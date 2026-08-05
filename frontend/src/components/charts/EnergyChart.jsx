import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchGreenhouseData } from '../../services/dataService';
import { useChartData, ChartStatus, shortDate, chartCardStyle, chartTitleStyle } from './chartUtils';

export default function EnergyChart() {
  const { data, error, loading } = useChartData(fetchGreenhouseData);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.dailyRecords.map((r) => ({
      date: shortDate(r.date),
      totalKwh: r.totalKwh,
    }));
  }, [data]);

  const status = <ChartStatus loading={loading} error={error} loadingLabel="Loading energy data…" />;
  if (loading || error) {
    return <div style={chartCardStyle}>{status}</div>;
  }

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily Energy Consumption</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} kWh`, 'Total Energy']}
          />
          <Area
            type="monotone"
            dataKey="totalKwh"
            stroke="var(--accent-blue)"
            strokeWidth={2}
            fill="var(--accent-blue)"
            fillOpacity={0.15}
            name="Total kWh"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
        Total: {data.totalKwh.toFixed(0)} kWh across {chartData.length} days
      </p>
    </div>
  );
}
