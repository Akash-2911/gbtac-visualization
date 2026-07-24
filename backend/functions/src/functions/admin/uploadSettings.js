/**
 * GBTAC Visualization Project
 * File:    uploadSettings.js
 *
 * GET   /dashboard/upload-settings — current max upload size (MB). Any
 *       authenticated + approved user can read it (Upload.jsx needs it to
 *       validate/display the real limit regardless of role).
 * PATCH /dashboard/upload-settings — change the max upload size (MB).
 *       SuperAdmin only, matches the 4-tier role model for destructive/
 *       config-changing actions (same pattern as updateUser.js).
 *
 * Backs the singleton upload_settings row (db/migrations/002_add_upload_settings.sql)
 * so the limit is no longer a hardcoded constant duplicated across
 * processUpload.js, uploadFile.js, and the frontend.
 */

const { app } = require("@azure/functions");
const { checkAuth } = require("../../../shared/authMiddleware");
const { ROLES } = require("../../../shared/roles");
const sql = require("mssql");

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  authentication: { type: "azure-active-directory-default" },
  options: { encrypt: true, trustServerCertificate: false },
};

const MIN_MB = 1;
const MAX_MB_CEILING = 1000; // matches CHK_upload_settings_max_mb in the migration

app.http("uploadSettings", {
  methods: ["GET", "PATCH"],
  authLevel: "anonymous",
  route: "dashboard/upload-settings",
  handler: async (request, context) => {
    try {
      const pool = await sql.connect(sqlConfig);

      if (request.method === "GET") {
        await checkAuth(request, [ROLES.VIEWER, ROLES.STAFF, ROLES.ADMIN, ROLES.SUPER_ADMIN]);

        const result = await pool.request().query(
          "SELECT max_upload_mb, updated_at FROM upload_settings WHERE id = 1"
        );

        return {
          status: 200,
          jsonBody: {
            maxUploadMb: result.recordset[0]?.max_upload_mb ?? 100,
            updatedAt: result.recordset[0]?.updated_at ?? null,
          },
        };
      }

      // PATCH — SuperAdmin only
      const caller = await checkAuth(request, [ROLES.SUPER_ADMIN]);

      let body;
      try {
        body = await request.json();
      } catch {
        return { status: 400, jsonBody: { error: "Invalid JSON body." } };
      }

      const maxUploadMb = Number(body?.maxUploadMb);
      if (!Number.isInteger(maxUploadMb) || maxUploadMb < MIN_MB || maxUploadMb > MAX_MB_CEILING) {
        return {
          status: 400,
          jsonBody: { error: `maxUploadMb must be a whole number between ${MIN_MB} and ${MAX_MB_CEILING}.` },
        };
      }

      const callerResult = await pool.request()
        .input("oid", sql.NVarChar, caller.oid || caller.sub)
        .query("SELECT user_id FROM users WHERE entra_oid = @oid");
      const callerUserId = callerResult.recordset[0]?.user_id ?? null;

      await pool.request()
        .input("maxUploadMb", sql.Int, maxUploadMb)
        .input("updatedByUserId", sql.Int, callerUserId)
        .query(`
          UPDATE upload_settings
          SET max_upload_mb = @maxUploadMb,
              updated_at = GETUTCDATE(),
              updated_by_user_id = @updatedByUserId
          WHERE id = 1
        `);

      context.log(
        `SuperAdmin ${caller.preferred_username || caller.oid} set upload limit to ${maxUploadMb} MB`
      );

      return {
        status: 200,
        jsonBody: { maxUploadMb, message: `Upload limit set to ${maxUploadMb} MB.` },
      };
    } catch (err) {
      context.error("uploadSettings failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to process upload settings" },
      };
    }
  },
});
