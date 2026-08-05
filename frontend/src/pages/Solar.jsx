import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard } from 'lucide-react';
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
import { useChartData, ChartStatus, shortDate, chartCardStyle } from '../components/charts/chartUtils';
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

  return (
    <div>
      <DateRangeFilter range={range} onChange={setRange} />
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading solar data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SolarChart data={dailyRecords} totalKwh={data.totalKwh} />
          <SolarSunlightChart data={dailyRecords} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <SolarCollectorTotalsChart data={dailyRecords} />
            <ScatterCorrelationChart
              data={dailyRecords}
              title="Sunlight vs Generation"
              xKey="avgSunlightWm2"
              yKey="totalKwh"
              xLabel="Avg Sunlight (W/m²)"
              yLabel="Total kWh"
              color="var(--accent-blue)"
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
