import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ViewToggle from '../components/ViewToggle';
import AIInsightPanel from '../components/AIInsightPanel';
import DateRangeFilter from '../components/charts/DateRangeFilter';
import OverviewChart from '../components/charts/OverviewChart';
import CompareChart from '../components/charts/CompareChart';
import EnergyBreakdownChart from '../components/charts/EnergyBreakdownChart';
import EmissionsChart from '../components/charts/EmissionsChart';
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
import { fetchOverviewData } from '../services/dataService';

const VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

function OverviewRechartsView() {
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const { data, error, loading } = useChartData(() => fetchOverviewData(range), [range.from, range.to]);

  const energyVsSolar = useMemo(() => {
    if (!data) return [];
    return data.energyVsSolar.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const greenhouseRecords = useMemo(() => {
    if (!data) return [];
    return data.greenhouse.dailyRecords.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const emissionsRecords = useMemo(() => {
    if (!data) return [];
    return data.emissions.dailyRecords.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const trends = useMemo(() => {
    if (!data) return {};
    return {
      totalEnergyUsedKwh: computeTrend(data.greenhouse.dailyRecords, 'totalKwh'),
      totalSolarGeneratedKwh: computeTrend(data.solar.dailyRecords, 'totalKwh'),
      totalCo2EmissionsKg: computeTrend(data.emissions.dailyRecords, 'kgCo2e'),
      // No daily breakdown of peak demand is fetched on this page, so no
      // entry here — OverviewChart shows no trend arrow for that tile
      // rather than fabricating one.
    };
  }, [data]);

  const { selectedDate, toggleDate, clearDate } = useDateSelection();
  const validSelectedDate = useValidSelectedDate(selectedDate, greenhouseRecords);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '10px' }}>
        <DateRangeFilter range={range} onChange={setRange} />
        <SelectedDateChip date={validSelectedDate} onClear={clearDate} />
      </div>
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading overview…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <OverviewChart summary={data.summary} trends={trends} />
          <CompareChart data={energyVsSolar} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <EnergyBreakdownChart dailyRecords={greenhouseRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <EmissionsChart data={emissionsRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
        </div>
      )}
    </div>
  );
}

export default function Overview() {
  const [view, setView] = useState('powerbi');

  return (
    <PageContainer title="Overview" subtitle="Sprung Greenhouse — Black Diamond, Alberta">
      <AIInsightPanel />
      <ViewToggle value={view} onChange={setView} options={VIEW_OPTIONS} />
      {view === 'powerbi' ? <PowerBIReport reportKey="overview" /> : <OverviewRechartsView />}
    </PageContainer>
  );
}
