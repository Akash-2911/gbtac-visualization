import React, { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('gbtac-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gbtac-theme', theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setTheme(theme === 'light' ? 'dark' : 'light');
      }}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '5px 10px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
      <span className="tt-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  );
}