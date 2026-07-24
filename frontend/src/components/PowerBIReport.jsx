import React, { useState, useEffect, useCallback } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { fetchEmbedToken } from '../services/embedTokenService';

// Report/page IDs come from env vars so dev/staging/prod can point at
// different Power BI workspaces without editing code. See .env.example.
const REPORT_ID = process.env.REACT_APP_PBI_REPORT_ID;

const REPORT_MAP = {
  overview: { reportId: REPORT_ID, pageId: process.env.REACT_APP_PBI_PAGE_OVERVIEW },
  greenhouseEnergy: { reportId: REPORT_ID, pageId: process.env.REACT_APP_PBI_PAGE_ENERGY }, // Energy page
  solarGeneration: { reportId: REPORT_ID, pageId: process.env.REACT_APP_PBI_PAGE_SOLAR }, // Solar page
  weather: { reportId: REPORT_ID, pageId: process.env.REACT_APP_PBI_PAGE_WEATHER },
  emissions: { reportId: REPORT_ID, pageId: process.env.REACT_APP_PBI_PAGE_EMISSIONS },
  energyVsSolar: { reportId: REPORT_ID, pageId: process.env.REACT_APP_PBI_PAGE_ENERGY_VS_SOLAR },
  energySolarBreakdown: { reportId: REPORT_ID, pageId: process.env.REACT_APP_PBI_PAGE_ENERGY_SOLAR_BREAKDOWN }, // Compare - Breakdown
};

export default function PowerBIReport({ reportKey }) {
  const [embedConfig, setEmbedConfig] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadEmbedToken = useCallback(async () => {
    if (!REPORT_MAP[reportKey]) {
      setError(`Unknown reportKey "${reportKey}".`);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { token, embedUrl } = await fetchEmbedToken(REPORT_MAP[reportKey].reportId);

      setEmbedConfig({
        type: 'report',
        id: REPORT_MAP[reportKey].reportId,
        embedUrl: embedUrl,
        accessToken: token,
        tokenType: models.TokenType.Embed,
        pageName: REPORT_MAP[reportKey].pageId,
        settings: {
          layoutType: models.LayoutType.Custom,
          panes: {
            filters: { visible: false },
            pageNavigation: { visible: false },
          },
          background: models.BackgroundType.Transparent,
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to load token.');
    } finally {
      setLoading(false);
    }
  }, [reportKey]);

  useEffect(() => {
    loadEmbedToken();
  }, [loadEmbedToken]);

  return (
    <div
      style={{
        width: '100%',
        // FIX: this was a hardcoded height: '750px', completely independent of
        // how much vertical space the page actually had. On any viewport taller
        // than 750px + chrome (iPad portrait, big monitors), that left dead
        // white/dark space below the card — exactly the "extra space at the
        // bottom" bug. flex:1 lets it fill whatever height ReportCard hands it.
        // (ReportCard must also be flex:1/display:flex — updated separately.)
        flex: 1,
        minHeight: '500px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading report...</div>}
      {error && <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>}

      {!loading && !error && embedConfig && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Power BI Embed */}
          <PowerBIEmbed
            embedConfig={embedConfig}
            cssClassName="powerbi-report-container"
          />

          {/* ZOOM BLOCKER: Invisible overlay to prevent trackpad gesture interception */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }} />
        </div>
      )}

      <style>{`
        .powerbi-report-container {
          width: 100% !important;
          /* BANNER HACK: Crop the bottom 50px */
          height: calc(100% + 50px) !important;
          border: none !important;
          margin-top: -50px !important;
          /* Force ignore touch zoom */
          touch-action: none !important;
        }
        .powerbi-report-container iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          display: block !important;
        }
      `}</style>
    </div>
  );
}