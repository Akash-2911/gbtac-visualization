import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Overview' },
  { path: '/weather', label: 'Weather' },
  { path: '/greenhouse-energy', label: 'Greenhouse Energy' },
  { path: '/energy-vs-solar', label: 'Energy vs Solar' },
  { path: '/energy-solar-breakdown', label: 'Energy & Solar Breakdown' },
  { path: '/solar-generation', label: 'Solar Generation' },
];

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav
        style={{
          width: '220px',
          backgroundColor: '#1a1a2e',
          color: '#fff',
          padding: '20px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>GBTAC Dashboard</h2>
          <p style={{ fontSize: '12px', color: '#aaa', margin: '4px 0 0' }}>Black Diamond Project</p>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '12px 20px',
                  color: isActive ? '#fff' : '#ccc',
                  backgroundColor: isActive ? '#16213e' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid #4A90D9' : '3px solid transparent',
                })}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main style={{ flex: 1, padding: '30px', backgroundColor: '#f7f7f8' }}>
        <Outlet />
      </main>
    </div>
  );
}