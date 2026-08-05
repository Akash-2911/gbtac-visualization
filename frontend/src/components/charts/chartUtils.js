import { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';

// Shared data-fetch + loading/error state for all Recharts views — mirrors
// the pattern ForecastChart.jsx already established (loading/error/data
// states, 403/429-aware error messages).
//
// `deps` explicitly controls when to refetch (e.g. [range.from, range.to])
// rather than relying on fetchFn's identity — callers pass a fresh closure
// each render (`() => fetchGreenhouseData(range)`), so keying off fetchFn
// itself would refetch every render. This project doesn't have the
// react-hooks eslint plugin configured, so there's no exhaustive-deps
// warning to satisfy either way.
export function useChartData(fetchFn, deps = []) {
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
  }, deps);

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

// A translucent fill blended over a near-black surface reads noticeably
// fainter than the same alpha over white — dark mode needs a higher
// fillOpacity to look equally present, not a flat reuse of the light-mode
// value. Scales up only in dark mode so the already-approved light-mode
// look is untouched.
export function useFillOpacity(base) {
  const { theme } = useTheme();
  return theme === 'dark' ? Math.min(base * 1.6, 0.9) : base;
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
