// Single source of truth for the 4-tier role model and user approval status.
// Mirrors backend/functions/shared/roles.js — was previously duplicated as
// raw string literals across several frontend files.
export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  STAFF: 'Staff',
  VIEWER: 'Viewer',
};

// user.status — the approval workflow state, distinct from the separate
// boolean `active` (enabled/disabled) field on the same user record.
export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DENIED: 'denied',
};
