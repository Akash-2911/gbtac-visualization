import React from 'react';
import PowerBIReport from '../components/PowerBIReport';

export default function EnergySolarBreakdown() {
  return (
    <div>
      <h1>Energy & Solar Breakdown</h1>
      <PowerBIReport reportKey="energySolarBreakdown" />
    </div>
  );
}