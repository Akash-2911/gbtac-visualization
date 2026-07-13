const { BlobServiceClient } = require("@azure/storage-blob");

const CONTAINER_NAME = "raw-uploads";

function getContainerClient() {
  const connectionString = process.env.STORAGE_CONNECTION_STRING;
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient.getContainerClient(CONTAINER_NAME);
}

/**
 * Uploads a file buffer to Blob Storage.
 * Returns the blob's name and URL.
 */
async function uploadFileToBlob(fileBuffer, originalFileName) {
  const containerClient = getContainerClient();
  await containerClient.createIfNotExists();

  // Prefix with timestamp to avoid name collisions
  const timestamp = Date.now();
  const blobName = `${timestamp}-${originalFileName}`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(fileBuffer);

  return {
    blobName,
    blobUrl: blockBlobClient.url,
  };
}

module.exports = { uploadFileToBlob };