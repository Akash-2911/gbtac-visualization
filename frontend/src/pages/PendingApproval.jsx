import React from 'react';
import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import GreenhouseScene from '../components/GreenhouseScene';

export default function PendingApproval() {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme === 'light' ? '#3E86C4' : '#060D1D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GreenhouseScene />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            marginBottom: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(11,27,51,0.6)',
            color: '#fff',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          {theme === 'light' ? <Moon size={15} /> : <SunMedium size={15} />}
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>

        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            padding: 'clamp(24px, 6vw, 32px)',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-orange-bg)',
              color: 'var(--status-orange-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 20px',
            }}
          >
            ⏳
          </div>

          <h1 style={{ fontSize: '22px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Waiting for approval
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Your account has been created. A SuperAdmin needs to approve your
            access before you can use the dashboard.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 20px' }} />

          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            You'll be signed in automatically once your access is approved,
            no need to do anything else right now.
          </p>
        </div>
      </div>
    </div>
  );
}