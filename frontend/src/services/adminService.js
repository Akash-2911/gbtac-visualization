import { getAccessToken } from '../auth/getAccessToken';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://func-gbtac-dev1-g8d8c2c6e6crc2ag.canadacentral-01.azurewebsites.net/api';

async function authFetch(path, options = {}) {
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
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  return response.json();
}

export function fetchAdminSummary() {
  return authFetch('/admin/summary');
}

export function fetchUploadHistory() {
  return authFetch('/uploads/history');
}

export function deleteUpload(id) {
  return authFetch(`/upload/${id}`, { method: 'DELETE' });
}

export function fetchUsers() {
  return authFetch('/admin/users');
}

export function updateUser(id, changes) {
  return authFetch(`/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}