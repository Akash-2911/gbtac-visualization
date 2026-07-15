import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Sun,
  Cloud,
  CloudRain,
  GitCompare,
  Sparkles,
  ShieldCheck,
  Settings as SettingsIcon,
} from 'lucide-react';
import TopBar from './TopBar';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/energy', label: 'Energy', icon: Zap },
  { path: '/solar', label: 'Solar', icon: Sun },
  { path: '/emissions', label: 'Emissions', icon: Cloud },
  { path: '/weather', label: 'Weather', icon: CloudRain },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, beta: true },
];

const bottomItems = [
  { path: '/admin', label: 'Admin', icon: ShieldCheck },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentLabel =
    [...navItems, ...bottomItems].find((item) =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    )?.label || 'Overview';

  const closeMenu = () => setMenuOpen(false);

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <button
        type="button"
        className="gbtac-hamburger"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && <div className="gbtac-backdrop" onClick={closeMenu} aria-hidden="true" />}

      <nav
        aria-label="Main navigation"
        className={`gbtac-sidebar ${menuOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--sidebar-bg)',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 30,
        }}
      >
        <div>
          <div style={{ padding: '0 20px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', color: '#fff' }}>GBTAC</h2>
            <p style={{ fontSize: '12px', color: '#8FA0BD', margin: '2px 0 0' }}>Energy Systems</p>
          </div>

          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#5F7290',
              letterSpacing: '0.08em',
              padding: '0 20px',
              margin: '0 0 6px',
            }}
          >
            DASHBOARDS
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={closeMenu}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 20px',
                      color: isActive ? '#fff' : 'var(--sidebar-text)',
                      backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                    })}
                  >
                    <Icon size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.beta && (
                      <span style={{ fontSize: '10px', background: '#7C3AED', color: '#fff', padding: '1px 6px', borderRadius: '999px' }}>
                        BETA
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#5F7290',
              letterSpacing: '0.08em',
              padding: '10px 20px 6px',
              margin: 0,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            MANAGEMENT
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeMenu}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 20px',
                      color: isActive ? '#fff' : 'var(--sidebar-text)',
                      textDecoration: 'none',
                      fontSize: '13px',
                    })}
                  >
                    <Icon size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="gbtac-topbar-wrap" style={{ position: 'fixed', top: 0, left: 'var(--sidebar-width)', right: 0, height: 'var(--topbar-height)', zIndex: 10 }}>
        <TopBar pageTitle={currentLabel} />
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="gbtac-main"
        style={{
          position: 'absolute',
          top: 'var(--topbar-height)',
          left: 'var(--sidebar-width)',
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </main>

      <style>{`
        .skip-link {
          position: absolute;
          top: -100px;
          left: 8px;
          background: var(--accent-blue);
          color: #fff;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          z-index: 100;
          transition: top 0.15s;
        }
        .skip-link:focus { top: 8px; }
        .gbtac-hamburger { display: none; }
        .gbtac-backdrop { display: none; }
        a:focus-visible, button:focus-visible, [tabindex]:focus-visible {
          outline: 2px solid var(--accent-blue);
          outline-offset: 2px;
        }

        @media (max-width: 820px) {
          .gbtac-hamburger {
            display: flex; align-items: center; justify-content: center;
            position: fixed; top: 14px; left: 14px; width: 36px; height: 36px;
            border-radius: 8px; border: 1px solid var(--border);
            background: var(--surface); color: var(--text-primary);
            font-size: 16px; cursor: pointer; z-index: 40;
          }
          .gbtac-sidebar {
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            width: 240px !important;
          }
          .gbtac-sidebar.open { transform: translateX(0); }
          .gbtac-backdrop.open, .gbtac-backdrop { display: block; }
          .gbtac-topbar-wrap, .gbtac-main { left: 0 !important; }
          .gbtac-main { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
}