const USE_MOCK = process.env.REACT_APP_USE_MOCK_EMBED_TOKEN === 'true';

import { getAccessToken } from '../auth/getAccessToken';
import { API_BASE_URL } from './apiClient';
import { isGuestMode, getGuestSessionId } from '../auth/guestSession';

export async function fetchEmbedToken(reportId) {
  if (USE_MOCK) {
    return mockFetchEmbedToken(reportId);
  }

  // GUEST MODE: this file fetches its own token instead of going through
  // apiClient.js's authFetch, so it needs the same guest branch repeated
  // here — a guest has no MSAL account, so getAccessToken() would throw.
  const headers = isGuestMode()
    ? { 'X-Guest-Session': getGuestSessionId() }
    : { Authorization: `Bearer ${await getAccessToken()}` };

  const response = await fetch(
    `${API_BASE_URL}/powerbi/token?reportId=${encodeURIComponent(reportId)}`,
    {
      method: 'GET',
      headers,
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