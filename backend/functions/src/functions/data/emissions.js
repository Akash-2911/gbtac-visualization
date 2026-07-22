const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");

app.http("emissions", {
  methods: ["GET"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "emissions",
  handler: async (request, context) => {
    try {
      const user = await checkAuth(request, ["Viewer", "Staff", "Admin", "SuperAdmin"]);

      const siteId = request.query.get("site_id") || "1";
      const from = request.query.get("from") || "2000-01-01";
      const to = request.query.get("to") || "2100-01-01";

      const pool = await getPool();

      const totalsResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .input("fromDate", sql.Date, from)
        .input("toDate", sql.Date, to)
        .query(`
          SELECT
            SUM(kg_co2e) AS total_co2_kg,
            SUM(total_kwh) AS total_energy_kwh
          FROM emission_records
          WHERE site_id = @siteId
            AND reading_date BETWEEN @fromDate AND @toDate
        `);

      const dailyResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .input("fromDate", sql.Date, from)
        .input("toDate", sql.Date, to)
        .query(`
          SELECT reading_date, total_kwh, kg_co2e
          FROM emission_records
          WHERE site_id = @siteId
            AND reading_date BETWEEN @fromDate AND @toDate
          ORDER BY reading_date ASC
        `);

      const totals = totalsResult.recordset[0];

      return {
        status: 200,
        jsonBody: {
          siteId,
          from,
          to,
          totalCo2Kg: totals.total_co2_kg || 0,
          totalEnergyKwh: totals.total_energy_kwh || 0,
          dailyRecords: dailyResult.recordset.map((r) => ({
            date: r.reading_date,
            totalKwh: r.total_kwh,
            kgCo2e: r.kg_co2e,
          })),
        },
      };
    } catch (err) {
      context.error("Emissions endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch emissions data" },
      };
    }
  },
});