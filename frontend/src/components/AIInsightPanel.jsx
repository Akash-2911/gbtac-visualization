import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useUser } from '../auth/UserContext';
import { fetchAiSummary } from '../services/aiService';
import { highlightMetrics } from './highlightMetrics';
import { ROLES } from '../constants/roles';

// Matches /ai/summary's own checkAuth gate exactly — Viewers never see the
// button at all rather than clicking it and getting a 403.
const AI_INSIGHT_ROLES = [ROLES.STAFF, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GUEST]; // GUEST MODE

// Click-to-reveal AI Insight — used on all 6 dashboard pages. Doesn't fetch
// on mount (that was Compare.jsx's original behavior, always burning an AI
// call + rate-limit budget whether or not anyone looked at it); only fetches
// the first time it's opened, then caches the result for the rest of the
// page's lifetime so re-toggling doesn't refetch.
export default function AIInsightPanel() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  if (!user || !AI_INSIGHT_ROLES.includes(user.role)) return null;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !fetched) {
      setLoading(true);
      setError(null);
      fetchAiSummary()
        .then((data) => {
          setInsight(data.insight);
          setFetched(true);
        })
        .catch((e) => setError(e))
        .finally(() => setLoading(false));
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        type="button"
        onClick={handleToggle}
        className="gbtac-btn-fx"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '8px 16px 8px 12px',
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: '20px',
          border: open ? '1px solid transparent' : '1px solid var(--border)',
          cursor: 'pointer',
          backgroundColor: open ? undefined : 'var(--surface)',
          backgroundImage: open ? 'linear-gradient(135deg, #9333EA, #C026D3)' : 'none',
          color: open ? '#fff' : 'var(--text-secondary)',
          boxShadow: open ? '0 2px 10px rgba(147,51,234,0.35)' : 'none',
        }}
      >
        <span
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundColor: open ? 'rgba(255,255,255,0.2)' : 'rgba(147,51,234,0.14)',
            color: open ? '#fff' : 'var(--ai-accent)',
          }}
        >
          <Sparkles size={12} />
        </span>
        {open ? 'Hide AI Insight' : 'Show AI Insight'}
      </button>

      {open && (
        <div
          className="gbtac-fade-in"
          style={{
            backgroundColor: 'var(--ai-accent)',
            color: '#fff',
            borderRadius: '10px',
            padding: '18px 20px',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', opacity: 0.85 }}>
              AI INSIGHT
            </p>
            {loading && (
              <div
                style={{
                  height: '18px',
                  width: '80%',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.3)',
                }}
              />
            )}
            {!loading && error && (
              <p style={{ margin: 0, fontSize: '13px' }}>
                {error.status === 403
                  ? "You don't have permission to view AI insights."
                  : error.status === 429
                  ? 'Please wait a moment — too many requests.'
                  : `Couldn't load AI insight: ${error.message}`}
              </p>
            )}
            {!loading && !error && insight && (
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
                {highlightMetrics(insight, { positive: '#86EFAC', negative: '#FCA5A5' })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
