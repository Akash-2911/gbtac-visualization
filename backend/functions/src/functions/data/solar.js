const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");

app.http("solar", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "solar",
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
          SELECT reading_date, collector1_kwh, collector2_kwh,
                 avg_sunlight_wm2, peak_sunlight_wm2, reading_count
          FROM vw_daily_solar_summary
          WHERE site_id = @siteId
            AND reading_date BETWEEN @fromDate AND @toDate
          ORDER BY reading_date ASC
        `);

      const dailyRecords = result.recordset.map((r) => ({
        date: r.reading_date,
        collector1Kwh: r.collector1_kwh,
        collector2Kwh: r.collector2_kwh,
        totalKwh: (r.collector1_kwh || 0) + (r.collector2_kwh || 0),
        avgSunlightWm2: r.avg_sunlight_wm2,
        peakSunlightWm2: r.peak_sunlight_wm2,
      }));

      const totalKwh = dailyRecords.reduce((sum, r) => sum + r.totalKwh, 0);

      return {
        status: 200,
        jsonBody: { siteId, from, to, totalKwh, dailyRecords },
      };
    } catch (err) {
      context.error("Solar endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch solar data" },
      };
    }
  },
});