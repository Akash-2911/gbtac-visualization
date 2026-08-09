import React, { useState, useMemo } from 'react';
import { BarChart3, LayoutDashboard, Zap, Sun, Battery } from 'lucide-react';
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
import StatTile from '../components/charts/shared/StatTile';
import Meter from '../components/charts/shared/Meter';
import {
  useChartData,
  ChartStatus,
  shortDate,
  chartCardStyle,
  computeTrend,
  useDateSelection,
  useValidSelectedDate,
  SelectedDateChip,
  useCategorySelection,
} from '../components/charts/chartUtils';
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

  const energyTrend = useMemo(() => (data ? computeTrend(greenhouseRecords, 'totalKwh') : null), [data, greenhouseRecords]);
  const solarTrend = useMemo(() => (data ? computeTrend(solarRecords, 'totalKwh') : null), [data, solarRecords]);
  const selfSufficiencyPct = useMemo(() => {
    if (!data || !data.greenhouse.totalKwh) return null;
    return (data.solar.totalKwh / data.greenhouse.totalKwh) * 100;
  }, [data]);
  const netEnergy = useMemo(
    () => (data ? data.solar.totalKwh - data.greenhouse.totalKwh : null),
    [data]
  );
  const netTrend = useMemo(() => computeTrend(cumulativeNetInput, 'value'), [cumulativeNetInput]);

  const { selectedDate, toggleDate, clearDate } = useDateSelection();
  const validSelectedDate = useValidSelectedDate(selectedDate, energyVsSolar);
  const { activeCategory, toggleCategory } = useCategorySelection();

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '10px' }}>
        <DateRangeFilter range={range} onChange={setRange} />
        <SelectedDateChip date={validSelectedDate} onClear={clearDate} />
      </div>
      {(loading || error) && (
        <div style={chartCardStyle}>
          <ChartStatus loading={loading} error={error} loadingLabel="Loading comparison data…" />
        </div>
      )}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <StatTile label="Total Energy Consumed" value={data.greenhouse.totalKwh} unit="kWh" Icon={Zap} trend={energyTrend} goodDirection="down" />
          <StatTile label="Total Solar Generated" value={data.solar.totalKwh} unit="kWh" Icon={Sun} trend={solarTrend} goodDirection="up" />
          <StatTile label="Net Energy" value={netEnergy ?? 0} unit="kWh" Icon={Battery} trend={netTrend} goodDirection="up" />
        </div>
      )}
      {!loading && !error && data && selfSufficiencyPct !== null && (
        <div style={{ marginBottom: '16px' }}>
          <Meter title="Solar Self-Sufficiency (selected range)" pct={selfSufficiencyPct} caption="Target: 100% (net-zero) — solar generated ÷ energy consumed" />
        </div>
      )}
      {!loading && !error && data && activeView === 'energyVsSolar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CompareChart data={energyVsSolar} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <CompareNetEnergyChart data={energyVsSolar} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <CumulativeChart
              data={cumulativeNetInput}
              title="Cumulative Net Energy"
              label="Cumulative Net"
              color="var(--accent-purple)"
              unit="kWh"
              showZeroLine
              selectedDate={validSelectedDate}
              onSelectDate={toggleDate}
            />
            <CompareSelfSufficiencyChart data={energyVsSolar} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          </div>
        </div>
      )}
      {!loading && !error && data && activeView === 'energySolarBreakdown' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <EnergyBreakdownChart
            dailyRecords={greenhouseRecords}
            selectedDate={validSelectedDate}
            onSelectDate={toggleDate}
            activeCategory={activeCategory}
            onToggleCategory={toggleCategory}
          />
          <SolarChart
            data={solarRecords}
            selectedDate={validSelectedDate}
            onSelectDate={toggleDate}
            activeCategory={activeCategory}
            onToggleCategory={toggleCategory}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <EnergyBySystemChart
              dailyRecords={greenhouseRecords}
              selectedDate={validSelectedDate}
              activeCategory={activeCategory}
              onToggleCategory={toggleCategory}
            />
            <SolarCollectorTotalsChart
              data={solarRecords}
              selectedDate={validSelectedDate}
              activeCategory={activeCategory}
              onToggleCategory={toggleCategory}
            />
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
