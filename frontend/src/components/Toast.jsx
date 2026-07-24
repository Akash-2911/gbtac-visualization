import React, { useEffect } from 'react';

export default function Toast({ message, onDismiss, variant = 'success' }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 2200);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const isError = variant === 'error';

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isError ? 'var(--status-red-bg)' : 'var(--text-primary)',
          color: isError ? 'var(--status-red-text)' : 'var(--surface)',
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '0.8125rem',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 200,
          animation: 'gbtac-toast-in 0.22s ease-out',
        }}
      >
        {message}
      </div>
      <style>{`
        @keyframes gbtac-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}