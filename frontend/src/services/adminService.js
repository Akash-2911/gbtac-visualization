import { authFetch } from './apiClient';

export function fetchAdminSummary() {
  return authFetch('/dashboardSummary').then((data) => {
    // Backend returns snake_case fields grouped differently than the UI expects,
    // reshape here so Admin.jsx can stay simple.
    const greenhouse = data.uploadSummary?.find((u) => u.data_type === 'greenhouse');
    const solar = data.uploadSummary?.find((u) => u.data_type === 'solar');
    const weather = data.uploadSummary?.find((u) => u.data_type === 'weather');
    return {
      totalUsers: data.users?.total_users ?? 0,
      lastUpload: {
        greenhouse: greenhouse?.last_upload_at ?? null,
        solar: solar?.last_upload_at ?? null,
        weather: weather?.last_upload_at ?? null,
      },
    };
  });
}

export function fetchUploadHistory() {
  return authFetch('/uploads/history');
}

export function deleteUpload(id) {
  return authFetch(`/upload/${id}`, { method: 'DELETE' });
}

export function fetchUsers() {
  return authFetch('/dashboardUsers').then((data) => {
    // Backend returns { data: [...] } with snake_case fields, map to
    // camelCase so the table doesn't need to know about the DB schema.
    const rows = data?.data || data?.users || data || [];
    return rows.map((u) => ({
      id: u.user_id,
      displayName: u.display_name,
      email: u.email,
      role: u.role,
      active: u.active,
      lastLogin: u.last_login,
    }));
  });
}

export function updateUser(id, changes) {
  return authFetch(`/dashboard/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}