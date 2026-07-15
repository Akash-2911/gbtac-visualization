import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';

export default function Solar() {
  return (
    <PageContainer title="Solar" subtitle="Real-time solar collection and power output data">
      <ReportCard>
        <PowerBIReport reportKey="solarGeneration" />
      </ReportCard>
    </PageContainer>
  );
}