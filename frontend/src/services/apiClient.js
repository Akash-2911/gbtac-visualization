import { getAccessToken } from '../auth/getAccessToken';

// Single source of truth for the backend base URL — was previously
// duplicated in summaryService.js and embedTokenService.js.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://func-gbtac-dev1-g8d8c2c6e6crc2ag.canadacentral-01.azurewebsites.net/api';

export async function authFetch(path, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    // Attach the status so callers can distinguish 403 (no permission) and
    // 429 (rate limited) from other failures, instead of only having the
    // error message string to work with.
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}