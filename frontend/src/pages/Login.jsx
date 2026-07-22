import React from 'react';
import { useMsal } from '@azure/msal-react';
import { Navigate } from 'react-router-dom';
import { Moon, SunMedium } from 'lucide-react';
import { loginRequest } from '../auth/authConfig';
import { msalInstance } from '../auth/msalInstance';
import { useTheme } from '../components/ThemeContext';
import GreenhouseScene from '../components/GreenhouseScene';

export default function Login() {
  const { instance } = useMsal();
  const isAuthenticated = msalInstance.getAllAccounts().length > 0;
  const { theme, setTheme } = useTheme();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleMicrosoftLogin = () => {
    sessionStorage.clear();
    instance.loginRedirect(loginRequest);
  };

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
            padding: 'clamp(28px, 6vw, 48px)',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}
        >
          <h2 style={{ fontSize: '17px', letterSpacing: '0.03em', marginBottom: '20px' }}>
            SOUTHERN ALBERTA INSTITUTE OF TECHNOLOGY
          </h2>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 24px' }} />
          <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>GBTAC</h1>

          <button
            onClick={handleMicrosoftLogin}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-blue)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign in with Microsoft
          </button>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '20px' }}>
            For GBTAC staff and authorized users only
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 16px' }} />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            By signing in you agree to GBTAC's acceptable use policy.
          </p>
        </div>
      </div>
    </div>
  );
}