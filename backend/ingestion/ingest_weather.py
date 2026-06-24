"""
GBTAC Visualization Project
Sprint 2 - Ticket 2: Weather Data Ingestion
File:   backend/ingestion/ingest_weather.py
Author: Vedant
Date:   2026-06-22

Ingests Black Diamond weather station data into weather_readings table.
Uses Azure AD token auth (az login) — no hardcoded credentials.
Resumable: skips rows already in DB via ON CONFLICT / duplicate key handling.

Usage:
    cd backend/ingestion
    python ingest_weather.py
"""

import pandas as pd
import struct
import pyodbc
from azure.identity import AzureCliCredential
from datetime import timezone
import sys

# ── Config ────────────────────────────────────────────────────────────────────
EXCEL_FILE  = "2023_07_24_Black_Diamond_November_to_July_Data.xlsx"
SERVER      = "sqlsrv-gbtac-dev1.database.windows.net"
DATABASE    = "sql-gbtac-dev"
SITE_ID     = 1          # ARK Net Zero Campus (seeded in migration)
BATCH_SIZE  = 500        # rows per INSERT batch

# Outlier thresholds (Alberta climate bounds — generous but sane)
TEMP_MIN    = -50.0      # °C  — below this is sensor error
TEMP_MAX    =  45.0      # °C  — above this is sensor error
HUMIDITY_MIN =  0.0      # %
HUMIDITY_MAX = 100.0     # %
PRECIP_MIN   =  0.0      # mm  — negative precip is sensor error

# ── Step 1: Load Excel ─────────────────────────────────────────────────────────
print("=" * 60)
print("GBTAC Weather Ingestion — Sprint 2 Ticket 2")
print("=" * 60)

print(f"\n[1/5] Loading {EXCEL_FILE}...")
df = pd.read_excel(EXCEL_FILE, sheet_name=0)
raw_count = len(df)
print(f"      Rows loaded: {raw_count}")

# ── Step 2: Clean ──────────────────────────────────────────────────────────────
print(f"\n[2/5] Cleaning data...")

# Drop rows with null timestamps
before = len(df)
df = df.dropna(subset=['Date'])
dropped_null_ts = before - len(df)

# Rename columns to match DB schema
df = df.rename(columns={
    'Date':                       'timestamp_utc',
    'Air Temp. Inst. (°C)':       'air_temp_instant_c',
    'Air Temp. Min. (°C)':        'air_temp_min_c',
    'Air Temp. Max. (°C)':        'air_temp_max_c',
    'Relative Humidity Avg. (%)': 'humidity_pct',
    'Precip. (mm)':               'precipitation_mm',
})

# Drop the source flag column — not needed in DB
df = df.drop(columns=['Air Temp. Max. Source Flag'], errors='ignore')

# Convert timestamps to UTC (data is Mountain Time — UTC-7 MST)
df['timestamp_utc'] = pd.to_datetime(df['timestamp_utc'])
df['timestamp_utc'] = df['timestamp_utc'] + pd.Timedelta(hours=7)

# Flag outliers (mark as 'suspect' instead of dropping)
df['data_quality'] = 'ok'

temp_cols = ['air_temp_instant_c', 'air_temp_min_c', 'air_temp_max_c']
for col in temp_cols:
    mask = (df[col] < TEMP_MIN) | (df[col] > TEMP_MAX)
    df.loc[mask, 'data_quality'] = 'suspect'

humidity_mask = (df['humidity_pct'] < HUMIDITY_MIN) | (df['humidity_pct'] > HUMIDITY_MAX)
df.loc[humidity_mask, 'data_quality'] = 'suspect'

precip_mask = df['precipitation_mm'] < PRECIP_MIN
df.loc[precip_mask, 'data_quality'] = 'suspect'

suspect_count = (df['data_quality'] == 'suspect').sum()
clean_count   = len(df)

print(f"      Rows with null timestamps dropped : {dropped_null_ts}")
print(f"      Rows flagged as suspect (outliers): {suspect_count}")
print(f"      Rows ready to insert              : {clean_count}")
print(f"      Date range: {df['timestamp_utc'].min()} → {df['timestamp_utc'].max()}")

# ── Step 3: Connect to Azure SQL ───────────────────────────────────────────────
print(f"\n[3/5] Connecting to Azure SQL ({SERVER})...")

try:
    credential = AzureCliCredential()
    token = credential.get_token("https://database.windows.net/.default")
    token_bytes = token.token.encode("UTF-16-LE")
    token_struct = struct.pack(f'<I{len(token_bytes)}s', len(token_bytes), token_bytes)

    conn_str = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={SERVER};"
        f"DATABASE={DATABASE};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
    )
    conn = pyodbc.connect(conn_str, attrs_before={1256: token_struct})
    cursor = conn.cursor()
    print("      Connected successfully.")
except Exception as e:
    print(f"\n  ERROR: Could not connect to Azure SQL.")
    print(f"  Make sure you have run 'az login' first.")
    print(f"  Details: {e}")
    sys.exit(1)

# ── Step 4: Insert in batches ──────────────────────────────────────────────────
print(f"\n[4/5] Inserting {clean_count} rows in batches of {BATCH_SIZE}...")

INSERT_SQL = """
INSERT INTO weather_readings (
    site_id,
    timestamp_utc,
    air_temp_instant_c,
    air_temp_min_c,
    air_temp_max_c,
    humidity_pct,
    precipitation_mm,
    data_quality
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""

inserted   = 0
skipped    = 0
errors     = 0

rows = df[[
    'timestamp_utc',
    'air_temp_instant_c',
    'air_temp_min_c',
    'air_temp_max_c',
    'humidity_pct',
    'precipitation_mm',
    'data_quality'
]].values.tolist()

for i in range(0, len(rows), BATCH_SIZE):
    batch = rows[i:i + BATCH_SIZE]
    for row in batch:
        try:
            cursor.execute(INSERT_SQL, (
                SITE_ID,
                row[0],
                row[1],
                row[2],
                row[3],
                row[4],
                row[5],
                row[6],
            ))
            inserted += 1
        except pyodbc.IntegrityError:
            skipped += 1
        except Exception as e:
            errors += 1
            print(f"      Row error at {row[0]}: {e}")

    conn.commit()
    progress = min(i + BATCH_SIZE, len(rows))
    print(f"      Progress: {progress}/{len(rows)} rows processed...", end='\r')

print()

# ── Step 5: Summary ────────────────────────────────────────────────────────────
print(f"\n[5/5] Ingestion complete.")
print(f"      Raw rows in Excel file : {raw_count}")
print(f"      Rows after cleaning    : {clean_count}")
print(f"      Rows inserted          : {inserted}")
print(f"      Rows skipped (dupes)   : {skipped}")
print(f"      Rows with suspect flag : {suspect_count}")
print(f"      Errors                 : {errors}")

cursor.execute("SELECT COUNT(*) FROM weather_readings WHERE site_id = ?", SITE_ID)
db_count = cursor.fetchone()[0]
print(f"      Total rows in DB now   : {db_count}")

cursor.close()
conn.close()
print("\nDone. Ready to commit and push.")
print("=" * 60)