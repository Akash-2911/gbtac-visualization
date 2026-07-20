import React, { useEffect } from 'react';

export default function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 2200);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--text-primary)',
        color: 'var(--surface)',
        padding: '10px 18px',
        borderRadius: '8px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 200,
      }}
    >
      {message}
    </div>
  );
}