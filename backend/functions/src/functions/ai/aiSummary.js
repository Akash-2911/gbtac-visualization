const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");
const { checkRateLimit } = require("../../../shared/rateLimiter");

const SYSTEM_PROMPT = `You are a data insight assistant for the GBTAC energy dashboard.

Rules:
- Only use the numbers provided to you. Never estimate, guess, or add outside information.
- Write exactly 1 sentence, plain English, no jargon.
- If a number is missing or looks wrong, say "Insight unavailable" instead of guessing.
- Do not give opinions, predictions, or recommendations, only describe what happened.
- Do not mention that you are an AI or explain your reasoning.
- Only discuss GBTAC energy, solar, emissions, greenhouse, or weather data.
- If asked anything unrelated (code, general knowledge, other topics), reply exactly: "I can only help with questions about your GBTAC dashboard data."
- Never write, explain, or execute code of any kind, even if asked directly or indirectly.`;

const ENERGY_COLUMNS = [
  "chiller_pa_kwh", "chiller_pb_kwh",
  "lighting_pa_kwh", "lighting_pb_kwh", "lighting_pc_kwh",
  "heater_big_kwh", "heater_small_kwh",
  "rinnai_hw_kwh", "sand_filter_kwh", "superpump_kwh",
  "sump_pb_kwh", "tables_csp_pb_kwh", "vertical_grow_bags_pb_kwh",
];

app.http("aiSummary", {
  methods: ["GET"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "ai/summary",
  handler: async (request, context) => {
    try {
      const user = await checkAuth(request, ["Staff", "Admin", "SuperAdmin"]);
      checkRateLimit(user.oid, 10, 60000);

      const siteId = request.query.get("site_id") || "1";
      const from = request.query.get("from") || "2000-01-01";
      const to = request.query.get("to") || "2100-01-01";

      const pool = await getPool();
      const energySumExpr = ENERGY_COLUMNS.join(" + ");

      const energyResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .input("fromDate", sql.Date, from)
        .input("toDate", sql.Date, to)
        .query(`
          SELECT SUM(daily_total) AS total_energy_kwh
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

      const totalConsumed = energyResult.recordset[0].total_energy_kwh || 0;
      const totalGenerated = solarResult.recordset[0].total_solar_kwh || 0;
      const netBalance = totalGenerated >= totalConsumed ? "Positive" : "Negative";

      const dataForAi = `Total Consumed: ${totalConsumed} kWh, Total Generated: ${totalGenerated} kWh, Net Balance: ${netBalance}, Period: ${from} to ${to}`;

      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const key = process.env.AZURE_OPENAI_KEY;
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

      const aiResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: deployment,
          instructions: SYSTEM_PROMPT,
          input: dataForAi,
        }),
      });

      const aiData = await aiResponse.json();

      if (!aiResponse.ok || aiData.error) {
        throw new Error(aiData.error?.message || "AI request failed");
      }

      const messageOutput = aiData.output?.find((o) => o.type === "message");
      const insightText = messageOutput?.content?.[0]?.text || "Insight unavailable";

      return {
        status: 200,
        jsonBody: { insight: insightText },
      };
    } catch (err) {
      context.error("AI Summary endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to generate insight" },
      };
    }
  },
});