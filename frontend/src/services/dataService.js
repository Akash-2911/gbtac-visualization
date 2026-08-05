import { authFetch } from './apiClient';

// All 5 data endpoints already accept optional from/to query params
// (backend defaults to full history when omitted) — this just builds the
// query string when the Recharts date-range filter has a range selected.
function buildQuery({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function fetchGreenhouseData(range) {
  return authFetch(`/greenhouse${buildQuery(range)}`);
}

export function fetchSolarData(range) {
  return authFetch(`/solar${buildQuery(range)}`);
}

export function fetchWeatherData(range) {
  return authFetch(`/weather${buildQuery(range)}`);
}

export function fetchSummaryData(range) {
  return authFetch(`/summary${buildQuery(range)}`);
}

export function fetchEmissionsData(range) {
  return authFetch(`/emissions${buildQuery(range)}`);
}

// Pure merge — no fetching — so callers that already have both responses
// (Compare, Overview) don't need to fetch /greenhouse + /solar twice just
// to get the merged view alongside the raw per-endpoint data.
export function mergeEnergyVsSolar(greenhouse, solar) {
  const byDate = new Map();
  for (const r of greenhouse.dailyRecords) {
    byDate.set(r.date, { date: r.date, energyKwh: r.totalKwh, solarKwh: 0 });
  }
  for (const r of solar.dailyRecords) {
    const existing = byDate.get(r.date);
    if (existing) existing.solarKwh = r.totalKwh;
    else byDate.set(r.date, { date: r.date, energyKwh: 0, solarKwh: r.totalKwh });
  }
  return Array.from(byDate.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Merges /greenhouse + /solar daily totals by date — neither endpoint alone
// has both series, and there's no combined backend endpoint (Power BI's
// "Energy vs Solar" page does this merge inside the .pbix model instead).
export async function fetchEnergyVsSolarData(range) {
  const [greenhouse, solar] = await Promise.all([fetchGreenhouseData(range), fetchSolarData(range)]);
  return {
    dailyRecords: mergeEnergyVsSolar(greenhouse, solar),
    totalEnergyKwh: greenhouse.totalKwh,
    totalSolarKwh: solar.totalKwh,
  };
}

// Bundles everything the Overview Recharts view needs into one Promise.all
// so the page fires 4 parallel requests instead of each chart fetching its
// own copy of the same data.
export async function fetchOverviewData(range) {
  const [summary, greenhouse, solar, emissions] = await Promise.all([
    fetchSummaryData(range),
    fetchGreenhouseData(range),
    fetchSolarData(range),
    fetchEmissionsData(range),
  ]);

  return { summary, greenhouse, solar, emissions, energyVsSolar: mergeEnergyVsSolar(greenhouse, solar) };
}

// Bundles what the Compare Recharts view needs — the raw greenhouse/solar
// responses (for the "breakdown" tab's per-system/per-collector charts) and
// the merged trend (for the "vs" tab) — from one fetch pass.
export async function fetchCompareData(range) {
  const [greenhouse, solar] = await Promise.all([fetchGreenhouseData(range), fetchSolarData(range)]);
  return {
    greenhouse,
    solar,
    energyVsSolar: mergeEnergyVsSolar(greenhouse, solar),
  };
}
