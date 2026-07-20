/**
 * GBTAC Visualization Project
 * Sprint 4 — Ticket 7: Build Admin Dashboard UI (Backend)
 * File:    getUsers.js
 * Author:  Aryan
 *
 * GET /admin/users
 * Returns full user list for the admin panel user management table.
 * Includes display name, email, role, active status, last login.
 *
 * Query params:
 *   ?role=Admin      — filter by role (optional)
 *   ?active=true     — filter by active status (optional)
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

app.http("getUsers", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "dashboardUsers",
  handler: async (request, context) => {
    try {
      // Only Admin and SuperAdmin can view user list
      await checkAuth(request, ["Admin", "SuperAdmin"]);

      // Parse optional filters
      const roleFilter   = request.query.get("role")   || null;
      const activeFilter = request.query.get("active") || null;

      const pool = await sql.connect(sqlConfig);
      const req  = pool.request();

      // Build WHERE clause dynamically
      let where = "WHERE 1=1";
      if (roleFilter) {
        req.input("role", sql.NVarChar, roleFilter);
        where += " AND role = @role";
      }
      if (activeFilter !== null) {
        const isActive = activeFilter === "true" ? 1 : 0;
        req.input("active", sql.Bit, isActive);
        where += " AND active = @active";
      }

      const result = await req.query(`
        SELECT
          user_id,
          display_name,
          email,
          role,
          active,
          last_login,
          created_at
        FROM users
        ${where}
        ORDER BY
          CASE role
            WHEN 'SuperAdmin' THEN 1
            WHEN 'Admin'      THEN 2
            WHEN 'Staff'      THEN 3
            WHEN 'Viewer'     THEN 4
            ELSE 5
          END,
          display_name ASC
      `);

      return {
        status: 200,
        jsonBody: {
          data:  result.recordset,
          total: result.recordset.length,
        },
      };
    } catch (err) {
      context.error("getUsers failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch users" },
      };
    }
  },
});
