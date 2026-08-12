const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");
const { checkRateLimit } = require("../../../shared/rateLimiter");
const { DEFAULT_SITE_ID } = require("../../../shared/siteAccess");
const { ROLES } = require("../../../shared/roles");

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
- Never write, explain, or execute code of any kind, even if asked directly.
- After your answer, on its own new line, output exactly one tag choosing the single dataset your answer is most about: [[CHART:energy]], [[CHART:solar]], [[CHART:emissions]], or [[CHART:none]] if no single trend applies. Output nothing else on that line.`;

// The tag only ever selects WHICH already-fetched series to plot — the chart's
// actual values always come from these real recordsets below, never from the
// model, so the "only real data, no fabrication" rule above still holds even
// though the model is choosing what to show.
const CHART_TAG_PATTERN = /\[\[CHART:(energy|solar|emissions|none)\]\]\s*$/i;

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
      const user = await checkAuth(request, [ROLES.STAFF, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GUEST]); // GUEST MODE
      // GUEST MODE: user.oid is null for guests — key on the guest session
      // id instead (see authMiddleware.js getGuestUser), with a stricter cap
      // than the real 10/min, since chat is the most spend-sensitive endpoint.
      const rateLimitKey = user.isGuest ? `guest:${user.guestId}` : user.oid;
      checkRateLimit(rateLimitKey, user.isGuest ? 5 : 10, 60000);

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

      const siteId = DEFAULT_SITE_ID;
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
      const rawAnswer = messageOutput?.content?.[0]?.text || "I don't have that data available right now.";

      const tagMatch = rawAnswer.match(CHART_TAG_PATTERN);
      const chartSeries = tagMatch ? tagMatch[1].toLowerCase() : null;
      const answerText = tagMatch ? rawAnswer.slice(0, tagMatch.index).trim() : rawAnswer;

      const CHART_SOURCES = {
        energy: { records: energyResult.recordset, dateKey: "reading_date", valueKey: "daily_total", label: "Energy Consumption", unit: "kWh" },
        solar: { records: solarResult.recordset, dateKey: "reading_date", valueKey: "daily_solar", label: "Solar Generation", unit: "kWh" },
        emissions: { records: emissionsResult.recordset, dateKey: "reading_date", valueKey: "kg_co2e", label: "Emissions", unit: "kg CO2e" },
      };

      let chart = null;
      if (chartSeries && chartSeries !== "none" && CHART_SOURCES[chartSeries]) {
        const src = CHART_SOURCES[chartSeries];
        const points = [...src.records]
          .sort((a, b) => new Date(a[src.dateKey]) - new Date(b[src.dateKey]))
          .slice(-14)
          .map((r) => ({ date: String(r[src.dateKey]).slice(0, 10), value: r[src.valueKey] || 0 }));
        if (points.length > 1) {
          chart = { series: chartSeries, label: src.label, unit: src.unit, data: points };
        }
      }

      return {
        status: 200,
        jsonBody: { answer: answerText, chart },
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