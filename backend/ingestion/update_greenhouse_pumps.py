"""
GBTAC Visualization Project
Sprint 3/4 — Add missing pump/system columns to greenhouse_readings
File:    update_greenhouse_pumps.py
Author:  Akash

Purpose:
  Adds Sump, Tables+CSP, and Vertical Grow Bags data to existing rows
  in greenhouse_readings. This is an UPDATE-only script — it does NOT
  insert any new rows. It matches each Excel row to its existing DB row
  using timestamp_utc + site_id, then fills in just the 3 new columns.

Before running this script:
  1. Run these in SSMS first (adds the empty columns):
       ALTER TABLE greenhouse_readings ADD sump_pb_kw FLOAT NULL;
       ALTER TABLE greenhouse_readings ADD tables_csp_pb_kw FLOAT NULL;
       ALTER TABLE greenhouse_readings ADD vertical_grow_bags_pb_kw FLOAT NULL;

  2. Note current row count:
       SELECT COUNT(*) FROM greenhouse_readings WHERE site_id = 1;

Usage:
  python -m pip install pandas pyodbc openpyxl azure-identity
  az login
  python update_greenhouse_pumps.py
"""

import struct
import os
import sys
import pandas as pd
import pyodbc
from datetime import datetime
from azure.identity import AzureCliCredential

# ─────────────────────────────────────────────
# CONFIGURATION — update EXCEL_FILE to match your local path
# ─────────────────────────────────────────────

EXCEL_FILE = r"C:\SAIT\SEM 4\capstone\dataset\parse data"
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
# COLUMN MAPPING — Excel → DB (only the 3 new columns)
# ─────────────────────────────────────────────

COLUMN_MAP = {
    "Sump - PB [kW]":                 "sump_pb_kw",
    "Tables + CSP - PB [kW]":         "tables_csp_pb_kw",
    "Vertical Grow Bags - PB [kW]":   "vertical_grow_bags_pb_kw",
}

NEW_DB_COLUMNS = list(COLUMN_MAP.values())

# ─────────────────────────────────────────────
# AUTH — same method as Aryan's original script
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
    print(f"GBTAC Pump Column Update Script")
    print(f"{'='*60}")
    print(f"\n[1/5] Reading Excel file...")
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
# Same exact logic as Aryan's original ingestion script,
# so timestamps line up with what's already in the DB.
# ─────────────────────────────────────────────

def convert_to_utc(df):
    print(f"\n[2/5] Converting timestamps Mountain Time → UTC...")

    df["timestamp_utc"] = (
        df["Date & Time"]
        .dt.tz_localize("America/Edmonton", ambiguous="infer", nonexistent="shift_forward")
        .dt.tz_convert("UTC")
        .dt.tz_localize(None)
    )

    before = len(df)
    df = df.drop_duplicates(subset=["timestamp_utc"])
    dropped = before - len(df)
    if dropped > 0:
        print(f"      Dropped {dropped:,} duplicate timestamps (DST transition)")

    print(f"      ✅ Timestamps converted")
    print(f"      Range: {df['timestamp_utc'].min()} → {df['timestamp_utc'].max()}")
    return df

# ─────────────────────────────────────────────
# STEP 3 — MAP COLUMNS
# ─────────────────────────────────────────────

def map_columns(df):
    print(f"\n[3/5] Mapping pump/system columns...")
    df = df.rename(columns=COLUMN_MAP)
    df["site_id"] = SITE_ID

    missing = [c for c in NEW_DB_COLUMNS if c not in df.columns]
    if missing:
        print(f"\n❌ ERROR: Expected columns not found in Excel: {missing}")
        print("      Check the exact column header spelling in the source file.")
        sys.exit(1)

    print(f"      ✅ Mapped: {', '.join(NEW_DB_COLUMNS)}")
    return df

# ─────────────────────────────────────────────
# STEP 4 — UPDATE MATCHING ROWS (no inserts, no duplicates)
# ─────────────────────────────────────────────

UPDATE_SQL = """
UPDATE greenhouse_readings
SET sump_pb_kw = ?,
    tables_csp_pb_kw = ?,
    vertical_grow_bags_pb_kw = ?
WHERE timestamp_utc = ? AND site_id = ?
"""

def make_row(r):
    def clean(v):
        return float(v) if pd.notna(v) else None

    return (
        clean(r.sump_pb_kw),
        clean(r.tables_csp_pb_kw),
        clean(r.vertical_grow_bags_pb_kw),
        r.timestamp_utc.to_pydatetime(),
        int(r.site_id),
    )

def update_rows(conn, df):
    rows = [make_row(r) for r in df.itertuples(index=False)]
    total = len(rows)

    print(f"\n[4/5] Updating {total:,} rows in greenhouse_readings...")
    print(f"      Running in batches of {BATCH_SIZE}...")

    cursor = conn.cursor()
    cursor.fast_executemany = False
    updated = 0
    not_matched = 0

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        try:
            cursor.executemany(UPDATE_SQL, batch)
            conn.commit()
            updated += cursor.rowcount if cursor.rowcount and cursor.rowcount > 0 else len(batch)
            print(f"      {min(i + BATCH_SIZE, total):,} / {total:,} rows processed", end="\r")
        except pyodbc.OperationalError:
            print(f"\n      Connection lost — reconnecting...")
            conn.close()
            conn = get_connection()
            cursor = conn.cursor()
            cursor.fast_executemany = False
            cursor.executemany(UPDATE_SQL, batch)
            conn.commit()

    cursor.close()
    print(f"\n      ✅ Update batches sent for all {total:,} rows")
    return total

# ─────────────────────────────────────────────
# STEP 5 — VERIFY
# ─────────────────────────────────────────────

def verify(conn, before_count):
    print(f"\n[5/5] Verifying results...")
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM greenhouse_readings WHERE site_id = ?", SITE_ID)
    after_count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*) FROM greenhouse_readings 
        WHERE site_id = ? AND sump_pb_kw IS NOT NULL
    """, SITE_ID)
    filled_count = cursor.fetchone()[0]

    cursor.close()

    print(f"      Row count before update: {before_count:,}")
    print(f"      Row count after update:  {after_count:,}")
    if before_count == after_count:
        print(f"      ✅ Row count unchanged — no duplicates created")
    else:
        print(f"      ⚠️  WARNING: Row count changed! Investigate before trusting this data.")

    print(f"      Rows with sump_pb_kw filled in: {filled_count:,}")

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    start_time = datetime.now()

    df = read_excel(EXCEL_FILE)
    df = convert_to_utc(df)
    df = map_columns(df)

    print(f"\nConnecting to Azure SQL (Azure CLI auth)...")
    try:
        conn = get_connection()
        print(f"✅ Connected to sql-gbtac-dev")
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("\n      Make sure you ran: az login")
        print("      And install: python -m pip install azure-identity")
        sys.exit(1)

    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM greenhouse_readings WHERE site_id = ?", SITE_ID)
    before_count = cursor.fetchone()[0]
    cursor.close()

    try:
        update_rows(conn, df)
        verify(conn, before_count)
    except Exception as e:
        print(f"\n❌ Update failed: {e}")
        conn.close()
        sys.exit(1)

    conn.close()

    elapsed = (datetime.now() - start_time).seconds
    print(f"\n{'='*60}")
    print(f"✅ UPDATE COMPLETE")
    print(f"{'='*60}")
    print(f"  Time taken: {elapsed}s")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
