import { authFetch } from './apiClient';
import { USER_STATUS } from '../constants/roles';

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
  return authFetch('/uploads/history').then((data) => {
    const rows = data?.data || data?.uploads || data || [];
    return rows.map((row) => ({
      id: row.batch_id,
      filename: row.file_name,
      dataType: row.data_type,
      uploadedBy: row.uploaded_by_name,
      date: row.uploaded_at,
      rows: row.row_count,
      status: row.status,
      errorMessage: row.error_message,
    }));
  });
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

export function denyUser(id) {
  return updateUser(id, { status: USER_STATUS.DENIED });
}

export function reapplyAccess() {
  return authFetch('/reapply', { method: 'POST' });
}

export function approveUser(id, role) {
  return updateUser(id, { status: USER_STATUS.ACTIVE, role });
}

// New: actual file upload, multipart form data, no Content-Type header
// (the browser sets the multipart boundary automatically).
export function uploadFile(file, dataType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('dataType', dataType);
  return authFetch('/upload', {
    method: 'POST',
    body: formData,
  });
}

// New: identity check, includes role and canUpload from the database,
// used by pages that need to know upload permission specifically,
// not just role (e.g. Upload.jsx).
export function fetchMe() {
  return authFetch('/me');
}