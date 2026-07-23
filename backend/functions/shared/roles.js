// Single source of truth for the 4-tier role model and user approval status.
// Was previously duplicated as raw string literals across 15+ backend files.
const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  STAFF: "Staff",
  VIEWER: "Viewer",
};

// users.status — the approval workflow state, distinct from the separate
// boolean `active` (enabled/disabled) column on the same table.
const USER_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  DENIED: "denied",
};

module.exports = { ROLES, USER_STATUS };
