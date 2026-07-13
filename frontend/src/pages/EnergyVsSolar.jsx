import React from 'react';
import PowerBIReport from '../components/PowerBIReport';

export default function EnergyVsSolar() {
  return (
    <div>
      <h1>Energy vs Solar</h1>
      <PowerBIReport reportKey="energyVsSolar" />
    </div>
  );
}