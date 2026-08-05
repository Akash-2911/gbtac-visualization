import { authFetch } from './apiClient';

export function fetchGreenhouseData() {
  return authFetch('/greenhouse');
}

export function fetchSolarData() {
  return authFetch('/solar');
}

export function fetchWeatherData() {
  return authFetch('/weather');
}

export function fetchSummaryData() {
  return authFetch('/summary');
}

export function fetchEmissionsData() {
  return authFetch('/emissions');
}

// Merges /greenhouse + /solar daily totals by date for the Compare/Overview
// Recharts views — neither endpoint alone has both series, and there's no
// combined backend endpoint (Power BI's "Energy vs Solar" page does this
// merge inside the .pbix model instead).
export async function fetchEnergyVsSolarData() {
  const [greenhouse, solar] = await Promise.all([fetchGreenhouseData(), fetchSolarData()]);

  const byDate = new Map();
  for (const r of greenhouse.dailyRecords) {
    byDate.set(r.date, { date: r.date, energyKwh: r.totalKwh, solarKwh: 0 });
  }
  for (const r of solar.dailyRecords) {
    const existing = byDate.get(r.date);
    if (existing) {
      existing.solarKwh = r.totalKwh;
    } else {
      byDate.set(r.date, { date: r.date, energyKwh: 0, solarKwh: r.totalKwh });
    }
  }

  const dailyRecords = Array.from(byDate.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    dailyRecords,
    totalEnergyKwh: greenhouse.totalKwh,
    totalSolarKwh: solar.totalKwh,
  };
}
