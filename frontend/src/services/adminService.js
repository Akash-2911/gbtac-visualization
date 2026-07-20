import { authFetch } from './apiClient';

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