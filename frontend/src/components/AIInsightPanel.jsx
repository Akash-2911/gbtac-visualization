import React, { useState } from 'react';
import { Sparkles, Zap, Sun, Cloud, Thermometer, Droplet, ArrowUp, ArrowDown } from 'lucide-react';
import { useUser } from '../auth/UserContext';
import { fetchAiSummary } from '../services/aiService';
import { highlightMetrics } from './highlightMetrics';
import { ROLES } from '../constants/roles';

// Matches /ai/summary's own checkAuth gate exactly — Viewers never see the
// button at all rather than clicking it and getting a 403.
const AI_INSIGHT_ROLES = [ROLES.STAFF, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GUEST]; // GUEST MODE

// Maps the icon key the backend picks per domain (aiSummary.js's
// SINGLE_METRIC_DOMAINS) to an actual component — keeps icon choice
// server-driven per domain while this component stays domain-agnostic.
const ICONS = { zap: Zap, sun: Sun, cloud: Cloud, thermometer: Thermometer, droplet: Droplet };

function Stat({ stat, align = 'start' }) {
  const Icon = stat.icon && ICONS[stat.icon];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: align === 'end' ? 'flex-end' : 'flex-start' }}>
      <span
        style={{
          display: 'flex',
          flexDirection: align === 'end' ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: 600,
          opacity: 0.8,
        }}
      >
        {Icon && <Icon size={12} />} {stat.label}
      </span>
      <span style={{ fontSize: '1.375rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {stat.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        <small style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.75, marginLeft: '3px' }}>{stat.unit}</small>
      </span>
    </div>
  );
}

// Click-to-reveal AI Insight — used on all 6 dashboard pages, each passing
// its own `domain` (see aiSummary.js's SINGLE_METRIC_DOMAINS) so the panel
// talks about that page's own data instead of every page getting the same
// generic energy-vs-solar summary. Doesn't fetch on mount (that was
// Compare.jsx's original behavior, always burning an AI call + rate-limit
// budget whether or not anyone looked at it); only fetches the first time
// it's opened, then caches the result for the rest of the page's lifetime
// so re-toggling doesn't refetch.
export default function AIInsightPanel({ domain = 'overview' }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(null);
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
      fetchAiSummary(domain)
        .then((data) => {
          setSummary(data);
          setFetched(true);
        })
        .catch((e) => setError(e))
        .finally(() => setLoading(false));
    }
  };

  const hasStats = Boolean(summary?.primary && summary?.secondary);

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
            {!loading && !error && summary && hasStats && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', rowGap: '10px' }}>
                  <Stat stat={summary.primary} />

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {summary.pill ? (
                      <>
                        <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.3)' }} />
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '20px',
                            whiteSpace: 'nowrap',
                            background: 'rgba(255,255,255,0.16)',
                            color: summary.pill.isGood ? '#86EFAC' : '#FCA5A5',
                          }}
                        >
                          {summary.pill.direction === 'up' && <ArrowUp size={10} />}
                          {summary.pill.direction === 'down' && <ArrowDown size={10} />}
                          {summary.pill.text}
                        </span>
                        <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.3)' }} />
                      </>
                    ) : (
                      <span style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.3)' }} />
                    )}
                  </div>

                  <Stat stat={summary.secondary} align="end" />
                </div>

                <p
                  style={{
                    margin: '14px 0 0',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.18)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    opacity: 0.92,
                  }}
                >
                  {highlightMetrics(summary.insight, { positive: '#86EFAC', negative: '#FCA5A5' })}
                </p>
              </>
            )}
            {!loading && !error && summary && !hasStats && (
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
                {highlightMetrics(summary.insight, { positive: '#86EFAC', negative: '#FCA5A5' })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
