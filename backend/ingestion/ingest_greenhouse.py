"""
GBTAC Visualization Project
Sprint 2 — Ticket 3: Ingest Greenhouse Monitoring Dataset
File:    ingest_greenhouse.py
Author:  Aryan

Usage:
  python -m pip install pandas pyodbc openpyxl azure-identity
  az login
  python ingest_greenhouse.py
"""

import struct
import os
import sys
import pandas as pd
import pyodbc
from datetime import datetime, timezone
from azure.identity import AzureCliCredential

# ─────────────────────────────────────────────
# CONFIGURATION — only update EXCEL_FILE
# ─────────────────────────────────────────────

EXCEL_FILE = r"D:\SPRING 2026\CAPSTONE\2023.04.12 March Sprung Greenhouse Data.xlsx"
SITE_ID    = 1
BATCH_SIZE = 200

CONN_STR = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=sqlsrv-gbtac-dev1.database.windows.net,1433;"
    "Database=sql-gbtac-dev;"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
)

# ─────────────────────────────────────────────
# COLUMN MAPPING — Excel → DB
# ─────────────────────────────────────────────

COLUMN_MAP = {
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
    "Small Heater - PB [kW]":               "heater_small_kw",
    "Rinnai Instant Hot - PA [kW]":          "rinnai_hw_kw",
    "Mains - PA [kW]":                       "mains_pa_kw",
    "Mains - PB [kW]":                       "mains_pb_kw",
    "Mains - PC [kW]":                       "mains_pc_kw",
    "Superpump - PB [kW]":                   "superpump_kw",
    "Sand Filter - PA [kW]":                 "sand_filter_kw",
}

KW_DB_COLUMNS = [
    "chiller_pa_kw", "chiller_pb_kw",
    "lighting_pa_kw", "lighting_pb_kw", "lighting_pc_kw",
    "heater_big_kw", "heater_small_kw", "rinnai_hw_kw",
    "mains_pa_kw", "mains_pb_kw", "mains_pc_kw",
    "superpump_kw", "sand_filter_kw",
]

# ─────────────────────────────────────────────
# AUTH — same method as Akash's solar script
# ─────────────────────────────────────────────

def get_token():
    credential = AzureCliCredential()
    token = credential.get_token("https://database.windows.net/.default")
    token_bytes = token.token.encode("utf-16-le")
    return struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

def get_connection():
    return pyodbc.connect(CONN_STR, attrs_before={1256: get_token()}, timeout=60)

# ─────────────────────────────────────────────
# STEP 1 — READ EXCEL
# ─────────────────────────────────────────────

def read_excel(file_path):
    print(f"\n{'='*60}")
    print(f"GBTAC Greenhouse Ingestion Script")
    print(f"{'='*60}")
    print(f"\n[1/6] Reading Excel file...")
    print(f"      File: {file_path}")

    if not os.path.exists(file_path):
        print(f"\n❌ ERROR: File not found at:\n      {file_path}")
        print("      Update EXCEL_FILE at the top of the script.")
        sys.exit(1)

    df = pd.read_excel(file_path, parse_dates=["Date & Time"])
    print(f"      ✅ Read {len(df):,} rows, {len(df.columns)} columns")
    return df

# ─────────────────────────────────────────────
# STEP 2 — CONVERT TIMESTAMPS MT → UTC
# March 2023 DST: clocks spring forward Mar 12 at 2:00 AM
# ─────────────────────────────────────────────

def convert_to_utc(df):
    print(f"\n[2/6] Converting timestamps Mountain Time → UTC...")

    df["timestamp_utc"] = (
        df["Date & Time"]
        .dt.tz_localize("America/Edmonton", ambiguous="infer", nonexistent="shift_forward")
        .dt.tz_convert("UTC")
        .dt.tz_localize(None)
    )

    # Drop duplicates created by DST transition
    before = len(df)
    df = df.drop_duplicates(subset=["timestamp_utc"])
    dropped = before - len(df)
    if dropped > 0:
        print(f"      Dropped {dropped:,} duplicate timestamps (DST transition)")

    print(f"      ✅ Timestamps converted")
    print(f"      Sample: {df['Date & Time'].iloc[0]} MT → {df['timestamp_utc'].iloc[0]} UTC")
    print(f"      Range:  {df['timestamp_utc'].min()} → {df['timestamp_utc'].max()}")
    return df

# ─────────────────────────────────────────────
# STEP 3 — MAP COLUMNS + FLAG NEGATIVES
# ─────────────────────────────────────────────

def map_and_flag(df):
    print(f"\n[3/6] Mapping columns and flagging data quality...")

    df = df.rename(columns=COLUMN_MAP)
    df["site_id"]      = SITE_ID
    df["data_quality"] = "ok"

    kw_present    = [c for c in KW_DB_COLUMNS if c in df.columns]
    negative_mask = (df[kw_present] < 0).any(axis=1)
    df.loc[negative_mask, "data_quality"] = "negative_kw"

    negative_count = int(negative_mask.sum())
    print(f"      ✅ Rows flagged 'ok':          {len(df) - negative_count:,}")
    print(f"      ⚠️  Rows flagged 'negative_kw': {negative_count:,}")

    return df, negative_count

# ─────────────────────────────────────────────
# STEP 4 — GET EXISTING COUNT (resumable)
# ─────────────────────────────────────────────

def get_existing_count(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM greenhouse_readings WHERE site_id = ?", SITE_ID)
    count = cursor.fetchone()[0]
    cursor.close()
    return count

# ─────────────────────────────────────────────
# STEP 5 — CREATE UPLOAD BATCH RECORD
# ─────────────────────────────────────────────

def create_upload_batch(conn, row_count):
    print(f"\n[5/6] Creating upload_batches audit record...")

    # Get user_id from the DB based on logged-in account
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 user_id FROM users ORDER BY user_id")
    row = cursor.fetchone()
    user_id = row[0] if row else None

    cursor.execute("""
        INSERT INTO upload_batches 
            (uploaded_by_user_id, file_name, blob_url, data_type, 
             site_id, row_count, status, uploaded_at)
        OUTPUT INSERTED.batch_id
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        "2023.04.12 March Sprung Greenhouse Data.xlsx",
        "local-ingestion",
        "greenhouse",
        SITE_ID,
        row_count,
        "processing",
        datetime.now(timezone.utc).replace(tzinfo=None)
    ))

    batch_id = cursor.fetchone()[0]
    conn.commit()
    print(f"      ✅ Upload batch created — batch_id: {batch_id}")
    return batch_id

# ─────────────────────────────────────────────
# STEP 6 — INSERT ROWS
# ─────────────────────────────────────────────

INSERT_SQL = """
INSERT INTO greenhouse_readings (
    site_id, timestamp_utc,
    chiller_pa_kw, chiller_pb_kw,
    lighting_pa_kw, lighting_pb_kw, lighting_pc_kw,
    heater_big_kw, heater_small_kw, rinnai_hw_kw,
    mains_pa_kw, mains_pb_kw, mains_pc_kw,
    superpump_kw, sand_filter_kw,
    temp_se_c, temp_sw_c, temp_ne_c, temp_nw_c,
    humidity_se_pct, humidity_sw_pct, humidity_ne_pct, humidity_nw_pct,
    data_quality, upload_batch_id
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
"""

DB_COLUMNS = [
    "site_id", "timestamp_utc",
    "chiller_pa_kw", "chiller_pb_kw",
    "lighting_pa_kw", "lighting_pb_kw", "lighting_pc_kw",
    "heater_big_kw", "heater_small_kw", "rinnai_hw_kw",
    "mains_pa_kw", "mains_pb_kw", "mains_pc_kw",
    "superpump_kw", "sand_filter_kw",
    "temp_se_c", "temp_sw_c", "temp_ne_c", "temp_nw_c",
    "humidity_se_pct", "humidity_sw_pct", "humidity_ne_pct", "humidity_nw_pct",
    "data_quality", "upload_batch_id",
]

def make_row(r):
    return (
        int(r.site_id),
        r.timestamp_utc.to_pydatetime(),
        float(r.chiller_pa_kw)    if pd.notna(r.chiller_pa_kw)    else None,
        float(r.chiller_pb_kw)    if pd.notna(r.chiller_pb_kw)    else None,
        float(r.lighting_pa_kw)   if pd.notna(r.lighting_pa_kw)   else None,
        float(r.lighting_pb_kw)   if pd.notna(r.lighting_pb_kw)   else None,
        float(r.lighting_pc_kw)   if pd.notna(r.lighting_pc_kw)   else None,
        float(r.heater_big_kw)    if pd.notna(r.heater_big_kw)    else None,
        float(r.heater_small_kw)  if pd.notna(r.heater_small_kw)  else None,
        float(r.rinnai_hw_kw)     if pd.notna(r.rinnai_hw_kw)     else None,
        float(r.mains_pa_kw)      if pd.notna(r.mains_pa_kw)      else None,
        float(r.mains_pb_kw)      if pd.notna(r.mains_pb_kw)      else None,
        float(r.mains_pc_kw)      if pd.notna(r.mains_pc_kw)      else None,
        float(r.superpump_kw)     if pd.notna(r.superpump_kw)     else None,
        float(r.sand_filter_kw)   if pd.notna(r.sand_filter_kw)   else None,
        float(r.temp_se_c)        if pd.notna(r.temp_se_c)        else None,
        float(r.temp_sw_c)        if pd.notna(r.temp_sw_c)        else None,
        float(r.temp_ne_c)        if pd.notna(r.temp_ne_c)        else None,
        float(r.temp_nw_c)        if pd.notna(r.temp_nw_c)        else None,
        float(r.humidity_se_pct)  if pd.notna(r.humidity_se_pct)  else None,
        float(r.humidity_sw_pct)  if pd.notna(r.humidity_sw_pct)  else None,
        float(r.humidity_ne_pct)  if pd.notna(r.humidity_ne_pct)  else None,
        float(r.humidity_nw_pct)  if pd.notna(r.humidity_nw_pct)  else None,
        str(r.data_quality),
        int(r.upload_batch_id),
    )

def insert_rows(conn, df, batch_id, already_inserted):
    df["upload_batch_id"] = batch_id
    df = df[DB_COLUMNS].copy()

    rows  = [make_row(r) for r in df.itertuples(index=False)]
    total = len(rows)

    # Resume — skip already inserted rows
    if already_inserted > 0:
        print(f"\n[6/6] Resuming — skipping {already_inserted:,} already inserted rows...")
        rows = rows[already_inserted:]
        print(f"      {len(rows):,} rows remaining to insert...")
    else:
        print(f"\n[6/6] Inserting {total:,} rows into greenhouse_readings...")

    print(f"      Inserting in batches of {BATCH_SIZE}...")

    cursor   = conn.cursor()
    cursor.fast_executemany = False
    inserted = 0

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        try:
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)
            print(f"      {inserted + already_inserted:,} / {total + already_inserted:,} rows", end="\r")
        except pyodbc.OperationalError:
            print(f"\n      Connection lost — reconnecting...")
            conn.close()
            conn = get_connection()
            cursor = conn.cursor()
            cursor.fast_executemany = False
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)

    cursor.close()
    print(f"\n      ✅ All {inserted + already_inserted:,} rows inserted successfully")
    return inserted

# ─────────────────────────────────────────────
# MARK BATCH COMPLETE
# ─────────────────────────────────────────────

def mark_batch_complete(conn, batch_id, total):
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE upload_batches 
        SET status = 'complete', processed_at = ?, row_count = ?
        WHERE batch_id = ?
    """, (datetime.now(timezone.utc).replace(tzinfo=None), total, batch_id))
    conn.commit()

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    start_time = datetime.now()

    df = read_excel(EXCEL_FILE)
    raw_count = len(df)

    df = convert_to_utc(df)
    df, negative_count = map_and_flag(df)

    print(f"\n[4/6] Connecting to Azure SQL (Azure CLI auth)...")
    try:
        conn = get_connection()
        print(f"      ✅ Connected to sql-gbtac-dev")
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("\n      Make sure you ran: az login")
        print("      And install: python -m pip install azure-identity")
        sys.exit(1)

    already = get_existing_count(conn)
    if already > 0:
        print(f"      ℹ️  {already:,} rows already exist — will resume from there")

    batch_id = create_upload_batch(conn, raw_count)

    try:
        inserted = insert_rows(conn, df, batch_id, already)
        mark_batch_complete(conn, batch_id, inserted + already)
    except Exception as e:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE upload_batches SET status = 'failed', error_message = ?
            WHERE batch_id = ?
        """, (str(e), batch_id))
        conn.commit()
        print(f"\n❌ Insert failed: {e}")
        conn.close()
        sys.exit(1)

    conn.close()

    elapsed = (datetime.now() - start_time).seconds
    print(f"\n{'='*60}")
    print(f"✅ INGESTION COMPLETE")
    print(f"{'='*60}")
    print(f"  File:             2023.04.12 March Sprung Greenhouse Data.xlsx")
    print(f"  Rows in file:     {raw_count:,}")
    print(f"  Rows inserted:    {inserted:,}")
    print(f"  Flagged ok:       {inserted - negative_count:,}")
    print(f"  Flagged negative: {negative_count:,}")
    print(f"  Upload batch ID:  {batch_id}")
    print(f"  Time taken:       {elapsed}s")
    print(f"{'='*60}")
    print(f"\nVerify in Azure Query Editor:")
    print(f"  SELECT COUNT(*) FROM greenhouse_readings WHERE upload_batch_id = {batch_id};")
    print(f"  SELECT COUNT(*) FROM greenhouse_readings WHERE data_quality = 'negative_kw';")

if __name__ == "__main__":
    main()