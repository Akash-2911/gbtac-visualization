import React, { useState, useEffect, useCallback } from 'react';
import { Users, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Toast from '../components/Toast';
import { useMsal } from '@azure/msal-react';
import {
  fetchAdminSummary,
  fetchUsers,
  fetchPendingUsers,
  updateUser,
  approveUser,
} from '../services/adminService';

// Loading skeleton for the KPI cards, shown while summary is still null
// instead of a bare "—" (feedback item: "Quick Stats Placeholder").
function KpiSkeleton() {
  return (
    <div
      style={{
        height: '22px',
        width: '60px',
        borderRadius: '4px',
        background: 'var(--border)',
        opacity: 0.6,
        animation: 'gbtac-pulse 1.2s ease-in-out infinite',
      }}
    />
  );
}

export default function Admin() {
  const { instance } = useMsal();
  const account = instance.getActiveAccount();

  // Real role read from the signed-in account's token claims instead of
  // the old hardcoded 'Admin' stopgap (item #4). Same pattern as
  // Settings.jsx and Layout.jsx so all three places always agree.
  const roles = account?.idTokenClaims?.roles || [];
  const role = roles.includes('SuperAdmin')
    ? 'SuperAdmin'
    : roles.includes('Admin')
    ? 'Admin'
    : roles.includes('Staff')
    ? 'Staff'
    : 'Viewer';
  const currentUserEmail = account?.username || account?.idTokenClaims?.preferred_username;

  const canEditRoles = role === 'SuperAdmin';

  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingRoleChoice, setPendingRoleChoice] = useState({}); // { userId: 'Staff' }
  const [pendingOpen, setPendingOpen] = useState(true); // collapsible, open by default
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (message) => setToastMessage(message);

  const load = useCallback(() => {
    fetchAdminSummary().then(setSummary).catch((e) => setError(e.message));
    fetchUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : data?.users || data?.data || []))
      .catch((e) => setError(e.message));
    if (canEditRoles) {
      fetchPendingUsers()
        .then((data) => setPendingUsers(Array.isArray(data) ? data : []))
        .catch((e) => setError(e.message));
    }
  }, [canEditRoles]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });
      showToast(`Role updated to ${newRole}`);
      load();
    } catch (e) {
      alert(`Could not update role: ${e.message}`);
    }
  };

  const handleToggleActive = async (userId, currentlyActive) => {
    try {
      await updateUser(userId, { active: !currentlyActive });
      showToast(currentlyActive ? 'User deactivated' : 'User activated');
      load();
    } catch (e) {
      alert(`Could not update status: ${e.message}`);
    }
  };

  const handleToggleUpload = async (userId, currentlyCanUpload) => {
    try {
      await updateUser(userId, { can_upload: !currentlyCanUpload });
      showToast(currentlyCanUpload ? 'Upload permission removed' : 'Upload permission granted');
      load();
    } catch (e) {
      alert(`Could not update upload permission: ${e.message}`);
    }
  };

  const handleApprove = async (userId) => {
    const chosenRole = pendingRoleChoice[userId] || 'Viewer';
    try {
      await approveUser(userId, chosenRole);
      showToast(`User approved as ${chosenRole}`);
      load();
    } catch (e) {
      alert(`Could not approve user: ${e.message}`);
    }
  };

  const cardStyle = { backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '20px', marginBottom: '24px' };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' };
  const isLoadingSummary = summary === null && !error;

  return (
    <PageContainer title="Admin" subtitle="Users and workspace management — Admin role only">
      {error && (
        <p style={{ color: 'var(--status-red-text)', fontSize: '0.8125rem', marginBottom: '16px' }}>
          {error}
        </p>
      )}

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '160px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>TOTAL USERS</p>
          {isLoadingSummary ? <KpiSkeleton /> : <p style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>{summary?.totalUsers ?? '—'}</p>}
        </div>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '160px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>LAST GREENHOUSE UPLOAD</p>
          {isLoadingSummary ? <KpiSkeleton /> : <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{summary?.lastUpload?.greenhouse ?? '—'}</p>}
        </div>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '160px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>LAST SOLAR UPLOAD</p>
          {isLoadingSummary ? <KpiSkeleton /> : <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{summary?.lastUpload?.solar ?? '—'}</p>}
        </div>
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '16px 20px', flex: 1, minWidth: '160px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>LAST WEATHER UPLOAD</p>
          {isLoadingSummary ? <KpiSkeleton /> : <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{summary?.lastUpload?.weather ?? '—'}</p>}
        </div>
      </div>

      {/* Pending Approval — collapsible, SuperAdmin only, only rendered
          at all if there's something to show */}
      {canEditRoles && (
        <div style={cardStyle}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPendingOpen((v) => !v)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPendingOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} strokeWidth={2} style={{ color: 'var(--status-orange-text)' }} />
              <h3 style={{ fontSize: '0.9375rem', margin: 0 }}>
                Pending Approval
                {pendingUsers.length > 0 && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      background: 'var(--status-orange-bg)',
                      color: 'var(--status-orange-text)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {pendingUsers.length}
                  </span>
                )}
              </h3>
            </div>
            {pendingOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {pendingOpen && (
            <div style={{ marginTop: '14px' }}>
              {pendingUsers.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                  No pending requests right now.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>NAME</th>
                        <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>EMAIL</th>
                        <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>ASSIGN ROLE</th>
                        <th style={{ padding: '8px', color: 'var(--text-secondary)' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 8px' }}>{u.displayName}</td>
                          <td style={{ padding: '10px 8px' }}>{u.email}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <select
                              value={pendingRoleChoice[u.id] || 'Viewer'}
                              onChange={(e) =>
                                setPendingRoleChoice((prev) => ({ ...prev, [u.id]: e.target.value }))
                              }
                              style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                            >
                              <option>Viewer</option>
                              <option>Staff</option>
                              <option>Admin</option>
                            </select>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <button
                              onClick={() => handleApprove(u.id)}
                              style={{
                                background: 'var(--status-green-bg)',
                                color: 'var(--status-green-text)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '5px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* User management */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: '14px' }}>Users</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>NAME</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>EMAIL</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>ROLE</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>CAN UPLOAD</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>LAST LOGIN</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center' }}>
                    {error ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--status-red-text)', margin: 0 }}>
                        Couldn't load users — see error above.
                      </p>
                    ) : (
                      <>
                        <Users size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                          No users found — team members will appear here once they sign in.
                        </p>
                      </>
                    )}
                  </td>
                </tr>
              )}
              {users.map((u) => {
                // "You" tag + role-edit lockdown: nobody edits their own role,
                // and only SuperAdmin can edit anyone's role (matches backend
                // updateUser.js which enforces the same two rules server-side).
                const isSelf = u.email === currentUserEmail;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px' }}>
                      {u.displayName}
                      {isSelf && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '6px' }}>
                          (you)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px' }}>{u.email}</td>
                    <td style={{ padding: '10px 8px' }}>
                      {canEditRoles && !isSelf ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                        >
                          <option>Viewer</option>
                          <option>Staff</option>
                          <option>Admin</option>
                          <option>SuperAdmin</option>
                        </select>
                      ) : (
                        <span>{u.role}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      {/* Upload permission only matters for Admin role,
                          SuperAdmin can always upload, Staff/Viewer never can */}
                      {u.role === 'Admin' && canEditRoles && !isSelf ? (
                        <button
                          onClick={() => handleToggleUpload(u.id, u.canUpload)}
                          style={{
                            background: u.canUpload ? 'var(--status-green-bg)' : 'var(--border)',
                            color: u.canUpload ? 'var(--status-green-text)' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {u.canUpload ? 'Allowed' : 'Blocked'}
                        </button>
                      ) : (
                        <span
  style={{
    background: 'var(--status-green-bg)',
    color: 'var(--status-green-text)',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: 600,
  }}
>
  {u.role === 'SuperAdmin' ? 'Allowed' : u.canUpload ? 'Allowed' : 'Blocked'}
</span>
                      )}
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
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {u.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organization */}
      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: '16px' }}>Organization</h3>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Workspace</span>
          <span style={{ fontSize: '0.875rem' }}>GBTAC — Black Diamond Project</span>
        </div>
      </div>

      <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />

      <style>{`
        @keyframes gbtac-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </PageContainer>
  );
}