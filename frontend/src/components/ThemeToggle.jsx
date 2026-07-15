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
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '5px 10px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
      }}
    >
      {theme === 'light' ? ' Dark' : ' Light'}
    </button>
  );
}