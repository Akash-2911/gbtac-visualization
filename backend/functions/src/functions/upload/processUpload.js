/**
 * GBTAC Visualization Project
 * Sprint 4 — Ticket 8: Build File Upload Feature (ETL Processor)
 * File:    processUpload.js
 * Author:  Aryan
 *
 * Service Bus triggered function — NOT an HTTP endpoint.
 * Listens to the "upload-processing" queue on sb-gbtac-dev1.
 * Triggered automatically when uploadFile.js queues a message.
 *
 * Message shape (from uploadFile.js):
 *   {
 *     blobName:         string,   // e.g. "2023_greenhouse_march.xlsx"
 *     blobUrl:          string,   // full Azure Blob Storage URL
 *     originalFileName: string,   // original file name from the upload
 *     uploadedBy:       string,   // user OID from the JWT token
 *     uploadedAt:       string,   // ISO timestamp
 *   }
 *
 * What this function does (mirrors Python etl_pipeline.py logic):
 *   1. Download the Excel file from Blob Storage
 *   2. Detect dataset type from file name or content
 *   3. Validate required columns exist
 *   4. Parse + transform all rows (timestamps MT→UTC, column mapping, flag negatives)
 *   5. Create upload_batches audit record
 *   6. Skip duplicate timestamps, bulk insert new rows
 *   7. Update batch status to complete or failed
 *
 * Column mappings and validation rules ported directly from etl_pipeline.py
 * (Sprint 2, Ticket 7) — same logic, same column names, just in JS.
 */

const { app } = require("@azure/functions");
const { BlobServiceClient } = require("@azure/storage-blob");
const ExcelJS = require("exceljs");
const sql = require("mssql");
const { Readable } = require("stream");

// ─────────────────────────────────────────────
// SQL CONFIG — uses managed identity in Azure,
// matches the same DB as all other functions
// ─────────────────────────────────────────────

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  authentication: {
    type: "azure-active-directory-default",
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

const SITE_ID  = 1;
const MAX_MB   = 100;
const BATCH_SIZE = 500;

// ─────────────────────────────────────────────
// DATASET CONFIGURATIONS
// Ported from Python etl_pipeline.py DATASET_CONFIGS.
// Adding a new dataset type = add a new block here.
// ─────────────────────────────────────────────

const DATASET_CONFIGS = {

  greenhouse: {
    table:          "greenhouse_readings",
    timestampCol:   "Date & Time",
    flagNegativeKw: true,
    requiredColumns: ["Date & Time", "Mains - PA [kW]", "Mains - PB [kW]", "Mains - PC [kW]"],
    columnMap: {
      "SE Humidity []":                       "humidity_se_pct",
      "SW Humidity []":                       "humidity_sw_pct",
      "NE Humidity []":                       "humidity_ne_pct",
      "NW Humidity []":                       "humidity_nw_pct",
      "SE Temperature []":                    "temp_se_c",
      "SW Temperature []":                    "temp_sw_c",
      "NE Temperature []":                    "temp_ne_c",
      "NW Temperature []":                    "temp_nw_c",
      "Chiller - PA [kW]":                    "chiller_pa_kw",
      "Chiller - PB [kW]":                    "chiller_pb_kw",
      "Lighting - PA [kW]":                   "lighting_pa_kw",
      "Lighting / Cooling System - PB [kW]":  "lighting_pb_kw",
      "Lighting - PC [kW]":                   "lighting_pc_kw",
      "Big Heater - PC [kW]":                 "heater_big_kw",
      "Small Heater - PB [kW]":               "heater_small_kw",
      "Rinnai Instant Hot - PA [kW]":         "rinnai_hw_kw",
      "Mains - PA [kW]":                      "mains_pa_kw",
      "Mains - PB [kW]":                      "mains_pb_kw",
      "Mains - PC [kW]":                      "mains_pc_kw",
      "Superpump - PB [kW]":                  "superpump_kw",
      "Sand Filter - PA [kW]":                "sand_filter_kw",
      "Sump - PB [kW]":                       "sump_pb_kw",
      "Tables + CSP - PB [kW]":              "tables_csp_pb_kw",
      "Vertical Grow Bags - PB [kW]":         "vertical_grow_bags_pb_kw",
    },
    dbColumns: [
      "site_id", "timestamp_utc",
      "chiller_pa_kw", "chiller_pb_kw",
      "lighting_pa_kw", "lighting_pb_kw", "lighting_pc_kw",
      "heater_big_kw", "heater_small_kw", "rinnai_hw_kw",
      "mains_pa_kw", "mains_pb_kw", "mains_pc_kw",
      "superpump_kw", "sand_filter_kw",
      "sump_pb_kw", "tables_csp_pb_kw", "vertical_grow_bags_pb_kw",
      "temp_se_c", "temp_sw_c", "temp_ne_c", "temp_nw_c",
      "humidity_se_pct", "humidity_sw_pct", "humidity_ne_pct", "humidity_nw_pct",
      "data_quality", "upload_batch_id",
    ],
    kwColumns: [
      "chiller_pa_kw", "chiller_pb_kw",
      "lighting_pa_kw", "lighting_pb_kw", "lighting_pc_kw",
      "heater_big_kw", "heater_small_kw", "rinnai_hw_kw",
      "mains_pa_kw", "mains_pb_kw", "mains_pc_kw",
      "superpump_kw", "sand_filter_kw",
      "sump_pb_kw", "tables_csp_pb_kw", "vertical_grow_bags_pb_kw",
    ],
  },

  solar: {
    table:          "solar_readings",
    timestampCol:   "Mountain Time",
    flagNegativeKw: false,
    requiredColumns: [
      "Mountain Time",
      "Available Sun Light Total (W/mҩ)",
      "Power Collected 1 (kW)",
      "Power Collected 2 (kW)",
    ],
    columnMap: {
      "Available Sun Light Total (W/mҩ)": "sunlight_wm2",
      "Collector T IN (у)":              "temp_in_c",
      "Flow1 (l/m)":                      "flow_rate_lm",
      "Collector 1 T OUT (у)":           "collector1_out_c",
      "Power Collected 1 (kW)":           "collector1_power_kw",
      "Collector 2 T OUT (у)":           "collector2_out_c",
      "Power Collected 2 (kW)":           "collector2_power_kw",
      "Collector Active":                 "collector_active_raw",
      "Alarms":                           "alarm_raw",
    },
    dbColumns: [
      "site_id", "timestamp_utc", "sunlight_wm2",
      "collector1_power_kw", "collector2_power_kw",
      "temp_in_c", "collector1_out_c", "collector2_out_c",
      "flow_rate_lm", "collector_active",
      "alarm_flag", "data_quality", "upload_batch_id",
    ],
    kwColumns: [],
  },

  weather: {
    table:          "weather_readings",
    timestampCol:   "Date",
    flagNegativeKw: false,
    requiredColumns: ["Date", "Air Temp. Inst. (°C)"],
    columnMap: {
      "Air Temp. Inst. (°C)":        "air_temp_instant_c",
      "Air Temp. Min. (°C)":         "air_temp_min_c",
      "Air Temp. Max. (°C)":         "air_temp_max_c",
      "Relative Humidity Avg. (%)":  "humidity_pct",
      "Precip. (mm)":                "precipitation_mm",
    },
    dbColumns: [
      "site_id", "timestamp_utc",
      "air_temp_instant_c", "air_temp_min_c", "air_temp_max_c",
      "humidity_pct", "precipitation_mm",
      "data_quality", "upload_batch_id",
    ],
    kwColumns: [],
  },
};

// ─────────────────────────────────────────────
// DETECT DATASET TYPE from file name
// Maeric's file names follow a consistent pattern.
// Falls back to requiring admin to specify type if
// pattern doesn't match — handled in uploadFile.js.
// ─────────────────────────────────────────────

function detectDatasetType(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes("greenhouse") || lower.includes("sprung")) return "greenhouse";
  if (lower.includes("solar") || lower.includes("cs"))           return "solar";
  if (lower.includes("weather") || lower.includes("black_diamond") || lower.includes("black diamond")) return "weather";
  return null;
}

// ─────────────────────────────────────────────
// DOWNLOAD FILE FROM BLOB STORAGE
// ─────────────────────────────────────────────

async function downloadFromBlob(blobUrl, context) {
  context.log(`Downloading file from Blob Storage: ${blobUrl}`);

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );

  // Parse container and blob name from URL
  // URL format: https://<account>.blob.core.windows.net/<container>/<blobName>
  const url        = new URL(blobUrl);
  const pathParts  = url.pathname.split("/").filter(Boolean);
  const container  = pathParts[0];
  const blobName   = pathParts.slice(1).join("/");

  const containerClient = blobServiceClient.getContainerClient(container);
  const blobClient      = containerClient.getBlobClient(blobName);

  const downloadResponse = await blobClient.download();
  const chunks = [];
  for await (const chunk of downloadResponse.readableStreamBody) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// ─────────────────────────────────────────────
// PARSE EXCEL FILE USING EXCELJS
// Returns: { headers: string[], rows: object[] }
// ─────────────────────────────────────────────

async function parseExcel(buffer, context) {
  context.log("Parsing Excel file with ExcelJS...");

  const workbook  = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Excel file has no worksheets.");

  const headers = [];
  const rows    = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row = headers
      row.eachCell((cell) => headers.push(String(cell.value || "").trim()));
    } else {
      // Data rows — map to object using headers
      const rowObj = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) rowObj[header] = cell.value;
      });
      rows.push(rowObj);
    }
  });

  context.log(`Parsed ${rows.length} rows, ${headers.length} columns`);
  return { headers, rows };
}

// ─────────────────────────────────────────────
// VALIDATE
// Checks headers match required columns for dataset type.
// Returns { valid: bool, errors: string[] }
// ─────────────────────────────────────────────

function validate(headers, datasetType) {
  const errors  = [];
  const config  = DATASET_CONFIGS[datasetType];

  if (!config) {
    errors.push(`Unknown dataset type '${datasetType}'. Must be greenhouse, solar, or weather.`);
    return { valid: false, errors };
  }

  const missing = config.requiredColumns.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    errors.push(
      `Missing required columns for '${datasetType}':\n` +
      missing.map((c) => `  - '${c}'`).join("\n") +
      `\n\nColumns found in file:\n` +
      headers.map((c) => `  - '${c}'`).join("\n")
    );
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────
// CONVERT MOUNTAIN TIME → UTC
// March 12, 2023: DST springs forward (MST UTC-7 → MDT UTC-6)
// November 5, 2023: falls back (MDT UTC-6 → MST UTC-7)
// ─────────────────────────────────────────────

function convertMountainToUtc(dateValue) {
  if (!dateValue) return null;

  let dt;
  if (dateValue instanceof Date) {
    dt = dateValue;
  } else if (typeof dateValue === "string") {
    dt = new Date(dateValue);
  } else if (typeof dateValue === "number") {
    // ExcelJS sometimes returns serial date numbers
    dt = new Date((dateValue - 25569) * 86400 * 1000);
  } else {
    return null;
  }

  if (isNaN(dt.getTime())) return null;

  // Determine offset: MDT (UTC-6) or MST (UTC-7)
  // DST in 2023: starts Mar 12 02:00, ends Nov 5 02:00
  const year    = dt.getFullYear();
  const dstStart = new Date(year, 2, 12, 2, 0, 0); // Mar 12 02:00
  const dstEnd   = new Date(year, 10, 5, 2, 0, 0);  // Nov 5 02:00
  const isDst    = dt >= dstStart && dt < dstEnd;
  const offsetMs = isDst ? 6 * 3600000 : 7 * 3600000; // MDT=+6h, MST=+7h

  return new Date(dt.getTime() + offsetMs);
}

// ─────────────────────────────────────────────
// TRANSFORM
// Maps columns, converts timestamps, flags negatives.
// Returns array of row objects ready to insert.
// ─────────────────────────────────────────────

function transform(rows, datasetType, context) {
  const config     = DATASET_CONFIGS[datasetType];
  const { columnMap, kwColumns, flagNegativeKw, timestampCol } = config;

  const seen       = new Set(); // for dedup within this file
  const transformed = [];
  let negativeCount = 0;
  let dupCount      = 0;

  for (const row of rows) {
    // Map columns
    const mapped = { site_id: SITE_ID, data_quality: "ok" };

    for (const [excelCol, dbCol] of Object.entries(columnMap)) {
      let val = row[excelCol];
      // Convert ExcelJS rich text objects to plain values
      if (val && typeof val === "object" && val.richText) {
        val = val.richText.map((r) => r.text).join("");
      }
      mapped[dbCol] = val !== undefined ? val : null;
    }

    // Convert timestamp
    const tsRaw = row[timestampCol];
    const tsUtc = convertMountainToUtc(tsRaw);
    if (!tsUtc) continue; // skip rows with unparseable timestamps

    const tsStr = tsUtc.toISOString().slice(0, 19); // YYYY-MM-DDTHH:MM:SS

    // Skip duplicates within this file
    if (seen.has(tsStr)) {
      dupCount++;
      continue;
    }
    seen.add(tsStr);

    mapped.timestamp_utc = tsUtc;

    // Flag negative kW rows
    if (flagNegativeKw) {
      const hasNegative = kwColumns.some(
        (col) => mapped[col] !== null && mapped[col] !== undefined && Number(mapped[col]) < 0
      );
      if (hasNegative) {
        mapped.data_quality = "negative_kw";
        negativeCount++;
      }
    }

    // Solar-specific transforms
    if (datasetType === "solar") {
      const activeRaw = mapped.collector_active_raw;
      mapped.collector_active = activeRaw != null ? Number(activeRaw) > 0 : null;
      delete mapped.collector_active_raw;

      const alarmRaw = mapped.alarm_raw;
      mapped.alarm_flag = (!alarmRaw || Number(alarmRaw) === 0)
        ? null
        : String(parseInt(alarmRaw));
      if (mapped.alarm_flag) mapped.data_quality = "alarm";
      delete mapped.alarm_raw;
    }

    transformed.push(mapped);
  }

  if (dupCount > 0) context.log(`Dropped ${dupCount} duplicate timestamps within file`);
  context.log(`Transform complete: ${transformed.length} rows ready, ${negativeCount} flagged negative_kw`);

  return transformed;
}

// ─────────────────────────────────────────────
// LOAD
// Creates batch record, skips existing timestamps, bulk inserts.
// ─────────────────────────────────────────────

async function load(rows, datasetType, message, batchId, pool, context) {
  const config = DATASET_CONFIGS[datasetType];
  const table  = config.table;

  // Check for existing timestamps to skip duplicates
  context.log(`Checking for existing timestamps in ${table}...`);
  const existingResult = await pool.request()
    .input("siteId", sql.Int, SITE_ID)
    .query(`SELECT timestamp_utc FROM ${table} WHERE site_id = @siteId`);

  const existingTs = new Set(
    existingResult.recordset.map((r) => r.timestamp_utc.toISOString().slice(0, 19))
  );

  const newRows = rows.filter(
    (r) => !existingTs.has(r.timestamp_utc.toISOString().slice(0, 19))
  );
  const skipped = rows.length - newRows.length;

  if (skipped > 0) context.log(`Skipped ${skipped} duplicate timestamps already in DB`);
  if (newRows.length === 0) {
    context.log("All rows already exist — nothing to insert");
    return { inserted: 0, skipped };
  }

  // Add batch_id to all rows
  newRows.forEach((r) => (r.upload_batch_id = batchId));

  // Build INSERT SQL using only columns that exist in dbColumns
  const cols        = config.dbColumns.filter((c) => newRows[0].hasOwnProperty(c));
  const colNames    = cols.join(", ");
  const placeholders = cols.map((_, i) => `@p${i}`).join(", ");
  const insertSql   = `INSERT INTO ${table} (${colNames}) VALUES (${placeholders})`;

  context.log(`Inserting ${newRows.length} rows into ${table} in batches of ${BATCH_SIZE}...`);

  let inserted = 0;
  for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
    const batch = newRows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const req = pool.request();
      cols.forEach((col, idx) => {
        const val = row[col];
        req.input(`p${idx}`, val !== undefined ? val : null);
      });
      await req.query(insertSql);
      inserted++;
    }

    context.log(`  ${inserted}/${newRows.length} rows inserted...`);
  }

  return { inserted, skipped };
}

// ─────────────────────────────────────────────
// UPDATE BATCH STATUS
// ─────────────────────────────────────────────

async function updateBatchStatus(pool, batchId, status, rowCount, errorMessage = null) {
  await pool.request()
    .input("status",   sql.NVarChar, status)
    .input("rowCount", sql.Int,      rowCount)
    .input("error",    sql.NVarChar, errorMessage)
    .input("batchId",  sql.Int,      batchId)
    .query(`
      UPDATE upload_batches
      SET status = @status,
          processed_at = GETUTCDATE(),
          row_count = @rowCount,
          error_message = @error
      WHERE batch_id = @batchId
    `);
}

// ─────────────────────────────────────────────
// MAIN — SERVICE BUS TRIGGER
// Different from HTTP functions — triggered by queue message, not HTTP request.
// Azure Functions v4 Service Bus trigger syntax.
// ─────────────────────────────────────────────

app.serviceBusQueue("processUpload", {
  queueName:    "upload-processing",       // matches queue name in sb-gbtac-dev1
  connection:   "SERVICEBUS_CONNECTION_STRING",  // env var name for Service Bus connection string
  handler: async (message, context) => {
    context.log("processUpload triggered. Message:", JSON.stringify(message));

    const { blobName, blobUrl, originalFileName, uploadedBy, uploadedAt, dataType } = message;

    let pool    = null;
    let batchId = null;

    try {
      // ── Step 1: Detect dataset type ─────────────────────────
      // Prefer the type the user explicitly picked in the upload dropdown
      // (uploadFile.js) over filename guessing — only fall back to
      // detectDatasetType() for messages that didn't include one.
      const datasetType = dataType || detectDatasetType(originalFileName || blobName);
      if (!datasetType || !DATASET_CONFIGS[datasetType]) {
        throw new Error(
          dataType
            ? `Unknown dataset type '${dataType}'. Must be greenhouse, solar, or weather.`
            : `Cannot determine dataset type from file name '${originalFileName}'. ` +
              `File name must contain 'greenhouse', 'solar', or 'weather'.`
        );
      }
      context.log(`Dataset type detected: ${datasetType}${dataType ? " (from user selection)" : " (from file name)"}`);

      // ── Step 2: Connect to SQL ───────────────────────────────
      pool = await sql.connect(sqlConfig);
      context.log("Connected to Azure SQL");

      // ── Step 3: Create upload_batches record ─────────────────
      // Look up user_id from uploadedBy OID
      const userResult = await pool.request()
        .input("oid", sql.NVarChar, uploadedBy)
        .query("SELECT user_id FROM users WHERE entra_oid = @oid");

      const userId = userResult.recordset[0]?.user_id || null;

      const batchResult = await pool.request()
        .input("userId",   sql.Int,      userId)
        .input("fileName", sql.NVarChar, originalFileName || blobName)
        .input("blobUrl",  sql.NVarChar, blobUrl)
        .input("dataType", sql.NVarChar, datasetType)
        .input("siteId",   sql.Int,      SITE_ID)
        .input("uploadedAt", sql.DateTime2, new Date(uploadedAt))
        .query(`
          INSERT INTO upload_batches
            (uploaded_by_user_id, file_name, blob_url, data_type,
             site_id, status, uploaded_at)
          OUTPUT INSERTED.batch_id
          VALUES (@userId, @fileName, @blobUrl, @dataType,
                  @siteId, 'processing', @uploadedAt)
        `);

      batchId = batchResult.recordset[0].batch_id;
      context.log(`Upload batch created — batch_id: ${batchId}`);

      // ── Step 4: Download file from Blob Storage ──────────────
      const fileBuffer = await downloadFromBlob(blobUrl, context);
      const sizeMb     = fileBuffer.length / (1024 * 1024);
      context.log(`Downloaded ${sizeMb.toFixed(1)} MB`);

      if (sizeMb > MAX_MB) {
        throw new Error(`File size ${sizeMb.toFixed(1)} MB exceeds the ${MAX_MB} MB limit.`);
      }

      // ── Step 5: Parse Excel ──────────────────────────────────
      const { headers, rows } = await parseExcel(fileBuffer, context);

      // ── Step 6: Validate ─────────────────────────────────────
      const { valid, errors } = validate(headers, datasetType);
      if (!valid) {
        throw new Error(`Validation failed:\n${errors.join("\n")}`);
      }
      context.log("Validation passed");

      // ── Step 7: Transform ────────────────────────────────────
      const transformedRows = transform(rows, datasetType, context);

      // ── Step 8: Load ─────────────────────────────────────────
      const { inserted, skipped } = await load(
        transformedRows, datasetType, message, batchId, pool, context
      );

      // ── Step 9: Mark batch complete ──────────────────────────
      await updateBatchStatus(pool, batchId, "complete", inserted);

      context.log(
        `✅ processUpload complete — ` +
        `${inserted} rows inserted, ${skipped} skipped (duplicates), ` +
        `batch_id: ${batchId}`
      );

    } catch (err) {
      context.error("processUpload failed:", err.message);

      // Mark batch as failed if it was created
      if (pool && batchId) {
        try {
          await updateBatchStatus(pool, batchId, "failed", 0, err.message);
        } catch (updateErr) {
          context.error("Failed to update batch status:", updateErr.message);
        }
      }

      // Re-throw so Service Bus knows the message failed
      // and will retry or dead-letter it
      throw err;

    } finally {
      if (pool) {
        try { await pool.close(); } catch (_) {}
      }
    }
  },
});
