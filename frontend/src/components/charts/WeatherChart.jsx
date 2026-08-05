import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchWeatherData } from '../../services/dataService';
import { useChartData, ChartStatus, shortDate, chartCardStyle, chartTitleStyle } from './chartUtils';

export default function WeatherChart() {
  const { data, error, loading } = useChartData(fetchWeatherData);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.dailyRecords.map((r) => ({
      date: shortDate(r.date),
      minTempC: r.minTempC,
      avgTempC: r.avgTempC,
      maxTempC: r.maxTempC,
      totalPrecipMm: r.totalPrecipMm,
    }));
  }, [data]);

  const status = <ChartStatus loading={loading} error={error} loadingLabel="Loading weather data…" />;
  if (loading || error) {
    return <div style={chartCardStyle}>{status}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={chartCardStyle}>
        <h3 style={chartTitleStyle}>Daily Temperature Range</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={50} unit="°C" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
              formatter={(value, name) => [`${value.toFixed(1)}°C`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="minTempC" stroke="var(--accent-blue)" strokeWidth={2} dot={false} name="Min" />
            <Line
              type="monotone"
              dataKey="avgTempC"
              stroke="var(--text-secondary)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              name="Avg"
            />
            <Line type="monotone" dataKey="maxTempC" stroke="var(--status-orange-text)" strokeWidth={2} dot={false} name="Max" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={chartCardStyle}>
        <h3 style={chartTitleStyle}>Daily Precipitation</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={50} unit="mm" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px' }}
              formatter={(value) => [`${value.toFixed(1)} mm`, 'Precipitation']}
            />
            <Bar dataKey="totalPrecipMm" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} name="Precipitation" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
