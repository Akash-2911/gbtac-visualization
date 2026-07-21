import React from 'react';

export default function PendingApproval() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg)',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '32px',
        }}
      >
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.25rem' }}>
          Waiting for approval
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
          Your account has been created. A SuperAdmin needs to approve your access
          before you can use the dashboard. You'll be able to sign in normally once
          that's done.
        </p>
      </div>
    </div>
  );
}