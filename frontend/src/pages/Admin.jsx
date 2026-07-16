import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from '../components/PageContainer';
import {
  fetchAdminSummary,
  fetchUploadHistory,
  deleteUpload,
  fetchUsers,
  updateUser,
} from '../services/adminService';

const statusStyles = {
  complete: { bg: 'var(--status-green-bg)', text: 'var(--status-green-text)', label: '✓ Complete' },
  processing: { bg: 'var(--status-orange-bg)', text: 'var(--status-orange-text)', label: '↻ Processing' },
  failed: { bg: 'var(--status-red-bg)', text: 'var(--status-red-text)', label: '✕ Failed' },
};

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
  fetchAdminSummary().then(setSummary).catch((e) => setError(e.message));
  fetchUploadHistory()
    .then((data) => setUploads(Array.isArray(data) ? data : data?.uploads || data?.data || []))
    .catch((e) => setError(e.message));
  fetchUsers()
    .then((data) => setUsers(Array.isArray(data) ? data : data?.users || data?.data || []))
    .catch((e) => setError(e.message));
}, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this upload record? This cannot be undone.')) return;
    try {
      await deleteUpload(id);
      load();
    } catch (e) {
      alert(`Could not delete: ${e.message}`);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });
      load();
    } catch (e) {
      alert(`Could not update role: ${e.message}`);
    }
  };

  const handleToggleActive = async (userId, currentlyActive) => {
    try {
      await updateUser(userId, { active: !currentlyActive });
      load();
    } catch (e) {
      alert(`Could not update status: ${e.message}`);
    }
  };

  return (
    <PageContainer title="Admin" subtitle="Data upload and management — Admin role only">
      {error && (
        <p style={{ color: 'var(--status-red-text)', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </p>
      )}

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '160px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>TOTAL USERS</p>
          <p style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{summary?.totalUsers ?? '—'}</p>
        </div>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '160px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>LAST GREENHOUSE UPLOAD</p>
          <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{summary?.lastUpload?.greenhouse ?? '—'}</p>
        </div>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '160px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>LAST SOLAR UPLOAD</p>
          <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{summary?.lastUpload?.solar ?? '—'}</p>
        </div>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '160px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>LAST WEATHER UPLOAD</p>
          <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{summary?.lastUpload?.weather ?? '—'}</p>
        </div>
      </div>

      {/* Upload history */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Upload History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>FILENAME</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>TYPE</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>UPLOADED BY</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>DATE</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>ROWS</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>STATUS</th>
                <th style={{ padding: '8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>No uploads yet</td></tr>
              )}
              {uploads.map((row) => {
                const status = statusStyles[row.status?.toLowerCase()] || statusStyles.processing;
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px' }}>{row.filename}</td>
                    <td style={{ padding: '10px 8px' }}>{row.dataType}</td>
                    <td style={{ padding: '10px 8px' }}>{row.uploadedBy}</td>
                    <td style={{ padding: '10px 8px' }}>{row.date}</td>
                    <td style={{ padding: '10px 8px' }}>{row.rows ?? '—'}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ background: status.bg, color: status.text, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <button
                        onClick={() => handleDelete(row.id)}
                        aria-label={`Delete ${row.filename}`}
                        style={{ background: 'none', border: 'none', color: 'var(--status-red-text)', cursor: 'pointer', fontSize: '14px' }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User management */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Users</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>NAME</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>EMAIL</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>ROLE</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>LAST LOGIN</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>No users found</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px' }}>{u.displayName}</td>
                  <td style={{ padding: '10px 8px' }}>{u.email}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
                    >
                      <option>Viewer</option>
                      <option>Staff</option>
                      <option>Admin</option>
                      <option>SuperAdmin</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{u.lastLogin ?? '—'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <button
                      onClick={() => handleToggleActive(u.id, u.active)}
                      style={{
                        background: u.active ? 'var(--status-green-bg)' : 'var(--status-red-bg)',
                        color: u.active ? 'var(--status-green-text)' : 'var(--status-red-text)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {u.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}