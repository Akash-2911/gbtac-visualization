import React from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function TopBar({ pageTitle }) {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const account = instance.getActiveAccount();

  const displayName = account?.name || account?.username || 'User';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + '/login',
    });
  };

  return (
    <header
      className="gbtac-topbar"
      style={{
        height: '100%',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'relative',
      }}
    >
      <span
        className="tb-left-label"
        style={{
          fontSize: '17px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        GBTAC
      </span>

      <span
        className="tb-title"
        style={{
          fontWeight: 700,
          fontSize: '17px',
          color: 'var(--text-primary)',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        GBTAC {pageTitle} Dashboard
      </span>

      <div className="tb-right" style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
        <div
          onClick={() => navigate('/settings')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate('/settings');
          }}
          role="button"
          tabIndex={0}
          aria-label={`View settings for ${displayName}`}
          className="tb-profile"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: '#DBEAFE',
              color: 'var(--accent-blue)',
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
          <span className="tb-name" style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
          <span
            className="tb-badge"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--accent-blue)',
              backgroundColor: '#EFF6FF',
              padding: '3px 9px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            ADMIN
          </span>
        </div>

        <span className="tb-divider" style={{ color: 'var(--border)', fontSize: '14px' }}>|</span>

        <ThemeToggle />

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          style={{
            fontSize: '14px',
            color: 'var(--status-red-text)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            padding: '6px 4px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span aria-hidden="true">↪</span>
          <span className="tb-logout-label">Logout</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .gbtac-topbar {
            padding-left: 64px !important;
            padding-right: 14px !important;
          }
          .tb-left-label {
            display: none;
          }
          .tb-title {
            position: static !important;
            transform: none !important;
            left: auto !important;
            top: auto !important;
            flex: 1;
            min-width: 0;
            text-align: left !important;
            font-size: 14px !important;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .tb-right {
            gap: 10px !important;
          }
        }

        @media (max-width: 560px) {
          .tb-name, .tb-badge, .tb-divider {
            display: none;
          }
          .tb-logout-label {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}