import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ViewToggle from '../components/ViewToggle';
import AIInsightPanel from '../components/AIInsightPanel';
import DateRangeFilter from '../components/charts/DateRangeFilter';
import CompareChart from '../components/charts/CompareChart';
import CompareNetEnergyChart from '../components/charts/CompareNetEnergyChart';
import CompareSelfSufficiencyChart from '../components/charts/CompareSelfSufficiencyChart';
import EnergyBreakdownChart from '../components/charts/EnergyBreakdownChart';
import EnergyBySystemChart from '../components/charts/EnergyBySystemChart';
import SolarChart from '../components/charts/SolarChart';
import SolarCollectorTotalsChart from '../components/charts/SolarCollectorTotalsChart';
import CumulativeChart from '../components/charts/shared/CumulativeChart';
import { useChartData, ChartStatus, shortDate, chartCardStyle } from '../components/charts/chartUtils';
import { fetchCompareData } from '../services/dataService';

const views = [
  { key: 'energyVsSolar', label: 'Energy vs Solar' },
  { key: 'energySolarBreakdown', label: 'Energy & Solar Breakdown' },
];

const CHART_VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

function CompareRechartsView({ activeView }) {
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const { data, error, loading } = useChartData(() => fetchCompareData(range), [range.from, range.to]);

  const energyVsSolar = useMemo(() => {
    if (!data) return [];
    return data.energyVsSolar.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const greenhouseRecords = useMemo(() => {
    if (!data) return [];
    return data.greenhouse.dailyRecords.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const solarRecords = useMemo(() => {
    if (!data) return [];
    return data.solar.dailyRecords.map((r) => ({ ...r, date: shortDate(r.date) }));
  }, [data]);

  const cumulativeNetInput = useMemo(
    () => energyVsSolar.map((r) => ({ date: r.date, value: r.solarKwh - r.energyKwh })),
    [energyVsSolar]
  );

  return (
    <div>
      <DateRangeFilter range={range} onChange={setRange} />
      {(loading || error) && (
        <div style={chartCardStyle}>
          <ChartStatus loading={loading} error={error} loadingLabel="Loading comparison data…" />
        </div>
      )}
      {!loading && !error && data && activeView === 'energyVsSolar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CompareChart data={energyVsSolar} totalEnergyKwh={data.greenhouse.totalKwh} totalSolarKwh={data.solar.totalKwh} />
          <CompareNetEnergyChart data={energyVsSolar} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <CumulativeChart
              data={cumulativeNetInput}
              title="Cumulative Net Energy"
              label="Cumulative Net"
              color="var(--accent-purple)"
              unit="kWh"
              showZeroLine
            />
            <CompareSelfSufficiencyChart data={energyVsSolar} />
          </div>
        </div>
      )}
      {!loading && !error && data && activeView === 'energySolarBreakdown' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <EnergyBreakdownChart dailyRecords={greenhouseRecords} />
          <SolarChart data={solarRecords} totalKwh={data.solar.totalKwh} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <EnergyBySystemChart dailyRecords={greenhouseRecords} />
            <SolarCollectorTotalsChart data={solarRecords} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const [activeView, setActiveView] = useState('energyVsSolar');
  const [chartView, setChartView] = useState('powerbi');

  return (
    <PageContainer title="Compare" subtitle="Energy consumed vs energy generated">
      <AIInsightPanel />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <ViewToggle value={chartView} onChange={setChartView} options={CHART_VIEW_OPTIONS} />

        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg)',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '16px',
          }}
        >
          {views.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView === view.key ? 'var(--accent-blue)' : 'transparent',
                color: activeView === view.key ? '#fff' : 'var(--text-secondary)',
                transition: 'background-color 0.15s',
              }}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {chartView === 'powerbi' ? (
        <ReportCard>
          <PowerBIReport reportKey={activeView} />
        </ReportCard>
      ) : (
        <CompareRechartsView activeView={activeView} />
      )}
    </PageContainer>
  );
}
