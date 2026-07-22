import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';

export default function Emissions() {
  return (
    <PageContainer
      title="Emissions"
      subtitle="CO2 emissions from greenhouse energy consumption"
    >
      <ReportCard>
        <PowerBIReport reportKey="emissions" />
      </ReportCard>
    </PageContainer>
  );
}