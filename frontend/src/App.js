import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProtectedRoute from './auth/ProtectedRoute';
import Overview from './pages/Overview';
import Energy from './pages/Energy';
import Solar from './pages/Solar';
import Weather from './pages/Weather';
import Compare from './pages/Compare';
import Emissions from './pages/Emissions';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import DataEntry from './pages/DataEntry';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="energy" element={<Energy />} />
          <Route path="solar" element={<Solar />} />
          <Route path="weather" element={<Weather />} />
          <Route path="compare" element={<Compare />} />
          <Route path="emissions" element={<Emissions />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin/data-entry" element={<DataEntry />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;