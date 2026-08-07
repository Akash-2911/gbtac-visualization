import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard, Cloud } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ViewToggle from '../components/ViewToggle';
import AIInsightPanel from '../components/AIInsightPanel';
import DateRangeFilter from '../components/charts/DateRangeFilter';
import EmissionsChart from '../components/charts/EmissionsChart';
import EmissionsIntensityChart from '../components/charts/EmissionsIntensityChart';
import EmissionsMonthlyChart from '../components/charts/EmissionsMonthlyChart';
import CumulativeChart from '../components/charts/shared/CumulativeChart';
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
import { fetchEmissionsData } from '../services/dataService';

const VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

function EmissionsRechartsView() {
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const { data, error, loading } = useChartData(() => fetchEmissionsData(range), [range.from, range.to]);

  const dailyRecords = useMemo(() => {
    if (!data) return [];
    return data.dailyRecords.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const cumulativeInput = useMemo(() => dailyRecords.map((r) => ({ date: r.date, value: r.kgCo2e })), [dailyRecords]);
  const trend = useMemo(() => (data ? computeTrend(data.dailyRecords, 'kgCo2e') : null), [data]);

  const { selectedDate, toggleDate, clearDate } = useDateSelection();
  const validSelectedDate = useValidSelectedDate(selectedDate, dailyRecords);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '10px' }}>
        <DateRangeFilter range={range} onChange={setRange} />
        <SelectedDateChip date={validSelectedDate} onClear={clearDate} />
      </div>
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading emissions data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <StatTile label="Total CO2 Emissions" value={data.totalCo2Kg} unit="kg" Icon={Cloud} trend={trend} goodDirection="down" />
          </div>
          <EmissionsChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <EmissionsIntensityChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
            <CumulativeChart
              data={cumulativeInput}
              title="Cumulative CO2 Emissions"
              label="Cumulative CO2e"
              color="var(--status-red-text)"
              unit="kg"
              selectedDate={validSelectedDate}
              onSelectDate={toggleDate}
            />
            <EmissionsMonthlyChart dailyRecords={dailyRecords} selectedDate={validSelectedDate} />
          </div>
          <ScatterCorrelationChart
            data={dailyRecords}
            title="Energy vs Emissions"
            xKey="totalKwh"
            yKey="kgCo2e"
            xLabel="Total kWh"
            yLabel="kg CO2e"
            color="var(--status-red-text)"
            selectedDate={validSelectedDate}
          />
        </div>
      )}
    </div>
  );
}

export default function Emissions() {
  const [view, setView] = useState('powerbi');

  return (
    <PageContainer
      title="Emissions"
      subtitle="CO2 emissions from greenhouse energy consumption"
    >
      <AIInsightPanel />
      <ViewToggle value={view} onChange={setView} options={VIEW_OPTIONS} />
      {view === 'powerbi' ? (
        <ReportCard>
          <PowerBIReport reportKey="emissions" />
        </ReportCard>
      ) : (
        <EmissionsRechartsView />
      )}
    </PageContainer>
  );
}
