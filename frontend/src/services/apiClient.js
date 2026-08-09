import { getAccessToken } from '../auth/getAccessToken';
import { isGuestMode, getGuestSessionId } from '../auth/guestSession';

// Single source of truth for the backend base URL.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://func-gbtac-dev1-g8d8c2c6e6crc2ag.canadacentral-01.azurewebsites.net/api';

export async function authFetch(path, options = {}) {
  // GUEST MODE: a guest session has no MSAL account, so getAccessToken()
  // would throw — send the guest session id instead of a bearer token. This
  // is the single choke point every service file goes through, so nothing
  // else needs a guest branch.
  const headers = { ...options.headers };
  if (isGuestMode()) {
    headers['X-Guest-Session'] = getGuestSessionId();
  } else {
    const accessToken = await getAccessToken();
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
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