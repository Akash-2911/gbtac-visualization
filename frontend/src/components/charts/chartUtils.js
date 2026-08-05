import { useEffect, useState } from 'react';

// Shared data-fetch + loading/error state for all Recharts views — mirrors
// the pattern ForecastChart.jsx already established (loading/error/data
// states, 403/429-aware error messages).
export function useChartData(fetchFn) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFn()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchFn]);

  return { data, error, loading };
}

export function ChartStatus({ loading, error, loadingLabel = 'Loading chart…' }) {
  if (loading) {
    return (
      <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        {loadingLabel}
      </div>
    );
  }
  if (error) {
    let message = `Couldn't load chart data: ${error.message}`;
    if (error.status === 403) message = "You don't have permission to view this data.";
    if (error.status === 429) message = 'Please wait a moment — too many requests.';
    return (
      <div style={{ padding: '20px', color: 'var(--status-red-text)', fontSize: '0.875rem' }}>
        {message}
      </div>
    );
  }
  return null;
}

// Data endpoints return SQL Date columns JSON-serialized as full ISO
// timestamps ("2024-01-15T00:00:00.000Z") since they're not pre-formatted
// server-side (unlike /ai/predict, which already slices to YYYY-MM-DD).
export function shortDate(isoLike) {
  return String(isoLike).slice(0, 10);
}

export const chartCardStyle = {
  backgroundColor: 'var(--surface)',
  borderRadius: '10px',
  padding: '20px',
};

export const chartTitleStyle = {
  fontSize: '0.9375rem',
  marginBottom: '12px',
};
