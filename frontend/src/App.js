import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Energy from './pages/Energy';
import Solar from './pages/Solar';
import Weather from './pages/Weather';
import Compare from './pages/Compare';
import Emissions from './pages/Emissions';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="energy" element={<Energy />} />
          <Route path="solar" element={<Solar />} />
          <Route path="weather" element={<Weather />} />
          <Route path="compare" element={<Compare />} />
          <Route path="emissions" element={<Emissions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;