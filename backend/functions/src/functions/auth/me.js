const { app } = require("@azure/functions");
const { checkAuth } = require("../../../shared/authMiddleware");

// GET /me
// Simple identity check the frontend calls right after login, before
// showing the real app. checkAuth() already throws 428 if the user is
// pending approval, so this endpoint doesn't need any extra logic for
// that, it just needs to exist so the frontend has something to ask.
app.http("me", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "me",
  handler: async (request, context) => {
    try {
      const user = await checkAuth(request); // no role restriction, any active user

      return {
        status: 200,
        jsonBody: {
          displayName: user.display_name,
          email: user.email,
          role: user.role,
          canUpload: !!user.can_upload,
        },
      };
    } catch (err) {
      context.error("me endpoint failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Failed to fetch user info" },
      };
    }
  },
});