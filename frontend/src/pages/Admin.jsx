import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../auth/UserContext';
import { Users, ChevronDown, ChevronUp, UserCheck, Trash2, UploadCloud } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Toast from '../components/Toast';
import Toggle from '../components/Toggle';
import { useMsal } from '@azure/msal-react';
import {
  fetchAdminSummary,
  fetchUsers,
  fetchPendingUsers,
  updateUser,
  approveUser,
  denyUser,
  deleteUser,
  fetchUploadSettings,
  updateUploadSettings,
} from '../services/adminService';
import { ROLES, USER_STATUS } from '../constants/roles';

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

  // Real role read from the database via /me (shared UserContext), not
  // the JWT token, since SuperAdmin approval only updates the database.
  const { user } = useUser();
  const role = user?.role || ROLES.VIEWER;
  const currentUserEmail = account?.username || account?.idTokenClaims?.preferred_username;

  const canEditRoles = role === ROLES.SUPER_ADMIN;

  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingRoleChoice, setPendingRoleChoice] = useState({}); // { userId: 'Staff' }
  const [pendingOpen, setPendingOpen] = useState(true); // collapsible, open by default
  const [usersOpen, setUsersOpen] = useState(true); // collapsible, open by default
  const [error, setError] = useState(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [maxUploadMb, setMaxUploadMb] = useState(null);
  const [maxUploadMbDraft, setMaxUploadMbDraft] = useState('');
  const [savingUploadLimit, setSavingUploadLimit] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const showToast = (message, variant = 'success') => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  const load = useCallback(() => {
    fetchAdminSummary().then(setSummary).catch((e) => setError(e.message));
fetchUsers()
      .then((data) => {
        const all = Array.isArray(data) ? data : data?.users || data?.data || [];
        // Only show approved users here, pending users live in the
        // Pending Approval section above, denied users don't need to
        // clutter this table either.
        setUsers(all.filter((u) => u.status === USER_STATUS.ACTIVE));
      })
      .catch((e) => setError(e.message));
    if (canEditRoles) {
      fetchPendingUsers()
        .then((data) => setPendingUsers(Array.isArray(data) ? data : []))
        .catch((e) => setError(e.message));
      fetchUploadSettings()
        .then((s) => {
          setMaxUploadMb(s.maxUploadMb);
          setMaxUploadMbDraft(String(s.maxUploadMb));
        })
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
      showToast(`Could not update role: ${e.message}`, 'error');
    }
  };

  const handleToggleActive = async (userId, currentlyActive) => {
    try {
      await updateUser(userId, { active: !currentlyActive });
      showToast(currentlyActive ? 'User deactivated' : 'User activated');
      load();
    } catch (e) {
      showToast(`Could not update status: ${e.message}`, 'error');
    }
  };

  const handleToggleUpload = async (userId, currentlyCanUpload) => {
    try {
      await updateUser(userId, { can_upload: !currentlyCanUpload });
      showToast(currentlyCanUpload ? 'Upload permission removed' : 'Upload permission granted');
      load();
    } catch (e) {
      showToast(`Could not update upload permission: ${e.message}`, 'error');
    }
  };

const handleDeny = async (userId) => {
    try {
      await denyUser(userId);
      showToast('User denied');
      load();
    } catch (e) {
      showToast(`Could not deny user: ${e.message}`, 'error');
    }
  };

  const handleApprove = async (userId) => {
    const chosenRole = pendingRoleChoice[userId] || ROLES.VIEWER;
    try {
      await approveUser(userId, chosenRole);
      showToast(`User approved as ${chosenRole}`);
      load();
    } catch (e) {
      showToast(`Could not approve user: ${e.message}`, 'error');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    const { id, displayName } = confirmDeleteUser;
    try {
      await deleteUser(id);
      setConfirmDeleteUser(null);
      showToast(`Deleted ${displayName}`);
      load();
    } catch (e) {
      showToast(`Could not delete user: ${e.message}`, 'error');
      setConfirmDeleteUser(null);
    }
  };

  const handleApplyUploadLimit = async () => {
    const parsed = Number(maxUploadMbDraft);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
      showToast('Upload limit must be a whole number between 1 and 1000 MB.', 'error');
      return;
    }
    setSavingUploadLimit(true);
    try {
      const result = await updateUploadSettings(parsed);
      setMaxUploadMb(result.maxUploadMb);
      setMaxUploadMbDraft(String(result.maxUploadMb));
      showToast(`Upload limit set to ${result.maxUploadMb} MB`);
    } catch (e) {
      showToast(`Could not update upload limit: ${e.message}`, 'error');
    } finally {
      setSavingUploadLimit(false);
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
            <div className="gbtac-fade-in" style={{ marginTop: '14px' }}>
              {pendingUsers.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                  No pending requests right now.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="gbtac-responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '32%' }} />
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                     <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>NAME</th>
                        <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>EMAIL</th>
                        <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>ASSIGN ROLE</th>
                        <th style={{ padding: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td data-label="Name" style={{ padding: '10px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.displayName}</td>
                          <td data-label="Email" style={{ padding: '10px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                          <td data-label="Assign role" style={{ padding: '10px 8px' }}>
                            <select
                              value={pendingRoleChoice[u.id] || ROLES.VIEWER}
                              onChange={(e) =>
                                setPendingRoleChoice((prev) => ({ ...prev, [u.id]: e.target.value }))
                              }
                              style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                            >
                              <option value={ROLES.VIEWER}>Viewer</option>
                              <option value={ROLES.STAFF}>Staff</option>
                              <option value={ROLES.ADMIN}>Admin</option>
                            </select>
                          </td>
                          <td data-label="Action" style={{ padding: '10px 8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleApprove(u.id)}
                                className="gbtac-btn-fx"
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
                              <button
                                onClick={() => handleDeny(u.id)}
                                className="gbtac-btn-fx"
                                style={{
                                  background: 'var(--status-red-bg)',
                                  color: 'var(--status-red-text)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '5px 12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Deny
                              </button>
                            </div>
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

      {/* User management — collapsible, same pattern as Pending Approval */}
      <div style={cardStyle}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setUsersOpen((v) => !v)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setUsersOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: usersOpen ? '14px' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: '0.9375rem', margin: 0 }}>Users</h3>
          </div>
          {usersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {usersOpen && (
        <div className="gbtac-fade-in" style={{ overflowX: 'auto' }}>
          <table className="gbtac-responsive-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: canEditRoles ? '18%' : '20%' }} />
              <col style={{ width: canEditRoles ? '22%' : '26%' }} />
              <col style={{ width: canEditRoles ? '12%' : '14%' }} />
              <col style={{ width: canEditRoles ? '13%' : '14%' }} />
              <col style={{ width: canEditRoles ? '13%' : '14%' }} />
              <col style={{ width: canEditRoles ? '11%' : '12%' }} />
              {canEditRoles && <col style={{ width: '11%' }} />}
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>NAME</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>EMAIL</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>ROLE</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>CAN UPLOAD</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>LAST LOGIN</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>ACCESS</th>
                {canEditRoles && <th style={{ padding: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>ACTION</th>}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td className="gbtac-table-empty-cell" colSpan={canEditRoles ? 7 : 6} style={{ padding: '32px 16px', textAlign: 'center' }}>
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
                    <td data-label="Name" style={{ padding: '10px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.displayName}
                      {isSelf && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '6px' }}>
                          (you)
                        </span>
                      )}
                    </td>
                    <td data-label="Email" style={{ padding: '10px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                    <td data-label="Role" style={{ padding: '10px 8px' }}>
                      {canEditRoles && !isSelf ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                        >
                          <option value={ROLES.VIEWER}>Viewer</option>
                          <option value={ROLES.STAFF}>Staff</option>
                          <option value={ROLES.ADMIN}>Admin</option>
                          <option value={ROLES.SUPER_ADMIN}>SuperAdmin</option>
                        </select>
                      ) : (
                        <span>{u.role}</span>
                      )}
                    </td>
                    <td data-label="Can upload" style={{ padding: '10px 8px' }}>
                      {(() => {
                        const isUploadAllowed = u.role === ROLES.SUPER_ADMIN || u.canUpload;
                        const canToggleUpload = u.role === ROLES.ADMIN && canEditRoles && !isSelf;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <Toggle
                              checked={isUploadAllowed}
                              onChange={() => handleToggleUpload(u.id, u.canUpload)}
                              label=""
                              disabled={!canToggleUpload}
                            />
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: isUploadAllowed ? 'var(--status-green-text)' : 'var(--status-red-text)',
                              }}
                            >
                              {isUploadAllowed ? 'Allowed' : 'Blocked'}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td data-label="Last login" style={{ padding: '10px 8px' }}>{u.lastLogin ?? '—'}</td>
                    <td data-label="Access" style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <Toggle
                          checked={u.active}
                          onChange={() => handleToggleActive(u.id, u.active)}
                          label=""
                          disabled={isSelf}
                        />
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: u.active ? 'var(--status-green-text)' : 'var(--status-red-text)',
                          }}
                        >
                          {u.active ? 'Unblocked' : 'Blocked'}
                        </span>
                      </div>
                    </td>
                    {canEditRoles && (
                      <td data-label="Action" style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {!isSelf && (
                          <button
                            onClick={() => setConfirmDeleteUser({ id: u.id, displayName: u.displayName })}
                            aria-label={`Delete ${u.displayName}`}
                            title="Delete user"
                            className="gbtac-btn-fx"
                            style={{ background: 'none', border: 'none', color: 'var(--status-red-text)', cursor: 'pointer', display: 'inline-flex' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Upload limit — SuperAdmin only, backed by upload_settings table
          instead of the old hardcoded MAX_MB constant duplicated across
          processUpload.js/uploadFile.js/frontend. */}
      {canEditRoles && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <UploadCloud size={18} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: '0.9375rem', margin: 0 }}>Upload Limit</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Maximum file size accepted by the data upload page.
            {maxUploadMb !== null && (
              <> Currently <strong style={{ color: 'var(--text-primary)' }}>{maxUploadMb} MB</strong>.</>
            )}
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Max size (MB)
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxUploadMbDraft}
                onChange={(e) => setMaxUploadMbDraft(e.target.value)}
                style={{
                  width: '120px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontSize: '0.8125rem',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <button
              onClick={handleApplyUploadLimit}
              disabled={savingUploadLimit || maxUploadMbDraft === String(maxUploadMb)}
              className="gbtac-btn-fx"
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent-blue)',
                color: '#fff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: savingUploadLimit || maxUploadMbDraft === String(maxUploadMb) ? 'not-allowed' : 'pointer',
                opacity: savingUploadLimit || maxUploadMbDraft === String(maxUploadMb) ? 0.6 : 1,
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Organization */}
      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: '16px' }}>Organization</h3>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Workspace</span>
          <span style={{ fontSize: '0.875rem' }}>GBTAC — Sprung Greenhouse Project</span>
        </div>
      </div>

      {/* Delete confirmation modal — same pattern as Upload.jsx's delete-upload modal */}
      {confirmDeleteUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-modal-title"
          className="gbtac-modal-backdrop"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setConfirmDeleteUser(null)}
        >
          <div
            className="gbtac-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: '10px',
              padding: '24px',
              width: '380px',
              maxWidth: '90vw',
            }}
          >
            <h3 id="delete-user-modal-title" style={{ fontSize: '1rem', marginBottom: '10px' }}>
              Delete this user?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <strong>{confirmDeleteUser.displayName}</strong> will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="gbtac-btn-fx"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="gbtac-btn-fx"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--status-red-text)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} variant={toastVariant} onDismiss={() => setToastMessage('')} />

      <style>{`
        @keyframes gbtac-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        /* Collapse the Pending Approval / Users tables into stacked cards
           below the same breakpoint the sidebar nav switches at
           (Layout.jsx), so mobile gets one consistent point where the
           layout reflows instead of overflow-scrolling narrow tables. */
        @media (max-width: 820px) {
          .gbtac-responsive-table,
          .gbtac-responsive-table tbody,
          .gbtac-responsive-table tr,
          .gbtac-responsive-table td {
            display: block;
            width: 100% !important;
          }
          .gbtac-responsive-table thead {
            display: none;
          }
          .gbtac-responsive-table tr {
            border: 1px solid var(--border);
            border-bottom: 1px solid var(--border) !important;
            border-radius: 8px;
            margin-bottom: 10px;
            overflow: hidden;
          }
          .gbtac-responsive-table td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            white-space: normal !important;
            border-bottom: 1px solid var(--border);
          }
          .gbtac-responsive-table td:last-child {
            border-bottom: none;
          }
          .gbtac-responsive-table td::before {
            content: attr(data-label);
            font-size: 0.6875rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: var(--text-secondary);
            flex-shrink: 0;
            margin-right: 12px;
          }
          .gbtac-responsive-table td.gbtac-table-empty-cell {
            justify-content: center;
            text-align: center;
          }
          .gbtac-responsive-table td.gbtac-table-empty-cell::before {
            content: none;
            margin-right: 0;
          }
          .gbtac-responsive-table td:empty {
            display: none;
          }
        }
      `}</style>
    </PageContainer>
  );
}
