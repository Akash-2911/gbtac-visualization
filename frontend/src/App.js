import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Weather from './pages/Weather';
import GreenhouseEnergy from './pages/GreenhouseEnergy';
import EnergyVsSolar from './pages/EnergyVsSolar';
import EnergySolarBreakdown from './pages/EnergySolarBreakdown';
import SolarGeneration from './pages/SolarGeneration';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="weather" element={<Weather />} />
          <Route path="greenhouse-energy" element={<GreenhouseEnergy />} />
          <Route path="energy-vs-solar" element={<EnergyVsSolar />} />
          <Route path="energy-solar-breakdown" element={<EnergySolarBreakdown />} />
          <Route path="solar-generation" element={<SolarGeneration />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;