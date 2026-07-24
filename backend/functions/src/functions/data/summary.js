const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");
const { resolveSiteId } = require("../../../shared/siteAccess");
const { ROLES } = require("../../../shared/roles");

// Appliance columns that make up "Total Energy Used" - mains_* is
// intentionally excluded (unreliable sensor, confirmed with client).
const ENERGY_COLUMNS = [
  "chiller_pa_kwh", "chiller_pb_kwh",
  "lighting_pa_kwh", "lighting_pb_kwh", "lighting_pc_kwh",
  "heater_big_kwh", "heater_small_kwh",
  "rinnai_hw_kwh", "sand_filter_kwh", "superpump_kwh",
  "sump_pb_kwh", "tables_csp_pb_kwh", "vertical_grow_bags_pb_kwh",
];

app.http("summary", {
  methods: ["GET"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "summary",
  handler: async (request, context) => {
    try {
      const user = await checkAuth(request, [ROLES.VIEWER, ROLES.STAFF, ROLES.ADMIN, ROLES.SUPER_ADMIN]);

      const siteId = resolveSiteId(request);
      const from = request.query.get("from") || "2000-01-01";
      const to = request.query.get("to") || "2100-01-01";

      const pool = await getPool();

      const energySumExpr = ENERGY_COLUMNS.join(" + ");

      // Total energy used + peak single-day value (matches Power BI's
      // "Peak Demand kW = MAXX(vw_daily_energy_summary, [Total Energy kWh])")
      const energyResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .input("fromDate", sql.Date, from)
        .input("toDate", sql.Date, to)
        .query(`
          SELECT
            SUM(daily_total) AS total_energy_kwh,
            MAX(daily_total) AS peak_demand_kw
          FROM (
            SELECT (${energySumExpr}) AS daily_total
            FROM vw_daily_energy_summary
            WHERE site_id = @siteId
              AND reading_date BETWEEN @fromDate AND @toDate
          ) t
        `);

      const solarResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .input("fromDate", sql.Date, from)
        .input("toDate", sql.Date, to)
        .query(`
          SELECT SUM(collector1_kwh + collector2_kwh) AS total_solar_kwh
          FROM vw_daily_solar_summary
          WHERE site_id = @siteId
            AND reading_date BETWEEN @fromDate AND @toDate
        `);

      const emissionsResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .input("fromDate", sql.Date, from)
        .input("toDate", sql.Date, to)
        .query(`
          SELECT SUM(kg_co2e) AS total_co2_kg
          FROM emission_records
          WHERE site_id = @siteId
            AND reading_date BETWEEN @fromDate AND @toDate
        `);

      const energy = energyResult.recordset[0];
      const solar = solarResult.recordset[0];
      const emissions = emissionsResult.recordset[0];

      return {
        status: 200,
        jsonBody: {
          siteId,
          from,
          to,
          totalEnergyUsedKwh: energy.total_energy_kwh || 0,
          peakDemandKw: energy.peak_demand_kw || 0,
          totalSolarGeneratedKwh: solar.total_solar_kwh || 0,
          totalCo2EmissionsKg: emissions.total_co2_kg || 0,
        },
      };
    } catch (err) {
      context.error("Summary endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch summary data" },
      };
    }
  },
});