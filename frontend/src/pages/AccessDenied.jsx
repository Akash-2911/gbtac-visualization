import React, { useState } from 'react';
import { Moon, SunMedium, XCircle } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import GreenhouseScene from '../components/GreenhouseScene';
import { reapplyAccess } from '../services/adminService';

export default function AccessDenied() {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleRetry = async () => {
    try {
      await reapplyAccess();
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    }
  };

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
              backgroundColor: 'var(--status-red-bg)',
              color: 'var(--status-red-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <XCircle size={28} />
          </div>

          <h1 style={{ fontSize: '22px', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Access denied
          </h1>

          {submitted ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your request has been resubmitted. A SuperAdmin will review it again shortly.
            </p>
          ) : (
            <>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Your access request to GBTAC was not approved. If you believe this
                was a mistake, you can submit a new request.
              </p>
              {error && (
                <p style={{ fontSize: '13px', color: 'var(--status-red-text)', marginBottom: '12px' }}>
                  {error}
                </p>
              )}
              <button
                onClick={handleRetry}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-blue)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Request access again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}