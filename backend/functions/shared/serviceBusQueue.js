const { ServiceBusClient } = require("@azure/service-bus");

const QUEUE_NAME = process.env.UPLOAD_QUEUE_NAME || "upload-processing";

/**
 * Sends a message to the upload-processing queue so the ETL
 * processor function (Aryan's) picks it up and processes the file.
 */
async function queueUploadMessage(messageBody) {
  const connectionString = process.env.SERVICEBUS_CONNECTION_STRING;
  const sbClient = new ServiceBusClient(connectionString);
  const sender = sbClient.createSender(QUEUE_NAME);

  try {
    await sender.sendMessages({ body: messageBody });
  } finally {
    await sender.close();
    await sbClient.close();
  }
}

module.exports = { queueUploadMessage };