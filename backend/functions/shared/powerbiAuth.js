const { ConfidentialClientApplication } = require("@azure/msal-node");

// Gets an Azure AD access token for the Power BI service principal
// (gbtac-powerbi-embed app registration - App Owns Data model)
async function getPowerBiAccessToken() {
  const msalConfig = {
    auth: {
      clientId: process.env.PBI_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.PBI_TENANT_ID}`,
      clientSecret: process.env.PBI_CLIENT_SECRET,
    },
  };

  const cca = new ConfidentialClientApplication(msalConfig);

  const tokenRequest = {
    scopes: ["https://analysis.windows.net/powerbi/api/.default"],
  };

  const response = await cca.acquireTokenByClientCredential(tokenRequest);
  return response.accessToken;
}

module.exports = { getPowerBiAccessToken };