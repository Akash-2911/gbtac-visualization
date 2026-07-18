// Simple in-memory rate limiter, per user ID, resets after windowMs.
// NOTE: resets if the Function App restarts/scales - fine for this
// low-traffic capstone use case, not meant for high-scale production.
const requestLog = new Map();

function checkRateLimit(userId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const timestamps = requestLog.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) {
    const err = new Error("Rate limit exceeded. Please wait a moment before trying again.");
    err.status = 429;
    throw err;
  }

  recent.push(now);
  requestLog.set(userId, recent);
}

module.exports = { checkRateLimit };