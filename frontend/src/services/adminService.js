import { authFetch } from './apiClient';

export function fetchAdminSummary() {
  return authFetch('/dashboardSummary');
}

export function fetchUploadHistory() {
  return authFetch('/uploads/history');
}

export function deleteUpload(id) {
  return authFetch(`/upload/${id}`, { method: 'DELETE' });
}

export function fetchUsers() {
  return authFetch('/dashboardUsers');
}

export function updateUser(id, changes) {
  return authFetch(`/dashboard/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}