import React from 'react';
import { useMsal } from '@azure/msal-react';
import { Navigate } from 'react-router-dom';
import { loginRequest } from '../auth/authConfig';
import { msalInstance } from '../auth/msalInstance';

export default function Login() {
  const { instance } = useMsal();
  const isAuthenticated = msalInstance.getAllAccounts().length > 0;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleMicrosoftLogin = () => {
    sessionStorage.clear(); // clear any stuck "interaction in progress" state first
    instance.loginRedirect(loginRequest);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--sidebar-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '48px',
          width: '440px',
          textAlign: 'center',
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
            marginBottom: '12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            backgroundColor: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Sign in with Microsoft
        </button>

        <button
          disabled
          title="Not available — this app uses Microsoft Entra ID only"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '20px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            backgroundColor: '#f5f5f5',
            fontSize: '14px',
            color: 'var(--text-muted)',
            cursor: 'not-allowed',
          }}
        >
          Sign in with Google
        </button>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '20px' }}>
          For GBTAC staff and authorized users only
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 16px' }} />
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          By signing in you agree to SAIT's acceptable use policy.
        </p>
      </div>
    </div>
  );
}