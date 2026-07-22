const { app } = require("@azure/functions");
const { getPool, sql } = require("../../shared/sqlClient");
const { checkAuth } = require("../../shared/authMiddleware");

app.http("weather", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "weather",
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
          SELECT reading_date, avg_temp_c, min_temp_c, max_temp_c,
                 avg_humidity_pct, total_precip_mm
          FROM vw_daily_weather_summary
          WHERE site_id = @siteId
            AND reading_date BETWEEN @fromDate AND @toDate
          ORDER BY reading_date ASC
        `);

      const dailyRecords = result.recordset.map((r) => ({
        date: r.reading_date,
        avgTempC: r.avg_temp_c,
        minTempC: r.min_temp_c,
        maxTempC: r.max_temp_c,
        avgHumidityPct: r.avg_humidity_pct,
        totalPrecipMm: r.total_precip_mm,
      }));

      return {
        status: 200,
        jsonBody: { siteId, from, to, dailyRecords },
      };
    } catch (err) {
      context.error("Weather endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch weather data" },
      };
    }
  },
});