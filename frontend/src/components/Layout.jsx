import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
// NOTE: re-add your Lucide icon imports and the `icon` field per nav item
// if your current file has them.

const navItems = [
  { path: '/', label: 'Overview' },
  { path: '/energy', label: 'Energy' },
  { path: '/solar', label: 'Solar' },
  { path: '/emissions', label: 'Emissions' },
  { path: '/weather', label: 'Weather' },
  { path: '/compare', label: 'Compare' },
  { path: '/ai-assistant', label: 'AI Assistant', beta: true },
];

// FIX: Admin was accidentally dropped in the previous version I gave you —
// restored here under MANAGEMENT, above Settings, matching your original.
const bottomItems = [
  { path: '/admin', label: 'Admin' },
  { path: '/settings', label: 'Settings' },
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

      {/* Hidden while the sidebar is open — the sidebar has its own in-panel
          close button, so nothing overlaps the "GBTAC / Energy Systems" header. */}
      {!menuOpen && (
        <button
          type="button"
          className="gbtac-hamburger"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
      )}

      {menuOpen && <div className="gbtac-backdrop open" onClick={closeMenu} aria-hidden="true" />}

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
          <div
            style={{
              padding: '0 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', color: '#fff', margin: 0 }}>GBTAC</h2>
              <p style={{ fontSize: '12px', color: '#8FA0BD', margin: '2px 0 0' }}>Energy Systems</p>
            </div>
            <button
              type="button"
              className="gbtac-inpanel-close"
              aria-label="Close navigation menu"
              onClick={closeMenu}
              style={{
                display: 'none', // shown on mobile via <style> below
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '18px',
                lineHeight: 1,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              ✕
            </button>
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
            {navItems.map((item) => (
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
                  {item.label}
                  {item.beta && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        fontWeight: 700,
                        background: 'var(--accent-purple)',
                        color: '#fff',
                        padding: '1px 6px',
                        borderRadius: '10px',
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

        <div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 20px' }} />
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
            MANAGEMENT
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {bottomItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
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
                  })}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div
        className="gbtac-topbar-wrap"
        style={{
          position: 'fixed',
          top: 0,
          left: 'var(--sidebar-width)',
          right: 0,
          height: 'var(--topbar-height)',
          zIndex: 10,
        }}
      >
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
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: calc(14px + env(safe-area-inset-top));
            left: 14px;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text-primary);
            font-size: 16px;
            cursor: pointer;
            z-index: 40;
          }
          .gbtac-inpanel-close {
            display: flex !important;
          }
          .gbtac-sidebar {
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            width: 240px !important;
            padding-top: calc(20px + env(safe-area-inset-top)) !important;
          }
          .gbtac-sidebar.open {
            transform: translateX(0);
          }
          .gbtac-backdrop.open {
            display: block;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            z-index: 20;
          }
          .gbtac-topbar-wrap, .gbtac-main {
            left: 0 !important;
          }
          .gbtac-topbar-wrap {
            padding-top: env(safe-area-inset-top);
            height: calc(var(--topbar-height) + env(safe-area-inset-top)) !important;
          }
          .gbtac-main {
            top: calc(var(--topbar-height) + env(safe-area-inset-top)) !important;
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}