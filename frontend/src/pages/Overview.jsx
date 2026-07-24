import React from 'react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';

export default function Overview() {
  return (
    <PageContainer title="Overview" subtitle="Sprung Greenhouse — Black Diamond, Alberta">
      <PowerBIReport reportKey="overview" />
    </PageContainer>
  );
}