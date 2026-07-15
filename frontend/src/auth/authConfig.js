export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AAD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AAD_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['api://1dbd7a4a-eb19-4757-9785-ba98bd0d45b9/access_as_user'],
};