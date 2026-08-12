import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard, Sun, TrendingUp, Sunrise } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ViewToggle from '../components/ViewToggle';
import AIInsightPanel from '../components/AIInsightPanel';
import DateRangeFilter from '../components/charts/DateRangeFilter';
import SolarChart from '../components/charts/SolarChart';
import SolarSunlightChart from '../components/charts/SolarSunlightChart';
import SolarCollectorTotalsChart from '../components/charts/SolarCollectorTotalsChart';
import ScatterCorrelationChart from '../components/charts/shared/ScatterCorrelationChart';
import StatTile from '../components/charts/shared/StatTile';
import {
  useChartData,
  ChartStatus,
  shortDate,
  chartCardStyle,
  computeTrend,
  computeAverage,
  computePeakDay,
  useDateSelection,
  useValidSelectedDate,
  SelectedDateChip,
  useCategorySelection,
} from '../components/charts/chartUtils';
import { fetchSolarData } from '../services/dataService';

const VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

function SolarRechartsView() {
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const { data, error, loading } = useChartData(() => fetchSolarData(range), [range.from, range.to]);

  const dailyRecords = useMemo(() => {
    if (!data) return [];
    return data.dailyRecords.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);
  const trend = useMemo(() => (data ? computeTrend(dailyRecords, 'totalKwh') : null), [data, dailyRecords]);
  const avgDaily = useMemo(() => computeAverage(dailyRecords, 'totalKwh'), [dailyRecords]);
  const peakDay = useMemo(() => computePeakDay(dailyRecords, 'totalKwh'), [dailyRecords]);
  const peakSunlight = useMemo(() => {
    if (dailyRecords.length === 0) return null;
    return Math.max(...dailyRecords.map((r) => r.peakSunlightWm2 || 0));
  }, [dailyRecords]);

  const { selectedDate, toggleDate, clearDate } = useDateSelection();
  const validSelectedDate = useValidSelectedDate(selectedDate, dailyRecords);
  const { activeCategory, toggleCategory } = useCategorySelection();

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '10px' }}>
        <DateRangeFilter range={range} onChange={setRange} />
        <SelectedDateChip date={validSelectedDate} onClear={clearDate} />
      </div>
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading solar data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <StatTile label="Total Solar Generated" value={data.totalKwh} unit="kWh" Icon={Sun} trend={trend} goodDirection="up" />
            <StatTile
              label="Average Daily Generation"
              value={avgDaily ?? 0}
              unit="kWh/day"
              Icon={BarChart3}
              note="mean over selected range"
            />
            <StatTile
              label="Peak Day"
              value={peakDay ? peakDay.totalKwh : 0}
              unit="kWh"
              Icon={TrendingUp}
              note={peakDay ? peakDay.date : '—'}
            />
            <StatTile
              label="Peak Sunlight"
              value={peakSunlight ?? 0}
              unit="W/m²"
              Icon={Sunrise}
              note="max over selected range"
            />
          </div>
          <SolarChart
            data={dailyRecords}
            selectedDate={validSelectedDate}
            onSelectDate={toggleDate}
            activeCategory={activeCategory}
            onToggleCategory={toggleCategory}
          />
          <SolarSunlightChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <SolarCollectorTotalsChart
              data={dailyRecords}
              selectedDate={validSelectedDate}
              activeCategory={activeCategory}
              onToggleCategory={toggleCategory}
            />
            <ScatterCorrelationChart
              data={dailyRecords}
              title="Sunlight vs Generation"
              xKey="avgSunlightWm2"
              yKey="totalKwh"
              xLabel="Avg Sunlight (W/m²)"
              yLabel="Total kWh"
              color="var(--status-orange-text)"
              selectedDate={validSelectedDate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Solar() {
  const [view, setView] = useState('powerbi');

  return (
    <PageContainer title="Solar" subtitle="Real-time solar collection and power output data">
      <AIInsightPanel domain="solar" />
      <ViewToggle value={view} onChange={setView} options={VIEW_OPTIONS} />
      {view === 'powerbi' ? (
        <ReportCard>
          <PowerBIReport reportKey="solarGeneration" />
        </ReportCard>
      ) : (
        <SolarRechartsView />
      )}
    </PageContainer>
  );
}
