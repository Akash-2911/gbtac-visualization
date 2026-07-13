import React from 'react';
import PowerBIReport from '../components/PowerBIReport';

export default function GreenhouseEnergy() {
  return (
    <div>
      <h1>Greenhouse Energy</h1>
      <PowerBIReport reportKey="greenhouseEnergy" />
    </div>
  );
}