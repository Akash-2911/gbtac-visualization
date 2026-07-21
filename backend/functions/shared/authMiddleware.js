const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { getPool, sql } = require("./sqlClient");

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

    // TEMP DEBUG — log what we expect vs what's in token
    const decoded_unverified = jwt.decode(token);
    console.log("TOKEN DEBUG:", JSON.stringify({
      iss: decoded_unverified?.iss,
      aud: decoded_unverified?.aud,
      ver: decoded_unverified?.ver,
      exp: decoded_unverified?.exp,
      expected_issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      expected_audience: clientId,
    }, null, 2));
    // END TEMP DEBUG

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
      VALUES (@displayName, @email, 'Viewer', 0, 'pending', 0, @entraOid)
    `);

  const created = await pool.request()
    .input("entraOid", sql.NVarChar, entraOid)
    .query(`
      SELECT user_id, display_name, email, role, active, status, can_upload
      FROM users WHERE entra_oid = @entraOid
    `);

  return created.recordset[0];
}

/**
 * Checks that a request has a valid JWT (Entra ID, proves identity) AND
 * that the person has an approved, active row in our database (proves
 * app-specific permission). Two separate checks, two separate systems.
 *
 * Usage inside a function handler:
 *
 *   const { checkAuth } = require("../../shared/authMiddleware");
 *   const user = await checkAuth(request, ["Admin", "SuperAdmin"]);
 *
 * Throws an Error with a `.status` property if the check fails:
 *   401 - missing/invalid token (Entra ID check failed)
 *   428 - valid token, but account is pending SuperAdmin approval
 *   403 - valid token, approved, but wrong role for this action
 *
 * Returns the merged user object (token claims + database row, including
 * `.role`, `.status`, `.can_upload`, `.user_id`) if everything passes.
 */
async function checkAuth(request, allowedRoles = null) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing or malformed Authorization header");
    err.status = 401;
    throw err;
  }

  const token = authHeader.substring(7); // strip "Bearer "

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (e) {
    const err = new Error("Invalid or expired token");
    err.status = 401;
    throw err;
  }

  // Entra ID confirmed identity. Now check our own database for
  // app-specific approval and role.
  const dbUser = await getOrCreateDbUser(decoded);

  if (dbUser.status === "pending") {
    const err = new Error("Your account is pending SuperAdmin approval.");
    err.status = 428; // distinct code so the frontend can show a wait screen, not a generic error
    throw err;
  }

  if (!dbUser.active) {
    const err = new Error("Your account has been deactivated.");
    err.status = 403;
    throw err;
  }

  // Role check now uses the DATABASE role, not the JWT token's role claim.
  // This is what makes SuperAdmin's in-app role changes actually take effect.
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(dbUser.role)) {
      const err = new Error(
        `Forbidden: requires one of [${allowedRoles.join(", ")}], user has [${dbUser.role}]`
      );
      err.status = 403;
      throw err;
    }
  }

  // Merge token claims with the DB row so handlers have access to both
  return { ...decoded, ...dbUser };
}

module.exports = { checkAuth };