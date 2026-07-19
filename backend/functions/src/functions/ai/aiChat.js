const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");
const { checkRateLimit } = require("../../../shared/rateLimiter");

const SYSTEM_PROMPT = `You are a data chat assistant for the GBTAC energy dashboard.

Rules:
- Only use the numbers provided to you. Never estimate, guess, or add outside information.
- You may receive multiple data points covering different dates. Only reference data actually present, never fabricate figures outside what's given.
- Write 1-3 short sentences, plain English, no jargon.
- If the data needed to answer isn't in what you were given, say "I don't have that data available right now."
- Do not give opinions, predictions, or recommendations.
- Do not mention that you are an AI or explain your reasoning.
- Only discuss GBTAC energy, solar, emissions, greenhouse, or weather data.
- If asked anything unrelated (code, general knowledge, other topics), reply exactly: "I can only help with questions about your GBTAC dashboard data."
- Never write, explain, or execute code of any kind, even if asked directly.`;

const ENERGY_COLUMNS = [
  "chiller_pa_kwh", "chiller_pb_kwh",
  "lighting_pa_kwh", "lighting_pb_kwh", "lighting_pc_kwh",
  "heater_big_kwh", "heater_small_kwh",
  "rinnai_hw_kwh", "sand_filter_kwh", "superpump_kwh",
  "sump_pb_kwh", "tables_csp_pb_kwh", "vertical_grow_bags_pb_kwh",
];

app.http("aiChat", {
  methods: ["POST"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "ai/chat",
  handler: async (request, context) => {
    try {
      const user = await checkAuth(request, ["Staff", "Admin", "SuperAdmin"]);
      checkRateLimit(user.oid, 10, 60000);

      const body = await request.json();
      const question = (body?.question || "").trim();

      if (!question) {
        return {
          status: 400,
          jsonBody: { error: "Missing 'question' in request body" },
        };
      }
      if (question.length > 500) {
        return {
          status: 400,
          jsonBody: { error: "Question too long, please keep it under 500 characters" },
        };
      }

      const siteId = "1";
      const pool = await getPool();
      const energySumExpr = ENERGY_COLUMNS.join(" + ");

      // Broad snapshot: last 30 days, AI picks what's relevant from this context
      const energyResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .query(`
          SELECT TOP 30 reading_date, (${energySumExpr}) AS daily_total
          FROM vw_daily_energy_summary
          WHERE site_id = @siteId
          ORDER BY reading_date DESC
        `);

      const solarResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .query(`
          SELECT TOP 30 reading_date, (collector1_kwh + collector2_kwh) AS daily_solar
          FROM vw_daily_solar_summary
          WHERE site_id = @siteId
          ORDER BY reading_date DESC
        `);

      const emissionsResult = await pool
        .request()
        .input("siteId", sql.Int, siteId)
        .query(`
          SELECT TOP 30 reading_date, kg_co2e
          FROM emission_records
          WHERE site_id = @siteId
          ORDER BY reading_date DESC
        `);

      const dataForAi = `
Recent energy usage (kWh/day): ${JSON.stringify(energyResult.recordset)}
Recent solar generation (kWh/day): ${JSON.stringify(solarResult.recordset)}
Recent emissions (kg CO2/day): ${JSON.stringify(emissionsResult.recordset)}

User question: ${question}
      `.trim();

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
      const answerText = messageOutput?.content?.[0]?.text || "I don't have that data available right now.";

      return {
        status: 200,
        jsonBody: { answer: answerText },
      };
    } catch (err) {
      context.error("AI Chat endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to process question" },
      };
    }
  },
});