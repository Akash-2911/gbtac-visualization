/**
 * GBTAC Visualization Project
 * Sprint 4 — Ticket 7: Build Admin Dashboard UI (Backend)
 * File:    updateUser.js
 * Author:  Aryan
 *
 * PATCH /admin/users/{id}
 * Updates a user's role or active status.
 * Restricted to SuperAdmin only — destructive action per 4-tier role model.
 *
 * Request body (JSON — send only fields you want to change):
 *   { "role": "Admin" }                    — change role
 *   { "active": false }                    — deactivate user
 *   { "role": "Viewer", "active": true }   — change role and reactivate
 *
 * Rules:
 *   - SuperAdmin cannot demote or deactivate themselves
 *   - Role must be one of: SuperAdmin, Admin, Staff, Viewer
 *   - Cannot set role to SuperAdmin via API (must be done directly in DB by Akash)
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

const ALLOWED_ROLES = ["Admin", "Staff", "Viewer"];  // SuperAdmin not settable via API

app.http("updateUser", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  route: "dashboard/users/{id}",
  handler: async (request, context) => {
    try {
      // SuperAdmin only — matches Akash's 4-tier role model for destructive actions
      const caller = await checkAuth(request, ["SuperAdmin"]);

      // Parse target user ID from route
      const targetUserId = parseInt(request.params.id);
      if (!targetUserId || isNaN(targetUserId)) {
        return {
          status: 400,
          jsonBody: { error: "Invalid user ID. Must be a number." },
        };
      }

      // Parse request body
      let body;
      try {
        body = await request.json();
      } catch {
        return {
          status: 400,
          jsonBody: { error: "Invalid JSON body." },
        };
      }

      const { role, active } = body;

      // Must provide at least one field to update
      if (role === undefined && active === undefined) {
        return {
          status: 400,
          jsonBody: { error: "Must provide at least one field to update: 'role' or 'active'." },
        };
      }

      // Validate role value if provided
      if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
        return {
          status: 400,
          jsonBody: {
            error: `Invalid role '${role}'. Must be one of: ${ALLOWED_ROLES.join(", ")}.`,
            note: "SuperAdmin role cannot be assigned via API.",
          },
        };
      }

      const pool = await sql.connect(sqlConfig);

      // Confirm target user exists
      const checkResult = await pool.request()
        .input("userId", sql.Int, targetUserId)
        .query(`
          SELECT user_id, display_name, email, role, active, entra_oid
          FROM users WHERE user_id = @userId
        `);

      if (checkResult.recordset.length === 0) {
        return {
          status: 404,
          jsonBody: { error: `User ${targetUserId} not found.` },
        };
      }

      const targetUser = checkResult.recordset[0];

      // Prevent SuperAdmin from modifying themselves
      const callerOid = caller.oid || caller.sub;
      if (targetUser.entra_oid === callerOid) {
        return {
          status: 403,
          jsonBody: { error: "You cannot modify your own account." },
        };
      }

      // Build UPDATE query dynamically — only update provided fields
      const updateReq = pool.request().input("userId", sql.Int, targetUserId);
      const setClauses = [];

      if (role !== undefined) {
        updateReq.input("role", sql.NVarChar, role);
        setClauses.push("role = @role");
      }

      if (active !== undefined) {
        updateReq.input("active", sql.Bit, active ? 1 : 0);
        setClauses.push("active = @active");
      }

      await updateReq.query(`
        UPDATE users
        SET ${setClauses.join(", ")}
        WHERE user_id = @userId
      `);

      // Log the change to Application Insights
      context.log(
        `SuperAdmin ${caller.preferred_username || callerOid} updated user ${targetUserId} ` +
        `(${targetUser.email}): ${JSON.stringify({ role, active })}`
      );

      // Return updated user record
      const updated = await pool.request()
        .input("userId", sql.Int, targetUserId)
        .query(`
          SELECT user_id, display_name, email, role, active, last_login, created_at
          FROM users WHERE user_id = @userId
        `);

      return {
        status: 200,
        jsonBody: {
          message: `User ${targetUser.display_name} updated successfully.`,
          user:    updated.recordset[0],
          changes: { role, active },
          updatedBy: caller.preferred_username || callerOid,
        },
      };
    } catch (err) {
      context.error("updateUser failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to update user" },
      };
    }
  },
});
