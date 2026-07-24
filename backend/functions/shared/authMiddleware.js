const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { getPool, sql } = require("./sqlClient");
const { ROLES, USER_STATUS } = require("./roles");

const tenantId = process.env.AUTH_TENANT_ID;
const clientId = process.env.AUTH_CLIENT_ID;

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
});

// Fetches the correct public signing key from Microsoft to verify the token's signature
function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Verifies a raw JWT string, returns the decoded token payload if valid
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        audience: clientId,
        issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) {
          console.log("JWT VERIFY ERROR:", err.message);
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

// Looks up (or creates) the user's row in our own database. This is the
// "floor directory" step, separate from Entra ID (the "front door guard"
// above). Entra only proves who someone is, this decides what they're
// allowed to do inside GBTAC specifically.
async function getOrCreateDbUser(decodedToken) {
  const entraOid = decodedToken.oid || decodedToken.sub;
  const email = decodedToken.preferred_username || "unknown@unknown.com";
  const pool = await getPool();

  // First try matching by entra_oid (normal case for anyone who signed
  // in through this system since day one).
  const existing = await pool.request()
    .input("entraOid", sql.NVarChar, entraOid)
    .query(`
      SELECT user_id, display_name, email, role, active, status, can_upload
      FROM users WHERE entra_oid = @entraOid
    `);

  if (existing.recordset.length > 0) {
    return existing.recordset[0];
  }

  // Fallback: a row might already exist for this email (created manually
  // before entra_oid was tracked, e.g. Aryan's original row). If so,
  // backfill their real entra_oid instead of trying to insert a
  // duplicate, which would violate the email unique constraint.
  const byEmail = await pool.request()
    .input("email", sql.NVarChar, email)
    .query(`
      SELECT user_id, display_name, email, role, active, status, can_upload
      FROM users WHERE email = @email
    `);

  if (byEmail.recordset.length > 0) {
    await pool.request()
      .input("userId", sql.Int, byEmail.recordset[0].user_id)
      .input("entraOid", sql.NVarChar, entraOid)
      .query(`UPDATE users SET entra_oid = @entraOid WHERE user_id = @userId`);

    return byEmail.recordset[0];
  }

  // Genuinely new user, no row by oid or email, create as pending.
  const displayName = decodedToken.name || "Unknown";

  await pool.request()
    .input("displayName", sql.NVarChar, displayName)
    .input("email", sql.NVarChar, email)
    .input("entraOid", sql.NVarChar, entraOid)
    .query(`
      INSERT INTO users (display_name, email, role, active, status, can_upload, entra_oid)
      VALUES (@displayName, @email, '${ROLES.VIEWER}', 0, '${USER_STATUS.PENDING}', 0, @entraOid)
    `);

  const created = await pool.request()
    .input("entraOid", sql.NVarChar, entraOid)
    .query(`
      SELECT user_id, display_name, email, role, active, status, can_upload
      FROM users WHERE entra_oid = @entraOid
    `);

  return created.recordset[0];
}

// Verifies the JWT and fetches the database user, without any status or
// role gating. Used internally by checkAuth, and directly by endpoints
// that need to act on a denied/pending account (like reapply.js), which
// checkAuth's normal gating would otherwise block before they can run.
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing or malformed Authorization header");
    err.status = 401;
    throw err;
  }

  const token = authHeader.substring(7);

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (e) {
    const err = new Error("Invalid or expired token");
    err.status = 401;
    throw err;
  }

  const dbUser = await getOrCreateDbUser(decoded);
  return { ...decoded, ...dbUser };
}

/**
 * Checks that a request has a valid JWT AND that the person has an
 * approved, active row in our database.
 *
 * Throws an Error with a `.status` property if the check fails:
 *   401 - missing/invalid token
 *   428 - account is pending SuperAdmin approval
 *   423 - account was denied
 *   403 - deactivated, or wrong role for this action
 *
 * Returns the merged user object if everything passes.
 */
async function checkAuth(request, allowedRoles = null) {
  const user = await getAuthenticatedUser(request);

  if (user.status === USER_STATUS.PENDING) {
    const err = new Error("Your account is pending SuperAdmin approval.");
    err.status = 428;
    throw err;
  }

  if (user.status === USER_STATUS.DENIED) {
    const err = new Error("Your access request was denied.");
    err.status = 423;
    throw err;
  }

  if (!user.active) {
    const err = new Error("Your account has been deactivated.");
    err.status = 403;
    throw err;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      const err = new Error(
        `Forbidden: requires one of [${allowedRoles.join(", ")}], user has [${user.role}]`
      );
      err.status = 403;
      throw err;
    }
  }

  return user;
}

module.exports = { checkAuth, getAuthenticatedUser };