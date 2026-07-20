import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import PowerBIReport from '../components/PowerBIReport';
import PageContainer from '../components/PageContainer';
import ReportCard from '../components/ReportCard';
import { fetchAiSummary } from '../services/aiService';

const views = [
  { key: 'energyVsSolar', label: 'Energy vs Solar' },
  { key: 'energySolarBreakdown', label: 'Energy & Solar Breakdown' },
];

export default function Compare() {
  const [activeView, setActiveView] = useState('energyVsSolar');
  const [insight, setInsight] = useState(null);
  const [insightError, setInsightError] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);

  useEffect(() => {
    fetchAiSummary()
      .then((data) => {
        setInsight(data.insight);
        setInsightLoading(false);
      })
      .catch((e) => {
        setInsightError(e);
        setInsightLoading(false);
      });
  }, []);

  const renderInsightBody = () => {
    if (insightLoading) {
      return (
        <div
          style={{
            height: '18px',
            width: '80%',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.3)',
            animation: 'gbtac-pulse 1.2s ease-in-out infinite',
          }}
        />
      );
    }
    if (insightError) {
      if (insightError.status === 403) {
        return <p style={{ margin: 0, fontSize: '13px' }}>You don't have permission to view AI insights.</p>;
      }
      if (insightError.status === 429) {
        return <p style={{ margin: 0, fontSize: '13px' }}>Please wait a moment — too many requests.</p>;
      }
      return <p style={{ margin: 0, fontSize: '13px' }}>Couldn't load AI insight: {insightError.message}</p>;
    }
    return <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>{insight}</p>;
  };

  return (
    <PageContainer title="Compare" subtitle="Energy consumed vs energy generated">
      {/* AI Insight card */}
      <div
        style={{
          backgroundColor: 'var(--accent-purple)',
          color: '#fff',
          borderRadius: '10px',
          padding: '18px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', opacity: 0.85 }}>
            AI INSIGHT
          </p>
          {renderInsightBody()}
        </div>
      </div>

      <div
        style={{
          display: 'inline-flex',
          backgroundColor: 'var(--bg)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '16px',
          alignSelf: 'flex-start',
        }}
      >
        {views.map((view) => (
          <button
            key={view.key}
            type="button"
            onClick={() => setActiveView(view.key)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeView === view.key ? 'var(--accent-blue)' : 'transparent',
              color: activeView === view.key ? '#fff' : 'var(--text-secondary)',
              transition: 'background-color 0.15s',
            }}
          >
            {view.label}
          </button>
        ))}
      </div>

      <ReportCard>
        <PowerBIReport reportKey={activeView} />
      </ReportCard>

      <style>{`
        @keyframes gbtac-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </PageContainer>
  );
}