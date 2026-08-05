import React, { useState } from 'react';
import { BarChart3, LayoutDashboard } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import ViewToggle from '../components/ViewToggle';
import EmissionsChart from '../components/charts/EmissionsChart';

const VIEW_OPTIONS = [
  { value: 'powerbi', label: 'Power BI', icon: <LayoutDashboard size={14} /> },
  { value: 'recharts', label: 'Recharts', icon: <BarChart3 size={14} /> },
];

export default function Emissions() {
  const [view, setView] = useState('powerbi');

  return (
    <PageContainer
      title="Emissions"
      subtitle="CO2 emissions from greenhouse energy consumption"
    >
      <ViewToggle value={view} onChange={setView} options={VIEW_OPTIONS} />
      {view === 'powerbi' ? (
        <ReportCard>
          <PowerBIReport reportKey="emissions" />
        </ReportCard>
      ) : (
        <EmissionsChart />
      )}
    </PageContainer>
  );
}
