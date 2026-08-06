import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, LayoutDashboard, Zap } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ForecastChart from '../components/ForecastChart';
import ViewToggle from '../components/ViewToggle';
import AIInsightPanel from '../components/AIInsightPanel';
import DateRangeFilter from '../components/charts/DateRangeFilter';
import EnergyChart from '../components/charts/EnergyChart';
import EnergyBreakdownChart from '../components/charts/EnergyBreakdownChart';
import EnergyBySystemChart from '../components/charts/EnergyBySystemChart';
import CumulativeChart from '../components/charts/shared/CumulativeChart';
import StatTile from '../components/charts/shared/StatTile';
import { useChartData, ChartStatus, shortDate, chartCardStyle, computeTrend } from '../components/charts/chartUtils';
import { fetchGreenhouseData } from '../services/dataService';

const VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

function EnergyRechartsView() {
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const { data, error, loading } = useChartData(() => fetchGreenhouseData(range), [range.from, range.to]);

  const dailyRecords = useMemo(() => {
    if (!data) return [];
    return data.dailyRecords.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const cumulativeInput = useMemo(() => dailyRecords.map((r) => ({ date: r.date, value: r.totalKwh })), [dailyRecords]);
  const trend = useMemo(() => (data ? computeTrend(data.dailyRecords, 'totalKwh') : null), [data]);

  return (
    <div>
      <DateRangeFilter range={range} onChange={setRange} />
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading energy data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <StatTile label="Total Energy Used" value={data.totalKwh} unit="kWh" Icon={Zap} trend={trend} goodDirection="down" />
          <EnergyChart data={dailyRecords} />
          <EnergyBreakdownChart dailyRecords={dailyRecords} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <EnergyBySystemChart dailyRecords={dailyRecords} />
            <CumulativeChart
              data={cumulativeInput}
              title="Cumulative Energy Consumption"
              label="Cumulative kWh"
              color="var(--accent-purple)"
              unit="kWh"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Energy() {
  const [showForecast, setShowForecast] = useState(false);
  const [view, setView] = useState('powerbi');

  return (
    <PageContainer title="Energy" subtitle="Energy consumption across all greenhouse systems">
      <AIInsightPanel />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
        <ViewToggle value={view} onChange={setView} options={VIEW_OPTIONS} />

        <button
          type="button"
          onClick={() => setShowForecast((prev) => !prev)}
          className="gbtac-btn-fx"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '8px',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            backgroundColor: showForecast ? 'var(--accent-blue)' : 'var(--surface)',
            color: showForecast ? '#fff' : 'var(--text-secondary)',
            marginBottom: '16px',
          }}
        >
          <TrendingUp size={15} />
          {showForecast ? 'Hide energy forecast' : 'Show energy forecast'}
        </button>
      </div>

      {showForecast && (
        <div className="gbtac-fade-in" style={{ marginBottom: '20px' }}>
          <ForecastChart />
        </div>
      )}

      {view === 'powerbi' ? (
        <ReportCard>
          <PowerBIReport reportKey="greenhouseEnergy" />
        </ReportCard>
      ) : (
        <EnergyRechartsView />
      )}
    </PageContainer>
  );
}
