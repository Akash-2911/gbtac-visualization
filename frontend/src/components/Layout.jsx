import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import {
  LayoutGrid,
  Zap,
  Sun,
  Leaf,
  CloudRain,
  ArrowLeftRight,
  Sparkles,
  ShieldCheck,
  Settings as SettingsIcon,
  Moon,
  SunMedium,
  LogOut,
} from 'lucide-react';

const navGroups = [
  {
    label: 'DASHBOARDS',
    items: [
      { path: '/', label: 'Overview', icon: LayoutGrid, end: true },
      { path: '/energy', label: 'Energy', icon: Zap },
      { path: '/solar', label: 'Solar', icon: Sun },
      { path: '/emissions', label: 'Emissions', icon: Leaf },
      { path: '/weather', label: 'Weather', icon: CloudRain },
      { path: '/compare', label: 'Compare', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'ADVANCED',
    items: [{ path: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, beta: true }],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { path: '/admin', label: 'Admin', icon: ShieldCheck },
      { path: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

export default function Layout() {
  const location = useLocation();
  const { instance } = useMsal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  const account = instance.getActiveAccount();
  const displayName = account?.name || account?.username || 'User';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  // NOTE: hardcoded for now — item #4 on the feedback list (role should come
  // from the database / JWT claim instead of being assumed here). Flagging so
  // this line gets swapped out once that's wired up with Aryan's users table.
  const role = 'Admin';

  const closeMenu = () => setMenuOpen(false);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + '/login',
    });
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

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
          zIndex: 30,
        }}
      >
        {/* Header row + in-panel close button (mobile only) */}
        <div
          style={{
            padding: '0 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
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
              display: 'none',
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

        {/* Scrollable nav groups */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '18px' }}>
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
                {group.label}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.end}
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
                        <Icon size={17} strokeWidth={2} style={{ flexShrink: 0 }} />
                        <span>{item.label}</span>
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
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section: Dark mode toggle -> profile card -> Sign out */}
        <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              color: 'var(--sidebar-text)',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {theme === 'light' ? <Moon size={17} /> : <SunMedium size={17} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#6D2077',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </p>
              <p style={{ fontSize: '11px', color: '#8FA0BD', margin: 0 }}>{role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              color: 'var(--status-red-text)',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Header bar removed entirely (feedback item #5) — each page renders
          its own title via PageContainer, so there's no more duplicate
          "Overview" showing twice on the same screen. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="gbtac-main"
        style={{
          position: 'absolute',
          top: 0,
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
          .gbtac-main {
            left: 0 !important;
            top: env(safe-area-inset-top) !important;
            padding: 64px 16px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}