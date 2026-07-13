import React from 'react';
import PowerBIReport from '../components/PowerBIReport';

export default function Overview() {
  return (
    <div>
      <h1>Overview</h1>
      <PowerBIReport reportKey="overview" />
    </div>
  );
}