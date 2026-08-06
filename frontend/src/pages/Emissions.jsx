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
import { useChartData, ChartStatus, shortDate, chartCardStyle, computeTrend } from '../components/charts/chartUtils';
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

  return (
    <div>
      <DateRangeFilter range={range} onChange={setRange} />
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading emissions data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <StatTile label="Total CO2 Emissions" value={data.totalCo2Kg} unit="kg" Icon={Cloud} trend={trend} goodDirection="down" />
          <EmissionsChart data={dailyRecords} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <EmissionsIntensityChart data={dailyRecords} />
            <CumulativeChart
              data={cumulativeInput}
              title="Cumulative CO2 Emissions"
              label="Cumulative CO2e"
              color="var(--status-red-text)"
              unit="kg"
            />
            <EmissionsMonthlyChart dailyRecords={dailyRecords} />
          </div>
          <ScatterCorrelationChart
            data={dailyRecords}
            title="Energy vs Emissions"
            xKey="totalKwh"
            yKey="kgCo2e"
            xLabel="Total kWh"
            yLabel="kg CO2e"
            color="var(--status-red-text)"
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
