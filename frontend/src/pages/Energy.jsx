import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, LayoutDashboard, Zap, PieChart, ChevronDown } from 'lucide-react';
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
import { ENERGY_GROUPS, groupBreakdown } from '../components/charts/energyGroups';
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
  const trend = useMemo(() => (data ? computeTrend(dailyRecords, 'totalKwh') : null), [data, dailyRecords]);
  const avgDaily = useMemo(() => computeAverage(dailyRecords, 'totalKwh'), [dailyRecords]);
  const peakDay = useMemo(() => computePeakDay(dailyRecords, 'totalKwh'), [dailyRecords]);
  const topSystem = useMemo(() => {
    if (dailyRecords.length === 0) return null;
    const totals = {};
    for (const group of ENERGY_GROUPS) totals[group.name] = 0;
    for (const r of dailyRecords) {
      const grouped = groupBreakdown(r.breakdown);
      for (const group of ENERGY_GROUPS) totals[group.name] += grouped[group.key] || 0;
    }
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    const [name, value] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    return { name, pct: grandTotal ? (value / grandTotal) * 100 : 0 };
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
      {(loading || error) && <div style={chartCardStyle}><ChartStatus loading={loading} error={error} loadingLabel="Loading energy data…" /></div>}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <StatTile label="Total Energy Used" value={data.totalKwh} unit="kWh" Icon={Zap} trend={trend} goodDirection="down" />
            <StatTile
              label="Average Daily Usage"
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
              label="Top System"
              value={topSystem ? topSystem.name : '—'}
              unit={topSystem ? `${topSystem.pct.toFixed(0)}%` : ''}
              Icon={PieChart}
              note="share of total usage"
            />
          </div>
          <EnergyChart data={dailyRecords} selectedDate={validSelectedDate} onSelectDate={toggleDate} />
          <EnergyBreakdownChart
            dailyRecords={dailyRecords}
            selectedDate={validSelectedDate}
            onSelectDate={toggleDate}
            activeCategory={activeCategory}
            onToggleCategory={toggleCategory}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <EnergyBySystemChart
              dailyRecords={dailyRecords}
              selectedDate={validSelectedDate}
              activeCategory={activeCategory}
              onToggleCategory={toggleCategory}
            />
            <CumulativeChart
              data={cumulativeInput}
              title="Cumulative Energy Consumption"
              label="Cumulative kWh"
              color="var(--accent-purple)"
              unit="kWh"
              selectedDate={validSelectedDate}
              onSelectDate={toggleDate}
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
            padding: '7px 14px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '8px',
            border: showForecast ? '1.5px solid var(--accent-blue)' : '1.5px dashed var(--accent-blue)',
            cursor: 'pointer',
            backgroundColor: showForecast ? 'var(--accent-blue)' : 'transparent',
            color: showForecast ? '#fff' : 'var(--accent-blue)',
            marginBottom: '16px',
          }}
        >
          <TrendingUp size={15} />
          {showForecast ? 'Hide energy forecast' : 'Show energy forecast'}
          <ChevronDown
            size={13}
            style={{ transition: 'transform 0.15s', transform: showForecast ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
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
