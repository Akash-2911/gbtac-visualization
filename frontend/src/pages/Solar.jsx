import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard, Sun } from 'lucide-react';
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
  useDateSelection,
  useValidSelectedDate,
  SelectedDateChip,
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
  const trend = useMemo(() => (data ? computeTrend(data.dailyRecords, 'totalKwh') : null), [data]);

  const { selectedDate, toggleDate, clearDate } = useDateSelection();
  const validSelectedDate = useValidSelectedDate(selectedDate, dailyRecords);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '10px' }}>
        <DateRangeFilter range={range} onChange={setRange} />
        <SelectedDateChip date={validSelectedDate} onClear={clearDate} />
      </div>
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading solar data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <StatTile label="Total Solar Generated" value={data.totalKwh} unit="kWh" Icon={Sun} trend={trend} goodDirection="up" />
          <SolarChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <SolarSunlightChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <SolarCollectorTotalsChart data={dailyRecords} selectedDate={validSelectedDate} />
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
      <AIInsightPanel />
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
