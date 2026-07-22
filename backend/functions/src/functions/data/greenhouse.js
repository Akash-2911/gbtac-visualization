const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");

const ENERGY_COLUMNS = [
  "chiller_pa_kwh", "chiller_pb_kwh",
  "lighting_pa_kwh", "lighting_pb_kwh", "lighting_pc_kwh",
  "heater_big_kwh", "heater_small_kwh",
  "rinnai_hw_kwh", "sand_filter_kwh", "superpump_kwh",
  "sump_pb_kwh", "tables_csp_pb_kwh", "vertical_grow_bags_pb_kwh",
];

app.http("greenhouse", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "greenhouse",
  handler: async (request, context) => {
    try {
      const user = await checkAuth(request, ["Viewer", "Staff", "Admin", "SuperAdmin"]);

      const siteId = request.query.get("site_id") || "1";
      const from = request.query.get("from") || "2000-01-01";
      const to = request.query.get("to") || "2100-01-01";

      const pool = await getPool();

      const result = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .input("fromDate", sql.Date, from)
        .input("toDate", sql.Date, to)
        .query(`
          SELECT reading_date, ${ENERGY_COLUMNS.join(", ")}
          FROM vw_daily_energy_summary
          WHERE site_id = @siteId
            AND reading_date BETWEEN @fromDate AND @toDate
          ORDER BY reading_date ASC
        `);

      const dailyRecords = result.recordset.map((r) => {
        const totalKwh = ENERGY_COLUMNS.reduce((sum, col) => sum + (r[col] || 0), 0);
        return {
          date: r.reading_date,
          totalKwh,
          breakdown: Object.fromEntries(
            ENERGY_COLUMNS.map((col) => [col, r[col]])
          ),
        };
      });

      const totalKwh = dailyRecords.reduce((sum, r) => sum + r.totalKwh, 0);

      return {
        status: 200,
        jsonBody: { siteId, from, to, totalKwh, dailyRecords },
      };
    } catch (err) {
      context.error("Greenhouse endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch greenhouse data" },
      };
    }
  },
});