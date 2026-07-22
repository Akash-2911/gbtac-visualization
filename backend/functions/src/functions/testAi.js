const { app } = require('@azure/functions');

app.http('testAi', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test-ai',
  handler: async (request, context) => {
    try {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const key = process.env.AZURE_OPENAI_KEY;
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'api-key': key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: deployment,
          input: 'Say hello in one short sentence.'
        })
      });

      const data = await response.json();
      return { jsonBody: data };
    } catch (err) {
      return { status: 500, jsonBody: { error: err.message } };
    }
  }
});