/**
 * GBTAC Visualization Project
 * Sprint 4 — Ticket 5: JWT Middleware
 * File:    getUploadHistory.js
 * Author:  Aryan
 *
 * GET /admin/uploads
 * Returns paginated upload history for the admin panel.
 * Restricted to Admin and SuperAdmin — staff and viewers cannot see upload history.
 *
 * Query params:
 *   ?page=1          — page number (default 1)
 *   ?limit=20        — rows per page (default 20, max 100)
 *   ?status=complete — filter by status (optional)
 *   ?type=greenhouse — filter by data_type (optional)
 */

const { app } = require("@azure/functions");
const { checkAuth } = require("../../../shared/authMiddleware");
const { ROLES } = require("../../../shared/roles");
const sql = require("mssql");

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  authentication: {
    type: "azure-active-directory-default",
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

app.http("getUploadHistory", {
  methods: ["GET"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "uploads/history",
  handler: async (request, context) => {
    try {
      // Step 1: verify caller is Admin or SuperAdmin
      await checkAuth(request, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);

      // Step 2: parse query params
      const page   = Math.max(1, parseInt(request.query.get("page")  || "1"));
      const limit  = Math.min(100, Math.max(1, parseInt(request.query.get("limit") || "20")));
      const status = request.query.get("status") || null;
      const type   = request.query.get("type")   || null;
      const offset = (page - 1) * limit;

      // Step 3: connect and query
      const pool = await sql.connect(sqlConfig);
      const req  = pool.request()
        .input("limit",  sql.Int, limit)
        .input("offset", sql.Int, offset);

      // Build WHERE clause dynamically
      let where = "WHERE 1=1";
      if (status) {
        req.input("status", sql.NVarChar, status);
        where += " AND ub.status = @status";
      }
      if (type) {
        req.input("type", sql.NVarChar, type);
        where += " AND ub.data_type = @type";
      }

      const result = await req.query(`
        SELECT
          ub.batch_id,
          ub.file_name,
          ub.data_type,
          ub.row_count,
          ub.status,
          ub.uploaded_at,
          ub.processed_at,
          ub.error_message,
          u.display_name  AS uploaded_by_name,
          u.email         AS uploaded_by_email
        FROM upload_batches ub
        LEFT JOIN users u ON ub.uploaded_by_user_id = u.user_id
        ${where}
        ORDER BY ub.uploaded_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

      // Step 4: get total count for pagination
      const countReq = pool.request();
      if (status) countReq.input("status", sql.NVarChar, status);
      if (type)   countReq.input("type",   sql.NVarChar, type);

      const countResult = await countReq.query(`
        SELECT COUNT(*) AS total FROM upload_batches ub ${where}
      `);
      const total = countResult.recordset[0].total;

      return {
        status: 200,
        jsonBody: {
          data:       result.recordset,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (err) {
      context.error("getUploadHistory failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch upload history" },
      };
    }
  },
});
