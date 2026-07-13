const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://func-gbtac-dev1-g8d8c2c6e6crc2ag.canadacentral-01.azurewebsites.net/api';

const USE_MOCK = process.env.REACT_APP_USE_MOCK_EMBED_TOKEN === 'true';

export async function fetchEmbedToken(reportId) {
  if (USE_MOCK) {
    return mockFetchEmbedToken(reportId);
  }

  const response = await fetch(
    `${API_BASE_URL}/powerbi/token?reportId=${encodeURIComponent(reportId)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Token request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.token || !data.expiry) {
    throw new Error('Token response missing expected fields (token/expiry).');
  }

  return data;
}

async function mockFetchEmbedToken(reportId) {
  console.warn(`[MOCK] Returning fake embed token for report ${reportId}`);
  return {
    token: 'MOCK_TOKEN_REPLACE_ONCE_ENDPOINT_IS_LIVE',
    expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}