import React, { useState } from 'react';
import { BarChart3, LayoutDashboard } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ViewToggle from '../components/ViewToggle';
import WeatherChart from '../components/charts/WeatherChart';

const VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

export default function Weather() {
  const [view, setView] = useState('powerbi');

  return (
    <PageContainer title="Weather" subtitle="Black Diamond weather station vs greenhouse performance">
      <ViewToggle value={view} onChange={setView} options={VIEW_OPTIONS} />
      {view === 'powerbi' ? (
        <ReportCard>
          <PowerBIReport reportKey="weather" />
        </ReportCard>
      ) : (
        <WeatherChart />
      )}
    </PageContainer>
  );
}
