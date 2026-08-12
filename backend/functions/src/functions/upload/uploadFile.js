const { app } = require("@azure/functions");
const sql = require("mssql");
const { checkAuth } = require("../../../shared/authMiddleware");
const { uploadFileToBlob } = require("../../../shared/blobStorage");
const { queueUploadMessage } = require("../../../shared/serviceBusQueue");
const { ROLES } = require("../../../shared/roles");
const { getMaxUploadMb } = require("../../../shared/uploadSettings");

const VALID_DATASET_TYPES = ["greenhouse", "solar", "weather"];

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  authentication: { type: "azure-active-directory-default" },
  options: { encrypt: true, trustServerCertificate: false },
};

app.http("uploadFile", {
  methods: ["POST"],
  authLevel: "anonymous", // access control handled by checkAuth below
  route: "upload",
  handler: async (request, context) => {
    try {
// Step 1: verify caller is authenticated and has permission to upload
      const user = await checkAuth(request, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);

      // SuperAdmin can always upload. Admin can only upload if their
      // can_upload flag is set by a SuperAdmin, this is the actual
      // enforcement of Maeric's per-admin upload permission request,
      // not just a UI toggle.
      if (user.role === ROLES.ADMIN && !user.can_upload) {
        const err = new Error("You do not have upload permission. Contact a SuperAdmin.");
        err.status = 403;
        throw err;
      }

      // Step 2: read the uploaded file from the request
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return {
          status: 400,
          jsonBody: { error: "No file found in request. Expected form field named 'file'." },
        };
      }

      const fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      // Reject oversized files here rather than only in processUpload.js —
      // otherwise the caller gets a false "uploaded, processing queued"
      // response and only finds out it failed after the async queue runs.
      const pool = await sql.connect(sqlConfig);
      const maxUploadMb = await getMaxUploadMb(pool);
      const sizeMb = fileBuffer.length / (1024 * 1024);
      if (sizeMb > maxUploadMb) {
        return {
          status: 400,
          jsonBody: { error: `File size ${sizeMb.toFixed(1)} MB exceeds the ${maxUploadMb} MB limit.` },
        };
      }

      // Step 2b: read the dataset type the user picked in the UI dropdown.
      // Normalized to lowercase to match DATASET_CONFIGS keys in
      // processUpload.js. If provided, this takes priority over filename
      // detection there, since the user explicitly told us what it is.
      const dataTypeRaw = formData.get("dataType");
      const dataType = dataTypeRaw ? String(dataTypeRaw).toLowerCase() : null;

      if (dataType && !VALID_DATASET_TYPES.includes(dataType)) {
        return {
          status: 400,
          jsonBody: {
            error: `Invalid dataType '${dataTypeRaw}'. Must be one of: ${VALID_DATASET_TYPES.join(", ")}.`,
          },
        };
      }

      // Step 3: save the raw file to Blob Storage
      const { blobName, blobUrl } = await uploadFileToBlob(fileBuffer, fileName);

      // Step 4: queue a message so the ETL processor picks it up
      await queueUploadMessage({
        blobName,
        blobUrl,
        originalFileName: fileName,
        dataType,
        uploadedBy: user.oid || user.sub, // unique user id from the token
        uploadedAt: new Date().toISOString(),
      });

      return {
        status: 200,
        jsonBody: {
          message: "File uploaded successfully, processing queued.",
          blobName,
          blobUrl,
        },
      };
    } catch (err) {
      context.error("Upload failed:", err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || "Upload failed" },
      };
    }
  },
});