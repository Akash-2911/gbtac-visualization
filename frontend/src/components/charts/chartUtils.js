import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
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

// Day-over-day trend for a KPI tile, computed from daily records already
// fetched for that page's chart — no extra request. Returns null (no
// arrow shown) when there isn't a real prior day to compare against,
// rather than fabricating a comparison.
export function computeTrend(dailyRecords, valueKey) {
  if (!dailyRecords || dailyRecords.length < 2) return null;
  const sorted = [...dailyRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const lastVal = last[valueKey] || 0;
  const prevVal = prev[valueKey] || 0;
  if (lastVal === prevVal) return { direction: 'flat', deltaPct: 0 };
  return {
    direction: lastVal > prevVal ? 'up' : 'down',
    deltaPct: prevVal !== 0 ? ((lastVal - prevVal) / prevVal) * 100 : null,
  };
}

// Cross-filter selection ("Model A" — click a date on any trend chart,
// every other trend chart on the page marks it, category-total charts
// swap to that single day). One selection per page, toggled by clicking
// the same date again — mirrors the toggle behavior of every other filter
// chip in this app.
export function useDateSelection() {
  const [selectedDate, setSelectedDate] = useState(null);
  const toggleDate = (date) => setSelectedDate((prev) => (prev === date ? null : date));
  const clearDate = () => setSelectedDate(null);
  return { selectedDate, toggleDate, clearDate };
}

// A selected date only stays valid while it's actually present in the
// page's current daily records — if the date range changes underneath it,
// the selection silently clears instead of pointing at stale/missing data.
export function useValidSelectedDate(selectedDate, dailyRecords) {
  return useMemo(
    () => (selectedDate && dailyRecords.some((r) => r.date === selectedDate) ? selectedDate : null),
    [selectedDate, dailyRecords]
  );
}

// Recharts fires this on any Area/Bar/Line/Composed chart click with the
// x-axis category under the pointer as `activeLabel`.
export function makeChartClickHandler(onSelectDate) {
  if (!onSelectDate) return undefined;
  return (state) => {
    if (state && state.activeLabel) onSelectDate(state.activeLabel);
  };
}

// Single "clear" affordance for the page's active date selection — sits
// next to DateRangeFilter so there's always one obvious way out, regardless
// of which chart the selection came from.
export function SelectedDateChip({ date, onClear }) {
  if (!date) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      className="gbtac-btn-fx"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '7px 10px',
        fontSize: '12px',
        fontWeight: 600,
        borderRadius: '8px',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-secondary)',
        marginBottom: '16px',
      }}
    >
      {date}
      <X size={12} />
    </button>
  );
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
