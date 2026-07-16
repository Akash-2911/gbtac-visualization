import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import PageContainer from '../components/PageContainer';

export default function Settings() {
  const { instance } = useMsal();
  const account = instance.getActiveAccount();

  const displayName = account?.name || account?.username || 'User';
  const email = account?.username || '—';
  const tenantId = account?.tenantId || '—';

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + '/login',
    });
  };

  return (
    <PageContainer title="Settings" subtitle="Manage your account and dashboard preferences">
      {/* Account */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Account</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Name</span>
          <span style={{ fontSize: '14px' }}>{displayName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Email</span>
          <span style={{ fontSize: '14px' }}>{email}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Role</span>
          <span style={{ fontSize: '14px' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sign-in method</span>
          <span style={{ fontSize: '14px' }}>Microsoft (Entra ID)</span>
        </div>
      </div>

      {/* Organization */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Organization</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Workspace</span>
          <span style={{ fontSize: '14px' }}>GBTAC — Black Diamond Project</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Tenant ID</span>
          <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{tenantId}</span>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Notifications</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', fontSize: '14px', cursor: 'pointer' }}>
          <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
          In-app notifications
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', fontSize: '14px', cursor: 'pointer' }}>
          <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
          Email alerts for failed uploads
        </label>
      </div>

      {/* Session */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Session</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          You're signed in as <strong>{email}</strong>. Signing out will end your session on this device.
        </p>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'var(--status-red-bg)',
            color: 'var(--status-red-text)',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </PageContainer>
  );
}