import React from 'react';
import PowerBIReport from '../components/PowerBIReport';

export default function SolarGeneration() {
  return (
    <div>
      <h1>Solar Generation</h1>
      <PowerBIReport reportKey="solarGeneration" />
    </div>
  );
}