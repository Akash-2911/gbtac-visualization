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
//
// Compares the last two days actually present in whatever records were
// passed in — which, once a date-range filter is applied, are not
// necessarily "yesterday" relative to today. Returns both dates so the
// caller can label the comparison honestly instead of assuming "yesterday".
export function computeTrend(dailyRecords, valueKey) {
  if (!dailyRecords || dailyRecords.length < 2) return null;
  const sorted = [...dailyRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const lastVal = last[valueKey] || 0;
  const prevVal = prev[valueKey] || 0;
  const dates = { lastDate: last.date, prevDate: prev.date };
  if (lastVal === prevVal) return { ...dates, direction: 'flat', deltaPct: 0 };
  return {
    ...dates,
    direction: lastVal > prevVal ? 'up' : 'down',
    deltaPct: prevVal !== 0 ? ((lastVal - prevVal) / prevVal) * 100 : null,
  };
}

// "Aug 5" — used to name the actual date a trend is comparing against, for
// the (common, once a date-range filter is applied) case where that date
// isn't really yesterday.
export function formatShortDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Range-wide sum of a numeric field across dailyRecords — used where the API
// doesn't already return a period total (unlike totalKwh/totalCo2Kg, which
// the backend computes server-side for other pages).
export function computeSum(dailyRecords, valueKey) {
  if (!dailyRecords || dailyRecords.length === 0) return null;
  return dailyRecords.reduce((acc, r) => acc + (r[valueKey] || 0), 0);
}

// Range-wide mean of a numeric field. Deliberately has no trend companion —
// a range average has no single prior value to compare against without
// fetching a second date range, so callers pass trend={null}/note instead of
// fabricating one (same honesty rule as computeTrend's null case).
export function computeAverage(dailyRecords, valueKey) {
  const sum = computeSum(dailyRecords, valueKey);
  return sum === null ? null : sum / dailyRecords.length;
}

// The single highest day for valueKey, keeping its date — powers "Peak Day"
// KPI tiles. Same no-trend reasoning as computeAverage.
export function computePeakDay(dailyRecords, valueKey) {
  if (!dailyRecords || dailyRecords.length === 0) return null;
  return dailyRecords.reduce((peak, r) => ((r[valueKey] ?? -Infinity) > (peak[valueKey] ?? -Infinity) ? r : peak));
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

// Cross-filter selection ("Model B" — click a legend entry, that category
// is emphasized everywhere it appears on the page; every other category
// dims). One shared name per page, same toggle-to-clear pattern as
// useDateSelection. A single page can host two unrelated category domains
// (Compare's breakdown tab has both energy systems and solar collectors) —
// rather than tracking two states, each chart decides for itself whether
// the active name belongs to its own category set (see `relevantCategory`
// below), so selecting one domain's category harmlessly leaves the other
// domain's chart at full brightness instead of wrongly dimming it.
export function useCategorySelection() {
  const [activeCategory, setActiveCategory] = useState(null);
  const toggleCategory = (name) => setActiveCategory((prev) => (prev === name ? null : name));
  return { activeCategory, toggleCategory };
}

// Only treat `activeCategory` as active for a chart if it's actually one of
// that chart's own category names.
export function relevantCategory(activeCategory, names) {
  return activeCategory && names.includes(activeCategory) ? activeCategory : null;
}

// Clickable legend for stacked-area breakdown charts (EnergyBreakdownChart,
// SolarChart) — replaces Recharts' own <Legend>, which can't take an
// onClick per entry. Active entry is bolded; every other entry dims,
// signaling "click again to clear" the same way CategoryTotalsChart's own
// legend already does.
export function CategoryLegend({ items, activeCategory, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: '10px' }}>
      {items.map((item) => {
        const isActive = activeCategory === item.name;
        const isDimmed = Boolean(activeCategory) && !isActive;
        return (
          <button
            key={item.name}
            type="button"
            onClick={() => onToggle(item.name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: isActive ? 700 : 500,
              color: isDimmed ? 'var(--text-muted)' : 'var(--text-secondary)',
              opacity: isDimmed ? 0.55 : 1,
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: item.color, flexShrink: 0 }} />
            {item.name}
          </button>
        );
      })}
    </div>
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
