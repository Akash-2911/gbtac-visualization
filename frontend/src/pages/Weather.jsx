import React from 'react';
import PowerBIReport from '../components/PowerBIReport';

export default function Weather() {
  return (
    <div>
      <h1>Weather</h1>
      <PowerBIReport reportKey="weather" />
    </div>
  );
}