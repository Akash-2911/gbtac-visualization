import React, { useState } from 'react';
import { useUser } from '../auth/UserContext';
import { useMsal } from '@azure/msal-react';
import PageContainer from '../components/PageContainer';
import Toggle from '../components/Toggle';
import Toast from '../components/Toast';

const FONT_SCALES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export default function Settings() {
  const { instance } = useMsal();
  const account = instance.getActiveAccount();

  const displayName = account?.name || account?.username || 'User';
  const email = account?.username || '—';

// Real role read from the database via /me (shared UserContext), not
  // the JWT token, since SuperAdmin approval only updates the database.
  const { user } = useUser();
  const role = user?.role || 'Viewer';

  // Accessibility state — moved here from Admin.jsx, since individual
  // accessibility preferences are personal, not org-wide.
  const [highContrast, setHighContrast] = useState(
    () => document.documentElement.getAttribute('data-contrast') === 'high'
  );
  const [fontScale, setFontScale] = useState(
    () => document.documentElement.getAttribute('data-font-scale') || 'medium'
  );

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (message) => setToastMessage(message);

  const toggleContrast = (checked) => {
    setHighContrast(checked);
    document.documentElement.setAttribute('data-contrast', checked ? 'high' : 'normal');
    showToast(checked ? 'High contrast enabled' : 'High contrast disabled');
  };

  const changeFontScale = (value) => {
    setFontScale(value);
    document.documentElement.setAttribute('data-font-scale', value);
    showToast(`Text size set to ${value}`);
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
  };

  const cardStyle = {
    backgroundColor: 'var(--surface)',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '20px',
  };

  return (
    <PageContainer title="Settings" subtitle="Manage your account and dashboard preferences">
      {/* Profile — read-only, SSO-managed identity info */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: '16px' }}>Profile</h3>
        <div style={rowStyle}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Name</span>
          <span style={{ fontSize: '0.875rem' }}>{displayName}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email</span>
          <span style={{ fontSize: '0.875rem' }}>{email}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Role</span>
          <span style={{ fontSize: '0.875rem' }}>{role}</span>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sign-in method</span>
          <span style={{ fontSize: '0.875rem' }}>Microsoft (Entra ID)</span>
        </div>
      </div>

      {/* Appearance section removed per instruction — dark mode toggle lives
          in the sidebar (Layout.jsx) instead. */}

      {/* Accessibility — moved from Admin.jsx per the settings/admin research
          pass: individual accessibility preferences belong in personal
          settings, not org-level admin, since needs are per-user. */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>Accessibility</h3>
        <Toggle checked={highContrast} onChange={toggleContrast} label="High contrast mode" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <span style={{ fontSize: '0.875rem' }}>Text size</span>
          {/* Segmented control instead of a dropdown or slider — a slider
              implies a continuous range, but there are only 3 fixed options,
              so a 3-way toggle communicates the actual choice more honestly. */}
          <div
            role="radiogroup"
            aria-label="Text size"
            style={{
              display: 'flex',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {FONT_SCALES.map(({ value, label }) => {
              const active = fontScale === value;
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => changeFontScale(value)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 600 : 400,
                    background: active ? 'var(--accent-blue)' : 'none',
                    color: active ? '#fff' : 'var(--text-primary)',
                    border: 'none',
                    borderRight: value !== 'large' ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </PageContainer>
  );
}