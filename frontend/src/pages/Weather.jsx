import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard, CloudRain, Thermometer, Droplets, TrendingUp } from 'lucide-react';
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
import StatTile from '../components/charts/shared/StatTile';
import {
  useChartData,
  ChartStatus,
  shortDate,
  chartCardStyle,
  computeTrend,
  computeSum,
  computeAverage,
  computePeakDay,
  useDateSelection,
  useValidSelectedDate,
  SelectedDateChip,
} from '../components/charts/chartUtils';
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

  // No goodDirection is passed to these three trend badges — unlike
  // consumption/generation, neither direction is objectively "good" for a
  // weather reading, so the arrow stays neutral gray instead of red/green.
  const totalPrecip = useMemo(() => computeSum(dailyRecords, 'totalPrecipMm'), [dailyRecords]);
  const precipTrend = useMemo(() => (data ? computeTrend(dailyRecords, 'totalPrecipMm') : null), [data, dailyRecords]);
  const avgTemp = useMemo(() => computeAverage(dailyRecords, 'avgTempC'), [dailyRecords]);
  const tempTrend = useMemo(() => (data ? computeTrend(dailyRecords, 'avgTempC') : null), [data, dailyRecords]);
  const avgHumidity = useMemo(() => computeAverage(dailyRecords, 'avgHumidityPct'), [dailyRecords]);
  const humidityTrend = useMemo(
    () => (data ? computeTrend(dailyRecords, 'avgHumidityPct') : null),
    [data, dailyRecords]
  );
  const peakRainDay = useMemo(() => computePeakDay(dailyRecords, 'totalPrecipMm'), [dailyRecords]);

  const { selectedDate, toggleDate, clearDate } = useDateSelection();
  const validSelectedDate = useValidSelectedDate(selectedDate, dailyRecords);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '10px' }}>
        <DateRangeFilter range={range} onChange={setRange} />
        <SelectedDateChip date={validSelectedDate} onClear={clearDate} />
      </div>
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading weather data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <StatTile label="Total Precipitation" value={totalPrecip ?? 0} unit="mm" Icon={CloudRain} trend={precipTrend} />
            <StatTile
              label="Average Temperature"
              value={avgTemp ?? 0}
              unit="°C"
              Icon={Thermometer}
              trend={tempTrend}
              decimals={1}
            />
            <StatTile label="Average Humidity" value={avgHumidity ?? 0} unit="%" Icon={Droplets} trend={humidityTrend} />
            <StatTile
              label="Peak Rain Day"
              value={peakRainDay ? peakRainDay.totalPrecipMm : 0}
              unit="mm"
              Icon={TrendingUp}
              note={peakRainDay ? peakRainDay.date : '—'}
            />
          </div>
          <WeatherChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <WeatherPrecipChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
            <WeatherHumidityChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          </div>
          <CumulativeChart
            data={cumulativePrecipInput}
            title="Cumulative Precipitation"
            label="Cumulative Precipitation"
            color="var(--accent-teal)"
            unit="mm"
            selectedDate={validSelectedDate}
            onSelectDate={toggleDate}
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
      <AIInsightPanel domain="weather" />
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
