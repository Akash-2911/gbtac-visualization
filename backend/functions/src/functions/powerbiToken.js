/**
 * GBTAC Visualization Project
 * Sprint 4 — Ticket 5: JWT Middleware
 * File:    powerbiToken.js
 * Author:  Akash (original) — JWT auth added by Aryan
 *
 * GET /powerbi/token?reportId=<id>
 * Returns a Power BI embed token for a specific report.
 * All authenticated roles can access dashboards (Admin, SuperAdmin, Staff, Viewer).
 * No anonymous access — every caller must have a valid JWT.
 */

const { app } = require("@azure/functions");
const axios = require("axios");
const { getPowerBiAccessToken } = require("../../shared/powerbiAuth");
const { checkAuth } = require("../../shared/authMiddleware");

app.http("powerbiToken", {
  methods: ["GET"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "powerbi/token",
  handler: async (request, context) => {
    try {
      // All authenticated roles can get embed tokens — dashboards are read-only for everyone
      await checkAuth(request, ["SuperAdmin", "Admin", "Staff", "Viewer"]);

      const reportId   = request.query.get("reportId");
      const workspaceId = process.env.PBI_WORKSPACE_ID;

      if (!reportId) {
        return {
          status: 400,
          jsonBody: { error: "Missing required query param: reportId" },
        };
      }

      // Step 1: get AAD token for our service principal
      const aadToken = await getPowerBiAccessToken();

      // Step 2: get report details from Power BI
      const reportRes = await axios.get(
        `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`,
        { headers: { Authorization: `Bearer ${aadToken}` } }
      );
      const { embedUrl, datasetId } = reportRes.data;

      // Step 3: generate the embed token
      const embedTokenRes = await axios.post(
        `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
        { accessLevel: "View" },
        { headers: { Authorization: `Bearer ${aadToken}` } }
      );

      return {
        status: 200,
        jsonBody: {
          embedToken:  embedTokenRes.data.token,
          embedUrl:    embedUrl,
          reportId:    reportId,
          datasetId:   datasetId,
          expiration:  embedTokenRes.data.expiration,
        },
      };
    } catch (err) {
      context.error("Power BI token generation failed:", {
        message: err.message,
        status: err.status,
        stack: err.stack,
      });
      return {
        status: err.status || 500,
        jsonBody: {
          error: "Failed to generate embed token",
          details: err.message,
          // Temporary debug info — remove before production
          debug: {
            status: err.status,
            stack: err.stack,
          },
        },
      };
    }
  },
});
