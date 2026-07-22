import { getAccessToken } from '../auth/getAccessToken';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://func-gbtac-dev1-g8d8c2c6e6crc2ag.canadacentral-01.azurewebsites.net/api';

export async function fetchSummary({ siteId, from, to } = {}) {
  const accessToken = await getAccessToken();

  const params = new URLSearchParams();
  if (siteId) params.set('site_id', siteId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const query = params.toString();
  const url = `${API_BASE_URL}/summary${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Summary request failed (${response.status})`);
  }

  return response.json();
}