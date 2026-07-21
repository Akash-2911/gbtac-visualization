import { authFetch } from './apiClient';

export function fetchAdminSummary() {
  return authFetch('/dashboardSummary').then((data) => {
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

function mapUser(u) {
  return {
    id: u.user_id,
    displayName: u.display_name,
    email: u.email,
    role: u.role,
    active: u.active,
    status: u.status,
    canUpload: !!u.can_upload,
    lastLogin: u.last_login,
  };
}

export function fetchUsers() {
  return authFetch('/dashboardUsers').then((data) => {
    const rows = data?.data || data?.users || data || [];
    return rows.map(mapUser);
  });
}

// Only pending users, for the collapsible approval section
export function fetchPendingUsers() {
  return authFetch('/dashboardUsers?status=pending').then((data) => {
    const rows = data?.data || data?.users || data || [];
    return rows.map(mapUser);
  });
}

export function updateUser(id, changes) {
  return authFetch(`/dashboard/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}

// Convenience wrapper: approve a pending user in one call, sets status
// active and assigns their role at the same time.
export function approveUser(id, role) {
  return updateUser(id, { status: 'active', role });
}