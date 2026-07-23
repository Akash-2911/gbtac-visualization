/**
 * GBTAC Visualization Project
 * Sprint 5 — Ticket 3: Build Predictive Analytics — Energy Forecast
 * File:    aiPredict.js
 * Author:  Aryan
 *
 * GET /ai/predict
 * Returns historical actual energy data + 7-day ARIMA forecast
 * for the Energy dashboard forecast chart overlay.
 *
 * Forecast data comes from forecast_results table (populated by
 * forecast_energy.py — Aryan's ARIMA model, Sprint 5 Ticket 3).
 * Historical data comes from vw_daily_energy_summary view.
 *
 * Auth: Staff, Admin, SuperAdmin only (same as aiSummary and aiChat).
 * Rate limit: 10 requests per minute per user (same as other AI endpoints).
 *
 * Response shape matches what Vedant needs for the dashed forecast
 * line overlay on the Energy dashboard chart.
 */

const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");
const { checkRateLimit } = require("../../../shared/rateLimiter");
const { resolveSiteId } = require("../../../shared/siteAccess");

// Energy columns — same as aiSummary.js and aiChat.js
const ENERGY_COLUMNS = [
  "chiller_pa_kwh", "chiller_pb_kwh",
  "lighting_pa_kwh", "lighting_pb_kwh", "lighting_pc_kwh",
  "heater_big_kwh", "heater_small_kwh",
  "rinnai_hw_kwh", "sand_filter_kwh", "superpump_kwh",
  "sump_pb_kwh", "tables_csp_pb_kwh", "vertical_grow_bags_pb_kwh",
];

// Static model metadata — matches what forecast_energy.py actually used
const MODEL_NAME     = "ARIMA(0,1,0)";
const TRAINING_DAYS  = 14;
const DISCLAIMER     = (
  "Forecast based on 14 days of historical data. " +
  "Confidence intervals widen further out. " +
  "Accuracy will improve as more months of greenhouse data are uploaded."
);

app.http("aiPredict", {
  methods: ["GET"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "ai/predict",
  handler: async (request, context) => {
    try {
      // Auth: Staff and above — Viewer role blocked (same as other AI endpoints)
      const user = await checkAuth(request, ["Staff", "Admin", "SuperAdmin"]);
      checkRateLimit(user.oid, 10, 60000);

      const siteId = resolveSiteId(request);

      const pool = await getPool();
      const energySumExpr = ENERGY_COLUMNS.join(" + ");

      // ── Fetch forecast from forecast_results table ─────────────────────
      // Populated by Aryan's forecast_energy.py ARIMA model
      const forecastResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .query(`
          SELECT
            forecast_date,
            predicted_kwh,
            lower_bound,
            upper_bound
          FROM forecast_results
          WHERE site_id = @siteId
          ORDER BY forecast_date ASC
        `);

      if (forecastResult.recordset.length === 0) {
        return {
          status: 404,
          jsonBody: {
            error: "No forecast data available. Run forecast_energy.py --save to generate forecasts.",
          },
        };
      }

      // ── Fetch historical actual energy from vw_daily_energy_summary ───
      // Same view used by aiSummary.js — pull all available days
      const historicalResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .query(`
          SELECT
            reading_date,
            (${energySumExpr}) AS actual_kwh
          FROM vw_daily_energy_summary
          WHERE site_id = @siteId
            AND (${energySumExpr}) > 50   -- exclude partial days (< 50 kWh)
          ORDER BY reading_date ASC
        `);

      // ── Shape the response ─────────────────────────────────────────────
      const historical = historicalResult.recordset.map((row) => ({
        date:       row.reading_date instanceof Date
                      ? row.reading_date.toISOString().slice(0, 10)
                      : String(row.reading_date),
        actual_kwh: parseFloat(row.actual_kwh) || 0,
      }));

      const forecast = forecastResult.recordset.map((row) => ({
        date:          row.forecast_date instanceof Date
                         ? row.forecast_date.toISOString().slice(0, 10)
                         : String(row.forecast_date),
        predicted_kwh: parseFloat(row.predicted_kwh),
        lower_bound:   parseFloat(row.lower_bound),
        upper_bound:   parseFloat(row.upper_bound),
      }));

      return {
        status: 200,
        jsonBody: {
          model:         MODEL_NAME,
          training_days: TRAINING_DAYS,
          disclaimer:    DISCLAIMER,
          historical,
          forecast,
        },
      };
    } catch (err) {
      context.error("AI Predict endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch forecast data" },
      };
    }
  },
});
