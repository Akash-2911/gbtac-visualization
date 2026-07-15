import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';

export default function Weather() {
  return (
    <PageContainer title="Weather" subtitle="Black Diamond weather station vs greenhouse performance">
      <ReportCard>
        <PowerBIReport reportKey="weather" />
      </ReportCard>
    </PageContainer>
  );
}