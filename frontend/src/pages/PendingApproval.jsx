import React from 'react';

export default function PendingApproval() {
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
  );
}