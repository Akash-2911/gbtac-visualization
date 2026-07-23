const { app } = require("@azure/functions");
const { getAuthenticatedUser } = require("../../../shared/authMiddleware");
const { getPool, sql } = require("../../../shared/sqlClient");
const { USER_STATUS } = require("../../../shared/roles");

// POST /reapply
// Self-service: a denied user can resubmit their own request, putting
// them back to pending for SuperAdmin to review again. No role check,
// since a denied account has no role to check, just needs a valid token.
app.http("reapply", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "reapply",
  handler: async (request, context) => {
    try {
      const user = await getAuthenticatedUser(request);

      if (user.status !== USER_STATUS.DENIED) {
        return {
          status: 400,
          jsonBody: { error: "Only denied accounts can resubmit a request." },
        };
      }

      const pool = await getPool();
      await pool.request()
        .input("userId", sql.Int, user.user_id)
        .query(`UPDATE users SET status = '${USER_STATUS.PENDING}' WHERE user_id = @userId`);

      return {
        status: 200,
        jsonBody: { message: "Your request has been resubmitted for approval." },
      };
    } catch (err) {
      context.error("reapply failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to resubmit request" },
      };
    }
  },
});