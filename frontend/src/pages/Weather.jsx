import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ViewToggle from '../components/ViewToggle';
import AIInsightPanel from '../components/AIInsightPanel';
import DateRangeFilter from '../components/charts/DateRangeFilter';
import WeatherChart from '../components/charts/WeatherChart';
import WeatherPrecipChart from '../components/charts/WeatherPrecipChart';
import WeatherHumidityChart from '../components/charts/WeatherHumidityChart';
import CumulativeChart from '../components/charts/shared/CumulativeChart';
import { useChartData, ChartStatus, shortDate, chartCardStyle } from '../components/charts/chartUtils';
import { fetchWeatherData } from '../services/dataService';

const VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

function WeatherRechartsView() {
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const { data, error, loading } = useChartData(() => fetchWeatherData(range), [range.from, range.to]);

  const dailyRecords = useMemo(() => {
    if (!data) return [];
    return data.dailyRecords.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const cumulativePrecipInput = useMemo(
    () => dailyRecords.map((r) => ({ date: r.date, value: r.totalPrecipMm })),
    [dailyRecords]
  );

  return (
    <div>
      <DateRangeFilter range={range} onChange={setRange} />
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading weather data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <WeatherChart data={dailyRecords} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <WeatherPrecipChart data={dailyRecords} />
            <WeatherHumidityChart data={dailyRecords} />
          </div>
          <CumulativeChart
            data={cumulativePrecipInput}
            title="Cumulative Precipitation"
            label="Cumulative Precipitation"
            color="var(--accent-blue)"
            unit="mm"
          />
        </div>
      )}
    </div>
  );
}

export default function Weather() {
  const [view, setView] = useState('powerbi');

  return (
    <PageContainer title="Weather" subtitle="Black Diamond weather station vs greenhouse performance">
      <AIInsightPanel />
      <ViewToggle value={view} onChange={setView} options={VIEW_OPTIONS} />
      {view === 'powerbi' ? (
        <ReportCard>
          <PowerBIReport reportKey="weather" />
        </ReportCard>
      ) : (
        <WeatherRechartsView />
      )}
    </PageContainer>
  );
}
