import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchEmissionsData } from '../../services/dataService';
import { useChartData, ChartStatus, shortDate, chartCardStyle, chartTitleStyle } from './chartUtils';

export default function EmissionsChart() {
  const { data, error, loading } = useChartData(fetchEmissionsData);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.dailyRecords.map((r) => ({
      date: shortDate(r.date),
      kgCo2e: r.kgCo2e,
    }));
  }, [data]);

  const status = <ChartStatus loading={loading} error={error} loadingLabel="Loading emissions data…" />;
  if (loading || error) {
    return <div style={chartCardStyle}>{status}</div>;
  }

  return (
    <div style={chartCardStyle}>
      <h3 style={chartTitleStyle}>Daily CO2 Emissions</h3>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
            formatter={(value) => [`${value.toFixed(1)} kg`, 'CO2e']}
          />
          <Area
            type="monotone"
            dataKey="kgCo2e"
            stroke="var(--status-red-text)"
            strokeWidth={2}
            fill="var(--status-red-text)"
            fillOpacity={0.15}
            name="kg CO2e"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
        Total: {data.totalCo2Kg.toFixed(0)} kg CO2e across {chartData.length} days
      </p>
    </div>
  );
}
