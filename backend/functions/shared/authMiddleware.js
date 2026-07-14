const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

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

/**
 * Checks that a request has a valid JWT and (optionally) an allowed role.
 * Usage inside a function handler:
 *
 *   const { checkAuth } = require("../../shared/authMiddleware");
 *   const user = await checkAuth(request, ["Admin", "SuperAdmin"]);
 *
 * Throws an Error with a `.status` property (401 or 403) if the check fails.
 * Returns the decoded user object (including `.roles`) if it passes.
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

  const userRoles = decoded.roles || [];

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = userRoles.some((role) => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      const err = new Error(
        `Forbidden: requires one of [${allowedRoles.join(", ")}], user has [${userRoles.join(", ")}]`
      );
      err.status = 403;
      throw err;
    }
  }

  return decoded;
}

module.exports = { checkAuth };