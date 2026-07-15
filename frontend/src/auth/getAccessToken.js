import { msalInstance } from './msalInstance';
import { loginRequest } from './authConfig';

export async function getAccessToken() {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    throw new Error('No signed-in user found. Please log in.');
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    });
    return response.accessToken;
  } catch (error) {
    // Silent token refresh failed (e.g. expired session) — send them
    // through the sign-in flow again.
    await msalInstance.acquireTokenRedirect(loginRequest);
  }
}