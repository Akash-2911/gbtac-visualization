import React from 'react';
import PowerBIReport from './components/PowerBIReport';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>GBTAC Energy Dashboard — Embed Test</h1>
      <p>Testing the Power BI embed component (GTAC-35).</p>
      <PowerBIReport reportKey="overview" />
    </div>
  );
}

export default App;