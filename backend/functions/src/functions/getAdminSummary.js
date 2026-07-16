/**
 * GBTAC Visualization Project
 * Sprint 4 — Ticket 7: Build Admin Dashboard UI (Backend)
 * File:    getAdminSummary.js
 * Author:  Aryan
 *
 * GET /admin/summary
 * Returns high-level summary for the admin dashboard:
 *   - Last upload date per dataset type
 *   - Row counts per readings table
 *   - Total users and breakdown by role
 *   - Recent failed uploads (last 5)
 *
 * Restricted to Admin and SuperAdmin only.
 */

const { app } = require("@azure/functions");
const { checkAuth } = require("../../shared/authMiddleware");
const sql = require("mssql");

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  authentication: { type: "azure-active-directory-default" },
  options: { encrypt: true, trustServerCertificate: false },
};

app.http("getAdminSummary", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "dashboard/summary", 
  handler: async (request, context) => {
    try {
      // Only Admin and SuperAdmin can view admin summary
      await checkAuth(request, ["Admin", "SuperAdmin"]);

      const pool = await sql.connect(sqlConfig);

      // ── Last upload date + row count per dataset type ────────
      const uploadSummary = await pool.request().query(`
        SELECT
          data_type,
          MAX(uploaded_at)  AS last_upload_at,
          MAX(processed_at) AS last_processed_at,
          SUM(CASE WHEN status = 'complete' THEN row_count ELSE 0 END) AS total_rows_loaded,
          COUNT(*)          AS total_uploads,
          SUM(CASE WHEN status = 'failed'   THEN 1 ELSE 0 END) AS failed_uploads,
          SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS successful_uploads
        FROM upload_batches
        GROUP BY data_type
      `);

      // ── Row counts per readings table ────────────────────────
      const rowCounts = await pool.request().query(`
        SELECT
          'greenhouse' AS dataset,
          COUNT(*)     AS total_rows,
          SUM(CASE WHEN data_quality = 'ok'          THEN 1 ELSE 0 END) AS ok_rows,
          SUM(CASE WHEN data_quality = 'negative_kw' THEN 1 ELSE 0 END) AS flagged_rows,
          MIN(timestamp_utc) AS earliest_reading,
          MAX(timestamp_utc) AS latest_reading
        FROM greenhouse_readings WHERE site_id = 1
        UNION ALL
        SELECT
          'solar',
          COUNT(*),
          SUM(CASE WHEN data_quality = 'ok'    THEN 1 ELSE 0 END),
          SUM(CASE WHEN data_quality = 'alarm' THEN 1 ELSE 0 END),
          MIN(timestamp_utc),
          MAX(timestamp_utc)
        FROM solar_readings WHERE site_id = 1
        UNION ALL
        SELECT
          'weather',
          COUNT(*),
          SUM(CASE WHEN data_quality = 'ok' THEN 1 ELSE 0 END),
          0,
          MIN(timestamp_utc),
          MAX(timestamp_utc)
        FROM weather_readings WHERE site_id = 1
      `);

      // ── User counts by role ──────────────────────────────────
      const userSummary = await pool.request().query(`
        SELECT
          COUNT(*)  AS total_users,
          SUM(CASE WHEN role = 'SuperAdmin' AND active = 1 THEN 1 ELSE 0 END) AS super_admins,
          SUM(CASE WHEN role = 'Admin'      AND active = 1 THEN 1 ELSE 0 END) AS admins,
          SUM(CASE WHEN role = 'Staff'      AND active = 1 THEN 1 ELSE 0 END) AS staff,
          SUM(CASE WHEN role = 'Viewer'     AND active = 1 THEN 1 ELSE 0 END) AS viewers,
          SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) AS inactive_users
        FROM users
      `);

      // ── Last 5 failed uploads ────────────────────────────────
      const recentFailures = await pool.request().query(`
        SELECT TOP 5
          ub.batch_id,
          ub.file_name,
          ub.data_type,
          ub.uploaded_at,
          ub.error_message,
          u.display_name AS uploaded_by
        FROM upload_batches ub
        LEFT JOIN users u ON ub.uploaded_by_user_id = u.user_id
        WHERE ub.status = 'failed'
        ORDER BY ub.uploaded_at DESC
      `);

      return {
        status: 200,
        jsonBody: {
          uploadSummary:  uploadSummary.recordset,
          rowCounts:      rowCounts.recordset,
          users:          userSummary.recordset[0],
          recentFailures: recentFailures.recordset,
          generatedAt:    new Date().toISOString(),
        },
      };
    } catch (err) {
      context.error("getAdminSummary failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch admin summary" },
      };
    }
  },
});
