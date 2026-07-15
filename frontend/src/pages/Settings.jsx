import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import PageContainer from '../components/PageContainer';

export default function Settings() {
  const { instance } = useMsal();
  const account = instance.getActiveAccount();
  const displayName = account?.name || account?.username || 'User';

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  return (
    <PageContainer title="Settings" subtitle="Manage your account and dashboard preferences">
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Account</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Name</span>
          <span style={{ fontSize: '14px' }}>{displayName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Role</span>
          <span style={{ fontSize: '14px' }}>Admin</span>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '24px' }}>
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
    </PageContainer>
  );
}