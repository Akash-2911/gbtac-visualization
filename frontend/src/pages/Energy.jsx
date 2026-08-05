import React, { useState } from 'react';
import { TrendingUp, BarChart3, LayoutDashboard } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ForecastChart from '../components/ForecastChart';
import ViewToggle from '../components/ViewToggle';
import EnergyChart from '../components/charts/EnergyChart';

const VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

export default function Energy() {
  const [showForecast, setShowForecast] = useState(false);
  const [view, setView] = useState('powerbi');

  return (
    <PageContainer title="Energy" subtitle="Energy consumption across all greenhouse systems">
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
        <EnergyChart />
      )}
    </PageContainer>
  );
}
