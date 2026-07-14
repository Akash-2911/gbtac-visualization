const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://func-gbtac-dev1-g8d8c2c6e6crc2ag.canadacentral-01.azurewebsites.net/api';

const USE_MOCK = process.env.REACT_APP_USE_MOCK_EMBED_TOKEN === 'true';

import { getAccessToken } from '../auth/getAccessToken';

export async function fetchEmbedToken(reportId) {
  if (USE_MOCK) {
    return mockFetchEmbedToken(reportId);
  }

  const accessToken = await getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/powerbi/token?reportId=${encodeURIComponent(reportId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Token request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.embedToken || !data.expiration) {
    throw new Error('Token response missing expected fields (embedToken/expiration).');
  }

  // Normalize field names so the rest of the app has one consistent shape.
  return {
    token: data.embedToken,
    expiry: data.expiration,
    embedUrl: data.embedUrl,
  };
}

async function mockFetchEmbedToken(reportId) {
  console.warn(`[MOCK] Returning fake embed token for report ${reportId}`);
  return {
    token: 'MOCK_TOKEN_REPLACE_ONCE_ENDPOINT_IS_LIVE',
    expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=mock&groupId=mock',
  };
}