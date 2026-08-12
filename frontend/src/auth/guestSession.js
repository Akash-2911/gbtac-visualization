// GUEST MODE: an anonymous "View as Guest" session (no MSAL sign-in). This
// module is the single place that tracks whether one is active. To remove
// guest mode entirely, delete this file plus every other "GUEST MODE"
// comment across the codebase (grep for it).
const GUEST_MODE_KEY = 'gbtac_guest_mode';
const GUEST_ID_KEY = 'gbtac_guest_id';

export function startGuestSession() {
  sessionStorage.setItem(GUEST_MODE_KEY, 'true');
  sessionStorage.setItem(GUEST_ID_KEY, crypto.randomUUID());
}

export function endGuestSession() {
  sessionStorage.removeItem(GUEST_MODE_KEY);
  sessionStorage.removeItem(GUEST_ID_KEY);
}

export function isGuestMode() {
  return sessionStorage.getItem(GUEST_MODE_KEY) === 'true';
}

export function getGuestSessionId() {
  return sessionStorage.getItem(GUEST_ID_KEY);
}
