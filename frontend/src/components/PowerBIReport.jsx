import React, { useState, useEffect, useCallback } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { fetchEmbedToken } from '../services/embedTokenService';

const WORKSPACE_ID = 'c650852a-605f-48a7-9cc6-5c2942f66969';

// Each entry = one page you can embed. Multiple keys can share the same
// reportId (a report can have several pages).
const REPORT_MAP = {
  weather: {
    reportId: '8c43f0fe-6963-4fe2-afd1-c1429ea5a76a',
    pageId: 'f2d890f1552c7cdec936',
  },
  overview: {
    reportId: '8c43f0fe-6963-4fe2-afd1-c1429ea5a76a',
    pageId: '0a43f601edddf2ea58d8',
  },
  greenhouseEnergy: {
    reportId: 'd539932b-add1-4c6b-ad19-7e4ea08ee044',
    pageId: '9fb111ee357b4627a3b5',
  },
  energyVsSolar: {
    reportId: 'd539932b-add1-4c6b-ad19-7e4ea08ee044',
    pageId: 'd9da5989d76e7e210ca3',
  },
  energySolarBreakdown: {
    reportId: 'd539932b-add1-4c6b-ad19-7e4ea08ee044',
    pageId: '549f57835ef0a0dd3d84',
  },
  solarGeneration: {
    reportId: '1fba11af-ee34-40e1-8eae-f82945c84f90',
    pageId: 'b21899854ca5981473a0',
  },
};

export default function PowerBIReport({ reportKey, height = 'calc(100vh - 220px)' }) {
  const [embedConfig, setEmbedConfig] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const config = REPORT_MAP[reportKey];

  const loadEmbedToken = useCallback(async () => {
    if (!config) {
      setError(`Unknown reportKey "${reportKey}". Check REPORT_MAP.`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { token, expiry, embedUrl } = await fetchEmbedToken(config.reportId);

setEmbedConfig({
  type: 'report',
  id: config.reportId,
  embedUrl: embedUrl,
  accessToken: token,
        tokenType: models.TokenType.Embed,
        pageName: config.pageId,
        settings: {
          panes: {
            filters: { visible: false },
            pageNavigation: { visible: false },
          },
          background: models.BackgroundType.Transparent,
        },
      });

      const msUntilRefresh = new Date(expiry).getTime() - Date.now() - 5 * 60 * 1000;
      if (msUntilRefresh > 0) {
        setTimeout(loadEmbedToken, msUntilRefresh);
      }
    } catch (err) {
      setError(err.message || 'Failed to load Power BI embed token.');
    } finally {
      setLoading(false);
    }
  }, [reportKey]);

  useEffect(() => {
    loadEmbedToken();
  }, [loadEmbedToken]);

  if (loading) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading report…</div>;
  }

  if (error) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b00020' }}>
        Could not load report: {error}
      </div>
    );
  }

  return (
    <PowerBIEmbed
      embedConfig={embedConfig}
      cssClassName="powerbi-report-container"
      getEmbeddedComponent={(embeddedReport) => {
        window.__pbiReport = embeddedReport;
      }}
      eventHandlers={
        new Map([
          ['error', (event) => console.error('PowerBI embed error:', event.detail)],
        ])
      }
      cssStyle={{ height, width: '100%' }}
    />
  );
}