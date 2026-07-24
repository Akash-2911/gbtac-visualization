// Shared read of the singleton upload_settings row — used by uploadFile.js
// (reject oversized files before wasting a blob upload), processUpload.js
// (the actual enforcement), and the admin GET endpoint. Falls back to
// DEFAULT_MAX_UPLOAD_MB only if that row is somehow missing.
const DEFAULT_MAX_UPLOAD_MB = 100;

async function getMaxUploadMb(pool) {
  const result = await pool.request().query(
    "SELECT max_upload_mb FROM upload_settings WHERE id = 1"
  );
  return result.recordset[0]?.max_upload_mb ?? DEFAULT_MAX_UPLOAD_MB;
}

module.exports = { getMaxUploadMb, DEFAULT_MAX_UPLOAD_MB };
