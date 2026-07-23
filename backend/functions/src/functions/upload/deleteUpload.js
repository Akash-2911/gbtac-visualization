/**
 * GBTAC Visualization Project
 * Sprint 4 — Ticket 5: JWT Middleware
 * File:    deleteUpload.js
 * Author:  Aryan
 *
 * DELETE /upload/{id}
 * Deletes an upload batch record and all associated data rows.
 * Restricted to SuperAdmin only — destructive action per Akash's 4-tier role model.
 *
 * Uses authMiddleware.js built by Akash — no token logic here, just import + call.
 */

const { app } = require("@azure/functions");
const { checkAuth } = require("../../../shared/authMiddleware");
const { ROLES } = require("../../../shared/roles");
const sql = require("mssql");

// SQL connection config — reads from environment variables set in Azure Function App
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

app.http("deleteUpload", {
  methods: ["DELETE"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "upload/{id}",
  handler: async (request, context) => {
    try {
      // Step 1: verify caller is SuperAdmin — only role allowed to delete data
      const user = await checkAuth(request, [ROLES.SUPER_ADMIN]);

      // Step 2: get the batch ID from the route
      const batchId = parseInt(request.params.id);
      if (!batchId || isNaN(batchId)) {
        return {
          status: 400,
          jsonBody: { error: "Invalid batch ID. Must be a number." },
        };
      }

      // Step 3: connect to Azure SQL
      const pool = await sql.connect(sqlConfig);

      // Step 4: confirm the batch exists before deleting
      const checkResult = await pool
        .request()
        .input("batchId", sql.Int, batchId)
        .query(
          "SELECT batch_id, file_name, data_type, row_count, status FROM upload_batches WHERE batch_id = @batchId"
        );

      if (checkResult.recordset.length === 0) {
        return {
          status: 404,
          jsonBody: { error: `Upload batch ${batchId} not found.` },
        };
      }

      const batch = checkResult.recordset[0];

      // Step 5: delete data rows + the upload_batches record atomically, so a
      // crash between the two steps can't leave the audit row out of sync with
      // whether the data actually still exists.
      const dataTable =
        batch.data_type === "greenhouse"
          ? "greenhouse_readings"
          : batch.data_type === "solar"
          ? "solar_readings"
          : batch.data_type === "weather"
          ? "weather_readings"
          : null;

      let rowsDeleted = 0;
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        if (dataTable) {
          const deleteRows = await transaction
            .request()
            .input("batchId", sql.Int, batchId)
            .query(`DELETE FROM ${dataTable} WHERE upload_batch_id = @batchId`);
          rowsDeleted = deleteRows.rowsAffected[0];
        }

        await transaction
          .request()
          .input("batchId", sql.Int, batchId)
          .query("DELETE FROM upload_batches WHERE batch_id = @batchId");

        await transaction.commit();
      } catch (txErr) {
        await transaction.rollback();
        throw txErr;
      }

      // Step 6: log who deleted what (context.log goes to Application Insights)
      context.log(
        `SuperAdmin ${user.preferred_username || user.oid} deleted batch ${batchId} ` +
        `(${batch.file_name}, ${batch.data_type}, ${rowsDeleted} rows removed)`
      );

      return {
        status: 200,
        jsonBody: {
          message: `Upload batch ${batchId} deleted successfully.`,
          batchId: batchId,
          fileName: batch.file_name,
          dataType: batch.data_type,
          rowsDeleted: rowsDeleted,
          deletedBy: user.preferred_username || user.oid,
        },
      };
    } catch (err) {
      context.error("deleteUpload failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Delete failed" },
      };
    }
  },
});
