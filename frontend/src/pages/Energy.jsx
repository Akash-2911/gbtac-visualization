import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';

export default function Energy() {
  return (
    <PageContainer title="Energy" subtitle="Energy consumption across all greenhouse systems">
      <ReportCard>
        <PowerBIReport reportKey="greenhouseEnergy" />
      </ReportCard>
    </PageContainer>
  );
}