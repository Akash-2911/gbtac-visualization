const { app } = require("@azure/functions");
const { getPool, sql } = require("../../../shared/sqlClient");
const { checkAuth } = require("../../../shared/authMiddleware");
const { checkRateLimit } = require("../../../shared/rateLimiter");
const { resolveSiteId } = require("../../../shared/siteAccess");
const { ROLES } = require("../../../shared/roles");

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
const ENERGY_SUM_EXPR = ENERGY_COLUMNS.join(" + ");

// Each dashboard page passes its own `domain` so the panel talks about that
// page's actual data instead of every page getting the same generic
// energy-vs-solar summary (the bug this replaced). `overview`/`compare`
// keep the original two-series balance; the rest are single-metric,
// period-over-period comparisons against the immediately preceding window
// of equal length.
const SINGLE_METRIC_DOMAINS = {
  energy: {
    view: "vw_daily_energy_summary", valueExpr: ENERGY_SUM_EXPR, agg: "SUM",
    label: "Consumed", unit: "kWh", icon: "zap", goodDirection: "down",
  },
  solar: {
    view: "vw_daily_solar_summary", valueExpr: "collector1_kwh + collector2_kwh", agg: "SUM",
    label: "Generated", unit: "kWh", icon: "sun", goodDirection: "up",
  },
  emissions: {
    view: "emission_records", valueExpr: "kg_co2e", agg: "SUM",
    label: "CO2e Emitted", unit: "kg", icon: "cloud", goodDirection: "down",
  },
  weather: {
    view: "vw_daily_weather_summary", valueExpr: "avg_temp_c", agg: "AVG",
    label: "Avg Temp", unit: "°C", icon: "thermometer", goodDirection: null,
    secondary: { valueExpr: "total_precip_mm", agg: "SUM", label: "Total Precip", unit: "mm", icon: "droplet" },
  },
};

// `view`/`valueExpr` below are always looked up from the fixed config object
// above (keyed by a whitelisted `domain`), never taken from the request —
// same trust boundary the original ENERGY_COLUMNS-join already relied on.
async function queryAgg(pool, siteId, view, valueExpr, agg, from, to) {
  const result = await pool
    .request()
    .input("siteId", sql.Int, siteId)
    .input("fromDate", sql.Date, from)
    .input("toDate", sql.Date, to)
    .query(`
      SELECT ${agg}(${valueExpr}) AS val
      FROM ${view}
      WHERE site_id = @siteId AND reading_date BETWEEN @fromDate AND @toDate
    `);
  return result.recordset[0].val || 0;
}

async function latestDateFor(pool, siteId, view) {
  const result = await pool
    .request()
    .input("siteId", sql.Int, siteId)
    .query(`SELECT MAX(reading_date) AS latest_date FROM ${view} WHERE site_id = @siteId`);
  return result.recordset[0].latest_date;
}

// Same-length window immediately before `from` — the baseline a
// period-over-period trend pill compares against.
function previousWindow(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const spanDays = Math.round((toDate - fromDate) / 86400000) + 1;
  const prevTo = new Date(fromDate);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (spanDays - 1));
  return { prevFrom: prevFrom.toISOString().slice(0, 10), prevTo: prevTo.toISOString().slice(0, 10) };
}

async function callAzureOpenAi(dataForAi) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  const aiResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ model: deployment, instructions: SYSTEM_PROMPT, input: dataForAi }),
  });

  const aiData = await aiResponse.json();
  if (!aiResponse.ok || aiData.error) {
    throw new Error(aiData.error?.message || "AI request failed");
  }

  const messageOutput = aiData.output?.find((o) => o.type === "message");
  return messageOutput?.content?.[0]?.text || "Insight unavailable";
}

app.http("aiSummary", {
  methods: ["GET"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "ai/summary",
  handler: async (request, context) => {
    try {
      const user = await checkAuth(request, [ROLES.STAFF, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GUEST]); // GUEST MODE
      // GUEST MODE: user.oid is null for guests — without this, every guest
      // session would collapse into one shared rate-limit bucket keyed on
      // `null`. Stricter cap for guests too (5/min vs 10/min).
      const rateLimitKey = user.isGuest ? `guest:${user.guestId}` : user.oid;
      checkRateLimit(rateLimitKey, user.isGuest ? 5 : 10, 60000);

      const siteId = resolveSiteId(request);
      const pool = await getPool();

      const domainParam = request.query.get("domain");
      const domain = SINGLE_METRIC_DOMAINS[domainParam] ? domainParam : "overview";

      let from = request.query.get("from");
      let to = request.query.get("to");

      if (!from || !to) {
        // Default to the most recent 30 days of actual data for this
        // domain's own table, rather than an arbitrary fixed window or
        // (for non-energy domains) borrowing energy's date range — the
        // dataset is historical and different domains aren't guaranteed to
        // have the same latest date.
        const anchorView = domain === "overview" ? "vw_daily_energy_summary" : SINGLE_METRIC_DOMAINS[domain].view;
        const latestDate = await latestDateFor(pool, siteId, anchorView);

        if (!latestDate) {
          return {
            status: 200,
            jsonBody: { insight: "Insight unavailable", domain, primary: null, secondary: null, pill: null },
          };
        }

        const toDate = new Date(latestDate);
        const fromDate = new Date(toDate);
        fromDate.setDate(fromDate.getDate() - 29);

        to = toDate.toISOString().slice(0, 10);
        from = fromDate.toISOString().slice(0, 10);
      }

      let primary;
      let secondary;
      let pill = null;
      let dataForAi;

      if (domain === "overview") {
        const totalConsumed = await queryAgg(pool, siteId, "vw_daily_energy_summary", ENERGY_SUM_EXPR, "SUM", from, to);
        const totalGenerated = await queryAgg(pool, siteId, "vw_daily_solar_summary", "collector1_kwh + collector2_kwh", "SUM", from, to);
        const isSurplus = totalGenerated >= totalConsumed;
        const deltaKwh = Math.abs(totalGenerated - totalConsumed);

        primary = { label: "Consumed", value: totalConsumed, unit: "kWh", icon: "zap" };
        secondary = { label: "Generated", value: totalGenerated, unit: "kWh", icon: "sun" };
        pill = { text: `${deltaKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh ${isSurplus ? "surplus" : "short"}`, direction: isSurplus ? "up" : "down", isGood: isSurplus };

        dataForAi = `Total Consumed: ${totalConsumed} kWh, Total Generated: ${totalGenerated} kWh, Net Balance: ${isSurplus ? "Positive" : "Negative"}, Period: ${from} to ${to}`;
      } else {
        const cfg = SINGLE_METRIC_DOMAINS[domain];
        const current = await queryAgg(pool, siteId, cfg.view, cfg.valueExpr, cfg.agg, from, to);

        primary = { label: cfg.label, value: current, unit: cfg.unit, icon: cfg.icon };

        if (cfg.secondary) {
          const secondaryValue = await queryAgg(pool, siteId, cfg.view, cfg.secondary.valueExpr, cfg.secondary.agg, from, to);
          secondary = { label: cfg.secondary.label, value: secondaryValue, unit: cfg.secondary.unit, icon: cfg.secondary.icon };
          dataForAi = `${cfg.label}: ${current} ${cfg.unit}, ${cfg.secondary.label}: ${secondaryValue} ${cfg.secondary.unit}, Period: ${from} to ${to}`;
        } else {
          const spanDays = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
          const avgPerDay = current / spanDays;
          secondary = { label: "Avg/day", value: avgPerDay, unit: cfg.unit, icon: null };

          const { prevFrom, prevTo } = previousWindow(from, to);
          const previous = await queryAgg(pool, siteId, cfg.view, cfg.valueExpr, cfg.agg, prevFrom, prevTo);
          if (previous > 0) {
            const deltaPct = ((current - previous) / previous) * 100;
            const direction = deltaPct === 0 ? "flat" : deltaPct > 0 ? "up" : "down";
            pill = {
              text: direction === "flat" ? "No change vs previous period" : `${Math.abs(deltaPct).toFixed(0)}% ${direction === "up" ? "higher" : "lower"} vs previous period`,
              direction,
              isGood: direction !== "flat" && direction === cfg.goodDirection,
            };
          }

          dataForAi = `${cfg.label}: ${current} ${cfg.unit} for ${from} to ${to}` + (previous > 0 ? `, versus ${previous} ${cfg.unit} for the prior ${spanDays}-day period` : "");
        }
      }

      const insightText = await callAzureOpenAi(dataForAi);

      return {
        status: 200,
        jsonBody: { insight: insightText, domain, primary, secondary, pill, from, to },
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
