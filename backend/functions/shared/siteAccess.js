// Sites the caller is allowed to query via the `site_id` query param.
// Today there's only one site (Aldersyde); this is the single place to
// extend once a second site (and a real user-to-site access model) exists.
const DEFAULT_SITE_ID = 1;
const VALID_SITE_IDS = new Set([DEFAULT_SITE_ID]);

/**
 * Reads and validates `site_id` from the request query string.
 * Defaults to site 1 when omitted. Throws a 400 error for anything
 * that isn't a known, valid site ID, instead of passing arbitrary
 * caller input straight into the SQL query.
 */
function resolveSiteId(request) {
  const raw = request.query.get("site_id");

  if (raw === null || raw === undefined || raw === "") {
    return DEFAULT_SITE_ID;
  }

  const siteId = parseInt(raw, 10);
  if (!Number.isInteger(siteId) || !VALID_SITE_IDS.has(siteId)) {
    const err = new Error(`Invalid or unauthorized site_id: ${raw}`);
    err.status = 400;
    throw err;
  }

  return siteId;
}

module.exports = { resolveSiteId, VALID_SITE_IDS, DEFAULT_SITE_ID };
