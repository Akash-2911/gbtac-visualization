"""
GBTAC Visualization Project
Sprint 2 — Ticket 7: Build ETL Pipeline for Future Data Uploads
File:    etl_pipeline.py
Author:  Aryan

What this script does:
  Accepts any new Excel file for greenhouse / solar / weather data,
  validates the format, transforms the data, and appends rows to the
  correct Azure SQL table. Used by the admin panel upload feature in Sprint 4.

  Sprint 4 (Ticket 8) will call run_etl() directly from an Azure Function
  after receiving an uploaded file. This script is the engine behind that.

Validation rules (per TRD section 8.2):
  - File must be .xlsx and under 100 MB
  - Required columns must be present for the dataset type
  - Timestamps must be parseable and in Mountain Time
  - Negative kW values flagged but not rejected (data_quality = 'negative_kw')
  - Duplicate timestamps for same site + type are skipped not errored

Usage (command line — for testing):
  python etl_pipeline.py --file "path/to/file.xlsx" --type greenhouse
  python etl_pipeline.py --file "path/to/file.xlsx" --type solar
  python etl_pipeline.py --file "path/to/file.xlsx" --type weather

Usage (called from Azure Function in Sprint 4):
  from etl_pipeline import run_etl
  result = run_etl(file_path="path/to/file.xlsx", dataset_type="greenhouse")
  print(result["status"])  # "success" or "failed"
"""

import struct
import os
import sys
import argparse
import pandas as pd
import pyodbc
from datetime import datetime, timezone
from azure.identity import AzureCliCredential

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

SITE_ID    = 1
MAX_MB     = 100
BATCH_SIZE = 500

CONN_STR = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=sqlsrv-gbtac-dev1.database.windows.net,1433;"
    "Database=sql-gbtac-dev;"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
)

# ─────────────────────────────────────────────
# DATASET CONFIGURATIONS
# Adding a new dataset type in future = add a new block here.
# No other changes needed in the pipeline itself.
# ─────────────────────────────────────────────

DATASET_CONFIGS = {

    "greenhouse": {
        "table":           "greenhouse_readings",
        "timestamp_col":   "Date & Time",
        "site_id_col":     None,
        "flag_negative_kw": True,
        "required_columns": [
            "Date & Time",
            "Mains - PA [kW]",
            "Mains - PB [kW]",
            "Mains - PC [kW]",
        ],
        "column_map": {
            "SE Humidity []":                        "humidity_se_pct",
            "SW Humidity []":                        "humidity_sw_pct",
            "NE Humidity []":                        "humidity_ne_pct",
            "NW Humidity []":                        "humidity_nw_pct",
            "SE Temperature []":                     "temp_se_c",
            "SW Temperature []":                     "temp_sw_c",
            "NE Temperature []":                     "temp_ne_c",
            "NW Temperature []":                     "temp_nw_c",
            "Chiller - PA [kW]":                     "chiller_pa_kw",
            "Chiller - PB [kW]":                     "chiller_pb_kw",
            "Lighting - PA [kW]":                    "lighting_pa_kw",
            "Lighting / Cooling System - PB [kW]":   "lighting_pb_kw",
            "Lighting - PC [kW]":                    "lighting_pc_kw",
            "Big Heater - PC [kW]":                  "heater_big_kw",
            "Small Heater - PB [kW]":                "heater_small_kw",
            "Rinnai Instant Hot - PA [kW]":          "rinnai_hw_kw",
            "Mains - PA [kW]":                       "mains_pa_kw",
            "Mains - PB [kW]":                       "mains_pb_kw",
            "Mains - PC [kW]":                       "mains_pc_kw",
            "Superpump - PB [kW]":                   "superpump_kw",
            "Sand Filter - PA [kW]":                 "sand_filter_kw",
        },
        "db_columns": [
            "site_id", "timestamp_utc",
            "chiller_pa_kw", "chiller_pb_kw",
            "lighting_pa_kw", "lighting_pb_kw", "lighting_pc_kw",
            "heater_big_kw", "heater_small_kw", "rinnai_hw_kw",
            "mains_pa_kw", "mains_pb_kw", "mains_pc_kw",
            "superpump_kw", "sand_filter_kw",
            "temp_se_c", "temp_sw_c", "temp_ne_c", "temp_nw_c",
            "humidity_se_pct", "humidity_sw_pct",
            "humidity_ne_pct", "humidity_nw_pct",
            "data_quality", "upload_batch_id",
        ],
        "kw_columns": [
            "chiller_pa_kw", "chiller_pb_kw",
            "lighting_pa_kw", "lighting_pb_kw", "lighting_pc_kw",
            "heater_big_kw", "heater_small_kw", "rinnai_hw_kw",
            "mains_pa_kw", "mains_pb_kw", "mains_pc_kw",
            "superpump_kw", "sand_filter_kw",
        ],
    },

    "solar": {
        "table":           "solar_readings",
        "timestamp_col":   "Mountain Time",
        "site_id_col":     None,
        "flag_negative_kw": False,
        "required_columns": [
            "Mountain Time",
            "Available Sun Light Total (W/mҩ)",
            "Power Collected 1 (kW)",
            "Power Collected 2 (kW)",
        ],
        "column_map": {
            "Available Sun Light Total (W/mҩ)":  "sunlight_wm2",
            "Collector T IN (у)":               "temp_in_c",
            "Flow1 (l/m)":                       "flow_rate_lm",
            "Collector 1 T OUT (у)":            "collector1_out_c",
            "Power Collected 1 (kW)":            "collector1_power_kw",
            "Collector 2 T OUT (у)":            "collector2_out_c",
            "Power Collected 2 (kW)":            "collector2_power_kw",
            "Collector Active":                  "collector_active_raw",
            "Alarms":                            "alarm_raw",
        },
        "db_columns": [
            "site_id", "timestamp_utc", "sunlight_wm2",
            "collector1_power_kw", "collector2_power_kw",
            "temp_in_c", "collector1_out_c", "collector2_out_c",
            "flow_rate_lm", "collector_active",
            "alarm_flag", "data_quality", "upload_batch_id",
        ],
        "kw_columns": [],
    },

    "weather": {
        "table":           "weather_readings",
        "timestamp_col":   "Date",
        "site_id_col":     None,
        "flag_negative_kw": False,
        "required_columns": [
            "Date",
            "Air Temp. Inst. (°C)",
        ],
        "column_map": {
            "Air Temp. Inst. (°C)":    "air_temp_instant_c",
            "Air Temp. Min. (°C)":     "air_temp_min_c",
            "Air Temp. Max. (°C)":     "air_temp_max_c",
            "Relative Humidity Avg. (%)": "humidity_pct",
            "Precip. (mm)":            "precipitation_mm",
        },
        "db_columns": [
            "site_id", "timestamp_utc",
            "air_temp_instant_c", "air_temp_min_c", "air_temp_max_c",
            "humidity_pct", "precipitation_mm",
            "data_quality", "upload_batch_id",
        ],
        "kw_columns": [],
    },
}

# ─────────────────────────────────────────────
# AUTH — Azure CLI (same as all other scripts)
# ─────────────────────────────────────────────

def get_token():
    credential = AzureCliCredential()
    token = credential.get_token("https://database.windows.net/.default")
    token_bytes = token.token.encode("utf-16-le")
    return struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

def get_connection():
    return pyodbc.connect(CONN_STR, attrs_before={1256: get_token()}, timeout=60)

# ─────────────────────────────────────────────
# STEP 1 — VALIDATE
# Checks file before touching the database.
# Returns (True, []) on success or (False, [error messages]) on failure.
# ─────────────────────────────────────────────

def validate(file_path: str, dataset_type: str):
    errors = []

    # Check dataset type is known
    if dataset_type not in DATASET_CONFIGS:
        errors.append(
            f"Unknown dataset type '{dataset_type}'. "
            f"Must be one of: {', '.join(DATASET_CONFIGS.keys())}"
        )
        return False, errors

    config = DATASET_CONFIGS[dataset_type]

    # Check file exists
    if not os.path.exists(file_path):
        errors.append(f"File not found: {file_path}")
        return False, errors

    # Check file extension
    if not file_path.lower().endswith(".xlsx"):
        errors.append("File must be .xlsx format. Other formats are not supported.")
        return False, errors

    # Check file size (max 50 MB per TRD)
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > MAX_MB:
        errors.append(f"File size {size_mb:.1f} MB exceeds the 50 MB limit.")
        return False, errors

    # Try reading the file
    try:
        df = pd.read_excel(file_path, nrows=5)
    except Exception as e:
        errors.append(f"Could not read Excel file: {e}")
        return False, errors

    # Check file is not empty
    if df.empty:
        errors.append("Excel file is empty or has no data rows.")
        return False, errors

    # Check required columns exist
    missing_cols = []
    for col in config["required_columns"]:
        if col not in df.columns:
            missing_cols.append(col)

    if missing_cols:
        errors.append(
            f"Missing required columns for '{dataset_type}' dataset:\n"
            + "\n".join(f"  - '{c}'" for c in missing_cols)
            + f"\n\nColumns found in file:\n"
            + "\n".join(f"  - '{c}'" for c in df.columns.tolist())
        )

    # Check timestamp column is parseable
    ts_col = config["timestamp_col"]
    if ts_col in df.columns:
        try:
            pd.to_datetime(df[ts_col].dropna().head(3))
        except Exception:
            errors.append(
                f"Timestamp column '{ts_col}' contains values that cannot be "
                f"parsed as dates. Check the date format in the file."
            )

    if errors:
        return False, errors

    return True, []

# ─────────────────────────────────────────────
# STEP 2 — EXTRACT + TRANSFORM
# Reads full file, converts timestamps, maps columns, flags data quality.
# ─────────────────────────────────────────────

def transform(file_path: str, dataset_type: str):
    config = DATASET_CONFIGS[dataset_type]
    ts_col = config["timestamp_col"]

    print(f"  Reading file...")
    df = pd.read_excel(file_path, parse_dates=[ts_col])
    raw_count = len(df)
    print(f"  Read {raw_count:,} rows")

    # Convert timestamps Mountain Time → UTC
    print(f"  Converting timestamps Mountain Time → UTC...")
    df["timestamp_utc"] = (
        df[ts_col]
        .dt.tz_localize("America/Edmonton", ambiguous="infer", nonexistent="shift_forward")
        .dt.tz_convert("UTC")
        .dt.tz_localize(None)
    )

    # Drop duplicate timestamps
    before = len(df)
    df = df.drop_duplicates(subset=["timestamp_utc"])
    dupes_dropped = before - len(df)
    if dupes_dropped > 0:
        print(f"  Dropped {dupes_dropped:,} duplicate timestamps within file")

    # Rename columns per config
    df = df.rename(columns=config["column_map"])

    # Add fixed columns
    df["site_id"]      = SITE_ID
    df["data_quality"] = "ok"

    # Flag negative kW values if configured
    negative_count = 0
    if config["flag_negative_kw"] and config["kw_columns"]:
        kw_present    = [c for c in config["kw_columns"] if c in df.columns]
        negative_mask = (df[kw_present] < 0).any(axis=1)
        df.loc[negative_mask, "data_quality"] = "negative_kw"
        negative_count = int(negative_mask.sum())

    # Solar-specific transforms
    if dataset_type == "solar":
        if "collector_active_raw" in df.columns:
            df["collector_active"] = df["collector_active_raw"].apply(
                lambda x: bool(x > 0) if pd.notna(x) else None
            )
        if "alarm_raw" in df.columns:
            df["alarm_flag"] = df["alarm_raw"].apply(
                lambda x: None if (pd.isna(x) or x == 0) else str(int(x))
            )
            df.loc[df["alarm_flag"].notna(), "data_quality"] = "alarm"

    # Sort by timestamp
    df = df.sort_values("timestamp_utc").reset_index(drop=True)

    print(f"  Clean rows ready:      {len(df):,}")
    print(f"  Flagged 'ok':          {(df['data_quality'] == 'ok').sum():,}")
    if negative_count > 0:
        print(f"  Flagged 'negative_kw': {negative_count:,}")
    if dataset_type == "solar":
        alarm_count = (df["data_quality"] == "alarm").sum()
        if alarm_count > 0:
            print(f"  Flagged 'alarm':       {alarm_count:,}")

    return df, raw_count

# ─────────────────────────────────────────────
# STEP 3 — LOAD
# Creates upload_batch record, skips duplicate timestamps, bulk inserts.
# ─────────────────────────────────────────────

def load(df: pd.DataFrame, dataset_type: str, file_path: str, conn):
    config    = DATASET_CONFIGS[dataset_type]
    table     = config["table"]
    db_cols   = [c for c in config["db_columns"] if c in df.columns or c in ["upload_batch_id"]]

    # Get user_id for audit record
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 user_id FROM users ORDER BY user_id")
    row     = cursor.fetchone()
    user_id = row[0] if row else None

    # Create upload_batch record
    cursor.execute("""
        INSERT INTO upload_batches
            (uploaded_by_user_id, file_name, blob_url, data_type,
             site_id, row_count, status, uploaded_at)
        OUTPUT INSERTED.batch_id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        os.path.basename(file_path),
        "local-etl-pipeline",
        dataset_type,
        SITE_ID,
        len(df),
        "processing",
        datetime.now(timezone.utc).replace(tzinfo=None)
    ))
    batch_id = cursor.fetchone()[0]
    conn.commit()
    print(f"  Upload batch created — batch_id: {batch_id}")

    # Check for existing timestamps to skip (duplicate prevention)
    print(f"  Checking for existing timestamps in {table}...")
    cursor.execute(
        f"SELECT timestamp_utc FROM {table} WHERE site_id = ?", SITE_ID
    )
    existing = set(str(r[0])[:19] for r in cursor.fetchall())

    before_dedup = len(df)
    df = df[~df["timestamp_utc"].astype(str).str[:19].isin(existing)].copy()
    skipped = before_dedup - len(df)

    if skipped > 0:
        print(f"  Skipped {skipped:,} rows already in database (duplicate timestamps)")

    if len(df) == 0:
        print(f"  All rows already exist in database — nothing to insert")
        _mark_batch(conn, batch_id, "complete", 0, skipped)
        return batch_id, 0, skipped

    # Add batch_id to dataframe
    df["upload_batch_id"] = batch_id

    # Build INSERT SQL
    cols_to_insert  = [c for c in config["db_columns"] if c in df.columns]
    col_names       = ", ".join(cols_to_insert)
    placeholders    = ", ".join(["?" for _ in cols_to_insert])
    insert_sql      = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})"

    # Replace NaN with None
    df_insert = df[cols_to_insert].where(pd.notnull(df[cols_to_insert]), None)

    # Bulk insert in batches
    print(f"  Inserting {len(df):,} rows into {table} in batches of {BATCH_SIZE}...")
    cursor.fast_executemany = False
    inserted     = 0
    total        = len(df_insert)
    total_chunks = (total + BATCH_SIZE - 1) // BATCH_SIZE

    for i in range(0, total, BATCH_SIZE):
        chunk = df_insert.iloc[i:i + BATCH_SIZE]
        rows  = [tuple(row) for row in chunk.itertuples(index=False)]
        try:
            cursor.executemany(insert_sql, rows)
            conn.commit()
            inserted += len(rows)
            chunk_num = (i // BATCH_SIZE) + 1
            print(f"  Chunk {chunk_num}/{total_chunks} — {inserted:,}/{total:,} rows", end="\r")
        except pyodbc.OperationalError:
            print(f"\n  Connection lost — reconnecting...")
            conn.close()
            conn = get_connection()
            cursor = conn.cursor()
            cursor.fast_executemany = False
            cursor.executemany(insert_sql, rows)
            conn.commit()
            inserted += len(rows)

    print(f"\n  ✅ {inserted:,} rows inserted into {table}")

    _mark_batch(conn, batch_id, "complete", inserted, skipped)
    cursor.close()

    return batch_id, inserted, skipped

def _mark_batch(conn, batch_id, status, inserted, skipped):
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE upload_batches
        SET status = ?, processed_at = ?, row_count = ?
        WHERE batch_id = ?
    """, (
        status,
        datetime.now(timezone.utc).replace(tzinfo=None),
        inserted,
        batch_id
    ))
    conn.commit()
    cursor.close()

def _fail_batch(conn, batch_id, error_msg):
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE upload_batches
        SET status = 'failed', error_message = ?, processed_at = ?
        WHERE batch_id = ?
    """, (error_msg, datetime.now(timezone.utc).replace(tzinfo=None), batch_id))
    conn.commit()
    cursor.close()

# ─────────────────────────────────────────────
# run_etl() — Main entry point
# Called by Azure Function in Sprint 4, or from command line for testing.
# Always returns a structured result dict — never raises exceptions.
# ─────────────────────────────────────────────

def run_etl(file_path: str, dataset_type: str) -> dict:
    """
    Main ETL entry point. Called by Sprint 4 Azure Function after file upload.

    Args:
        file_path:    Local path to the .xlsx file
        dataset_type: "greenhouse", "solar", or "weather"

    Returns:
        {
            "status":        "success" | "failed",
            "dataset_type":  str,
            "file_name":     str,
            "rows_read":     int,
            "rows_inserted": int,
            "rows_skipped":  int,
            "batch_id":      int | None,
            "errors":        [str],
            "duration_sec":  int,
        }
    """

    start_time = datetime.now()
    result = {
        "status":        "failed",
        "dataset_type":  dataset_type,
        "file_name":     os.path.basename(file_path),
        "rows_read":     0,
        "rows_inserted": 0,
        "rows_skipped":  0,
        "batch_id":      None,
        "errors":        [],
        "duration_sec":  0,
    }

    print(f"\n{'='*60}")
    print(f"GBTAC ETL Pipeline")
    print(f"{'='*60}")
    print(f"File:         {os.path.basename(file_path)}")
    print(f"Dataset type: {dataset_type}")
    print(f"{'='*60}")

    # ── Step 1: Validate ──────────────────────────────────────
    print(f"\n[1/3] Validating file...")
    valid, errors = validate(file_path, dataset_type)

    if not valid:
        print(f"\n❌ VALIDATION FAILED:")
        for e in errors:
            print(f"   {e}")
        result["errors"] = errors
        result["duration_sec"] = (datetime.now() - start_time).seconds
        return result

    print(f"  ✅ Validation passed")

    # ── Step 2: Transform ─────────────────────────────────────
    print(f"\n[2/3] Transforming data...")
    try:
        df, raw_count = transform(file_path, dataset_type)
        result["rows_read"] = raw_count
    except Exception as e:
        error_msg = f"Transform failed: {e}"
        print(f"\n❌ {error_msg}")
        result["errors"] = [error_msg]
        result["duration_sec"] = (datetime.now() - start_time).seconds
        return result

    # ── Step 3: Load ──────────────────────────────────────────
    print(f"\n[3/3] Loading into database...")
    try:
        conn = get_connection()
        print(f"  ✅ Connected to sql-gbtac-dev")
    except Exception as e:
        error_msg = f"Database connection failed: {e}. Make sure you ran: az login"
        print(f"\n❌ {error_msg}")
        result["errors"] = [error_msg]
        result["duration_sec"] = (datetime.now() - start_time).seconds
        return result

    batch_id = None
    try:
        batch_id, inserted, skipped = load(df, dataset_type, file_path, conn)
        result["batch_id"]      = batch_id
        result["rows_inserted"] = inserted
        result["rows_skipped"]  = skipped
        result["status"]        = "success"
    except Exception as e:
        error_msg = f"Load failed: {e}"
        print(f"\n❌ {error_msg}")
        result["errors"] = [error_msg]
        if batch_id:
            _fail_batch(conn, batch_id, error_msg)
    finally:
        conn.close()

    # ── Summary ───────────────────────────────────────────────
    result["duration_sec"] = (datetime.now() - start_time).seconds
    elapsed = result["duration_sec"]

    print(f"\n{'='*60}")
    if result["status"] == "success":
        print(f"✅ ETL COMPLETE")
    else:
        print(f"❌ ETL FAILED")
    print(f"{'='*60}")
    print(f"  Dataset type:   {dataset_type}")
    print(f"  File:           {os.path.basename(file_path)}")
    print(f"  Rows in file:   {result['rows_read']:,}")
    print(f"  Rows inserted:  {result['rows_inserted']:,}")
    print(f"  Rows skipped:   {result['rows_skipped']:,} (duplicates)")
    print(f"  Batch ID:       {result['batch_id']}")
    print(f"  Duration:       {elapsed}s")
    if result["errors"]:
        print(f"  Errors:")
        for e in result["errors"]:
            print(f"    - {e}")
    print(f"{'='*60}")

    return result

# ─────────────────────────────────────────────
# COMMAND LINE — for testing
# ─────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GBTAC ETL Pipeline")
    parser.add_argument("--file", required=True, help="Path to the .xlsx file")
    parser.add_argument("--type", required=True,
                        choices=["greenhouse", "solar", "weather"],
                        help="Dataset type")
    args = parser.parse_args()

    result = run_etl(file_path=args.file, dataset_type=args.type)

    # Exit with error code if failed (useful for CI/CD pipelines)
    sys.exit(0 if result["status"] == "success" else 1)
