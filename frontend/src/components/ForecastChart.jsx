import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchAiForecast } from '../services/aiService';

export default function ForecastChart({ title = 'Energy Consumption Forecast' }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAiForecast()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((e) => {
        setError(e);
        setLoading(false);
      });
  }, []);

  // Merge historical + forecast into one date-indexed array so recharts can
  // plot both series (and the confidence band) on a shared X axis. Each row
  // only has the fields relevant to its period — recharts skips nulls for
  // Line (with connectNulls=false) so the two lines don't bleed into each
  // other's date range.
  const chartData = useMemo(() => {
    if (!data) return [];
    const historicalRows = data.historical.map((h) => ({
      date: h.date,
      actual_kwh: h.actual_kwh,
    }));
    const forecastRows = data.forecast.map((f) => ({
      date: f.date,
      predicted_kwh: f.predicted_kwh,
      // Recharts Area supports a [min, max] tuple as the dataKey value to
      // fill the band between two values directly.
      range: [f.lower_bound, f.upper_bound],
    }));
    return [...historicalRows, ...forecastRows];
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Loading forecast…
      </div>
    );
  }

  if (error) {
    let message = `Couldn't load forecast: ${error.message}`;
    if (error.status === 403) message = "You don't have permission to view forecasts.";
    if (error.status === 429) message = 'Please wait a moment — too many requests.';
    return (
      <div style={{ padding: '20px', color: 'var(--status-red-text)', fontSize: '0.875rem' }}>
        {message}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '20px' }}>
      <h3 style={{ fontSize: '0.9375rem', marginBottom: '12px' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />

          {/* Confidence band — shaded area between lower_bound and upper_bound */}
          <Area
            type="monotone"
            dataKey="range"
            stroke="none"
            fill="var(--accent-blue)"
            fillOpacity={0.12}
            name="Confidence range"
            connectNulls={false}
          />

          {/* Historical — solid line */}
          <Line
            type="monotone"
            dataKey="actual_kwh"
            stroke="var(--text-primary)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="Actual kWh"
          />

          {/* Forecast — dashed line */}
          <Line
            type="monotone"
            dataKey="predicted_kwh"
            stroke="var(--accent-blue)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls={false}
            name="Predicted kWh"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0 }}>
        Model: {data.model} · Trained on {data.training_days} days of data. {data.disclaimer}
      </p>
    </div>
  );
}