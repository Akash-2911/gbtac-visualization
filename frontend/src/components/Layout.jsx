import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';

const navItems = [
  { path: '/', label: 'Overview' },
  { path: '/energy', label: 'Energy' },
  { path: '/solar', label: 'Solar' },
  { path: '/emissions', label: 'Emissions' },
  { path: '/weather', label: 'Weather' },
  { path: '/compare', label: 'Compare' },
  { path: '/ai-assistant', label: 'AI Assistant', beta: true },
];

const bottomItems = [
  { path: '/admin', label: 'Admin' },
  { path: '/settings', label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const currentLabel =
    [...navItems, ...bottomItems].find((item) =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    )?.label || 'Overview';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        style={{
          width: '220px',
          backgroundColor: 'var(--sidebar-bg)',
          padding: '20px 0',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ padding: '0 20px', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', color: '#fff' }}>GBTAC</h2>
            <p style={{ fontSize: '12px', color: '#8FA0BD', margin: '2px 0 0' }}>Energy Systems</p>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 20px',
                    color: isActive ? '#fff' : '#B7C3D9',
                    backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                  })}
                >
                  {item.label}
                  {item.beta && (
                    <span
                      style={{
                        fontSize: '10px',
                        backgroundColor: 'var(--accent-purple)',
                        color: '#fff',
                        padding: '1px 6px',
                        borderRadius: '999px',
                      }}
                    >
                      BETA
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
          {bottomItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '10px 20px',
                  color: isActive ? '#fff' : '#8FA0BD',
                  textDecoration: 'none',
                  fontSize: '13px',
                })}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar pageTitle={currentLabel} />
        <main style={{ flex: 1, padding: '28px 32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}