import React, { useState, useEffect, useCallback } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { fetchEmbedToken } from '../services/embedTokenService';

const NEW_REPORT_ID = '84ba8dbd-1617-4315-b03e-37ef3be4e905';

const REPORT_MAP = {
  overview: { reportId: NEW_REPORT_ID, pageId: 'ae24fc3a0479d5e60727' },
  greenhouseEnergy: { reportId: NEW_REPORT_ID, pageId: 'ee587a4a0d8d49fcca10' }, // Energy page
  solarGeneration: { reportId: NEW_REPORT_ID, pageId: '8f9a0b1c2d3e4f5a6b7d' }, // Solar page
  weather: { reportId: NEW_REPORT_ID, pageId: '8747da8341ec9213795a' },
  emissions: { reportId: NEW_REPORT_ID, pageId: '9f9fda1b2c3d4e5f6a7c' },
  energyVsSolar: { reportId: NEW_REPORT_ID, pageId: '6d7e8f9a0b1c2d3e4f5a' },
  energySolarBreakdown: { reportId: NEW_REPORT_ID, pageId: '7e8f9a0b1c2d3e4f5a6b' }, // Compare - Breakdown
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