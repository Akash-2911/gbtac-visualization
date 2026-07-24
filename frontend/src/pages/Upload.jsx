import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UploadCloud, CheckCircle2, RotateCw, AlertCircle, Clock, AlertTriangle, Trash2, Lock } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Toast from '../components/Toast';
import { fetchUploadHistory, deleteUpload, uploadFile, fetchMe } from '../services/adminService';
import { ROLES } from '../constants/roles';

const statusConfig = {
  complete: { bg: 'var(--status-green-bg)', text: 'var(--status-green-text)', label: 'Complete', icon: CheckCircle2 },
  processing: { bg: 'var(--status-orange-bg)', text: 'var(--status-orange-text)', label: 'Processing', icon: RotateCw },
  pending: { bg: 'var(--status-orange-bg)', text: 'var(--status-orange-text)', label: 'Pending approval', icon: Clock },
  failed: { bg: 'var(--status-red-bg)', text: 'var(--status-red-text)', label: 'Failed', icon: AlertCircle },
};

const DATA_TYPES = ['Greenhouse', 'Solar', 'Weather'];
const STATUSES = ['complete', 'processing', 'pending', 'failed'];

export default function Upload() {
  // Real role + upload permission, fetched from /me (database), replaces
  // the old hardcoded 'Admin' stopgap that used to hide the upload zone
  // for everyone.
  const [me, setMe] = useState(null);
  useEffect(() => {
    fetchMe().then(setMe).catch(() => setMe(null));
  }, []);

  const canUploadFiles = me?.role === ROLES.SUPER_ADMIN || (me?.role === ROLES.ADMIN && me?.canUpload);

  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState(null);
  const [dataType, setDataType] = useState('Greenhouse');
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const showToast = (message) => setToastMessage(message);

  // Draft values bound to the filter inputs — only copied into the "applied"
  // state below when the Apply button is clicked, so typing/selecting
  // doesn't filter the table until the user asks for it.
  const [draftType, setDraftType] = useState('all');
  const [draftStatus, setDraftStatus] = useState('all');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');

  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [dateError, setDateError] = useState('');

  const load = useCallback(() => {
    fetchUploadHistory()
      .then((data) => setUploads(Array.isArray(data) ? data : data?.uploads || data?.data || []))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) {
      alert('Only .xlsx files are supported.');
      return;
    }
    // Must match MAX_MB in backend/functions/src/functions/upload/processUpload.js
    if (file.size > 100 * 1024 * 1024) {
      alert('File exceeds the 100MB limit.');
      return;
    }
    try {
      await uploadFile(file, dataType);
      showToast(`"${file.name}" uploaded`);
      load();
    } catch (e) {
      alert(`Could not upload: ${e.message}`);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDeleteClick = (row) => {
    setConfirmDelete(row);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { filename, id } = confirmDelete;
    try {
      await deleteUpload(id);
      setConfirmDelete(null);
      showToast(`Deleted "${filename}"`);
      load();
    } catch (e) {
      alert(`Could not delete: ${e.message}`);
      setConfirmDelete(null);
    }
  };

  // Derived, filtered list — filters are purely client-side over whatever
  // fetchUploadHistory() already returned (no extra network calls).
  const filteredUploads = useMemo(() => {
    return uploads.filter((row) => {
      if (filterType !== 'all' && row.dataType?.toLowerCase() !== filterType.toLowerCase()) return false;
      if (filterStatus !== 'all' && row.status?.toLowerCase() !== filterStatus) return false;
      if (filterFrom || filterTo) {
        const rowDate = new Date(row.date);
        if (!isNaN(rowDate)) {
          if (filterFrom && rowDate < new Date(filterFrom)) return false;
          if (filterTo && rowDate > new Date(filterTo)) return false;
        }
      }
      return true;
    });
  }, [uploads, filterType, filterStatus, filterFrom, filterTo]);

  const applyFilters = () => {
    if (draftFrom && draftTo && new Date(draftFrom) > new Date(draftTo)) {
      setDateError('"From" date must be on or before "To" date.');
      return;
    }
    setDateError('');
    setFilterType(draftType);
    setFilterStatus(draftStatus);
    setFilterFrom(draftFrom);
    setFilterTo(draftTo);
  };

  const clearFilters = () => {
    setDraftType('all');
    setDraftStatus('all');
    setDraftFrom('');
    setDraftTo('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterFrom('');
    setFilterTo('');
    setDateError('');
  };

  const cardStyle = { backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '24px', marginBottom: '24px' };

  return (
    <PageContainer title="Data Upload" subtitle="Upload and track sensor data files">
      {/* Upload zone — visible to SuperAdmin always, and to Admin only if
          SuperAdmin has granted can_upload. History/filters below remain
          visible to anyone who can reach this page; only the ability to
          upload or delete is restricted. */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: '16px' }}>Data Upload</h3>

        {!canUploadFiles ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '40px 20px',
              border: '2px dashed var(--border)',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <Lock size={24} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
              You do not have permission to upload data files.
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              You can still view upload history below.
            </p>
          </div>
        ) : (
          <>
            <label
              htmlFor="gbtac-upload-dropzone-input"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '40px 20px',
                border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border)'}`,
                borderRadius: '10px',
                background: isDragging ? 'rgba(59,130,246,0.05)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <UploadCloud size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                Drag &amp; drop .xlsx file or click to browse — max 100MB
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Supports Excel files containing sensor data.
              </p>
              <input
                id="gbtac-upload-dropzone-input"
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleInputChange}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Data type
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {DATA_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => document.getElementById('gbtac-upload-dropzone-input')?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <UploadCloud size={15} /> Upload
              </button>
            </div>
          </>
        )}
      </div>

      {/* Upload history */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.9375rem', marginBottom: '14px' }}>Upload history</h3>

        {error && (
          <p style={{ color: 'var(--status-red-text)', fontSize: '0.8125rem', marginBottom: '14px' }}>
            {error}
          </p>
        )}

        {/* Filters */}
        {dateError && (
          <p style={{ color: 'var(--status-red-text)', fontSize: '0.8125rem', marginBottom: '10px' }}>
            {dateError}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Data type
            </label>
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8125rem', background: 'var(--surface)', color: 'var(--text-primary)' }}
            >
              <option value="all">All types</option>
              {DATA_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Status
            </label>
            <select
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8125rem', background: 'var(--surface)', color: 'var(--text-primary)' }}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{statusConfig[s].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              From
            </label>
            <input
              type="date"
              value={draftFrom}
              onChange={(e) => {
                setDraftFrom(e.target.value);
                setDateError('');
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: dateError ? '1px solid var(--status-red-text)' : '1px solid var(--border)',
                fontSize: '0.8125rem',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              To
            </label>
            <input
              type="date"
              value={draftTo}
              onChange={(e) => {
                setDraftTo(e.target.value);
                setDateError('');
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: dateError ? '1px solid var(--status-red-text)' : '1px solid var(--border)',
                fontSize: '0.8125rem',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            onClick={applyFilters}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent-blue)',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>

          {(filterType !== 'all' || filterStatus !== 'all' || filterFrom || filterTo) && (
            <button
              onClick={clearFilters}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Filename</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Data type</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Uploaded by</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Rows</th>
                <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Status</th>
                {canUploadFiles && <th style={{ padding: '8px' }}></th>}
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 && !error && (
                <tr>
                  <td colSpan={canUploadFiles ? 7 : 6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No uploads yet — files you upload above will appear here.
                  </td>
                </tr>
              )}
              {uploads.length > 0 && filteredUploads.length === 0 && (
                <tr>
                  <td colSpan={canUploadFiles ? 7 : 6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No uploads match these filters.
                  </td>
                </tr>
              )}
              {filteredUploads.map((row) => {
                const status = statusConfig[row.status?.toLowerCase()] || statusConfig.processing;
                const StatusIcon = status.icon;
                const isFailed = row.status?.toLowerCase() === 'failed';

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      style={{
                        borderBottom: isFailed ? 'none' : '1px solid var(--border)',
                        borderLeft: isFailed ? '3px solid var(--status-red-text)' : '3px solid transparent',
                      }}
                    >
                      <td style={{ padding: '10px 8px', color: isFailed ? 'var(--status-red-text)' : 'var(--text-primary)', fontWeight: isFailed ? 600 : 400 }}>
                        {row.filename}
                      </td>
                      <td style={{ padding: '10px 8px' }}>{row.dataType}</td>
                      <td style={{ padding: '10px 8px' }}>{row.uploadedBy}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{row.date}</td>
                      <td style={{ padding: '10px 8px' }}>{row.rows ?? '—'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: status.bg,
                            color: status.text,
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          <StatusIcon size={12} /> {status.label}
                        </span>
                      </td>
                      {canUploadFiles && (
                        <td style={{ padding: '10px 8px' }}>
                          <button
                            onClick={() => handleDeleteClick(row)}
                            aria-label={`Delete ${row.filename}`}
                            title="Delete upload"
                            style={{ background: 'none', border: 'none', color: 'var(--status-red-text)', cursor: 'pointer', display: 'flex' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                    {isFailed && row.errorMessage && (
                      <tr style={{ borderLeft: '3px solid var(--status-red-text)', borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={canUploadFiles ? 7 : 6} style={{ padding: '4px 8px 16px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <AlertTriangle size={14} style={{ color: 'var(--status-red-text)', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '0.8125rem', color: 'var(--status-red-text)', margin: 0 }}>
                              {row.errorMessage}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal — same pattern as the rest of the app */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: '10px',
              padding: '24px',
              width: '380px',
              maxWidth: '90vw',
            }}
          >
            <h3 id="delete-modal-title" style={{ fontSize: '1rem', marginBottom: '10px' }}>
              Delete this upload?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <strong>{confirmDelete.filename}</strong> will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setConfirmDelete(null)}
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
                onClick={handleConfirmDelete}
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

      <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </PageContainer>
  );
}