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
        // FIX: was display:flex + justify-content:space-between with the title
        // as a SEPARATE absolutely-positioned span (left:50%, translate -50%).
        // That had zero awareness of how wide the right-side profile block was,
        // so on an iPad-width viewport the centered title's own width pushed
        // straight into "Akash Patel ADMIN" — that's the exact overlap in image 3.
        // A 3-column grid (auto | 1fr | auto) centers the title the same way
        // visually, but the middle column SHRINKS + ellipsizes instead of
        // overlapping when space runs out.
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        columnGap: '16px',
        padding: '0 28px',
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
          textAlign: 'center',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        GBTAC {pageTitle} Dashboard
      </span>

      <div className="tb-right" style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
        <div
          onClick={() => navigate('/admin')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate('/admin');
          }}
          role="button"
          tabIndex={0}
          aria-label={`View admin panel for ${displayName}`}
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
            /* clears the fixed mobile hamburger from Layout.jsx and the
               iPad/iPhone floating toolbar, so nothing sits on top of this bar */
            padding-top: env(safe-area-inset-top);
          }
          .tb-left-label {
            display: none;
          }
          .tb-title {
            text-align: left !important;
            font-size: 14px !important;
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