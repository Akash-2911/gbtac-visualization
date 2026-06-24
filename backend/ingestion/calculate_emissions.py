"""
GBTAC Visualization Project
Sprint 2 — Ticket 5: Build Emissions Calculation Pipeline
File:    calculate_emissions.py
Author:  Aryan

What this script does:
  1. Connects to Azure SQL using Azure CLI auth (same as greenhouse + solar scripts)
  2. Reads the Alberta emission factor from emissions_factors table (configurable)
  3. Reads greenhouse_readings grouped by day
  4. For each day: calculates total kWh from Mains PA+PB+PC and multiplies by emission factor
  5. Inserts one row per day into emission_records table
  6. Prints a full summary report

Formula:
  total_kwh  = SUM(mains_pa_kw + mains_pb_kw + mains_pc_kw) / 60
  kg_co2e    = total_kwh × kg_co2_per_kwh (from emissions_factors table)

Why Mains only:
  Mains PA/PB/PC measure total power drawn from the Alberta grid.
  That is the figure that drives CO2 emissions.
  Negative values (solar exporting to grid) are included — they reduce net emissions.

Usage:
  python calculate_emissions.py
  python calculate_emissions.py --year 2024   (use a different emission factor year)
"""

import struct
import sys
import argparse
from datetime import datetime, timezone
import pyodbc
from azure.identity import AzureCliCredential

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

SITE_ID = 1   # ARK Net Zero Campus

CONN_STR = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=sqlsrv-gbtac-dev1.database.windows.net,1433;"
    "Database=sql-gbtac-dev;"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
)

# ─────────────────────────────────────────────
# AZURE CLI AUTH — same as greenhouse + solar
# ─────────────────────────────────────────────

def get_token():
    credential = AzureCliCredential()
    token = credential.get_token("https://database.windows.net/.default")
    token_bytes = token.token.encode("utf-16-le")
    return struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

def get_connection():
    return pyodbc.connect(CONN_STR, attrs_before={1256: get_token()}, timeout=60)

# ─────────────────────────────────────────────
# STEP 1 — CONNECT
# ─────────────────────────────────────────────

def connect(year):
    print(f"\n{'='*60}")
    print(f"GBTAC Emissions Calculation Pipeline")
    print(f"{'='*60}")
    print(f"\n[1/5] Connecting to Azure SQL (Azure CLI auth)...")

    try:
        conn = get_connection()
        print(f"      ✅ Connected to sql-gbtac-dev")
        return conn
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("      Make sure you ran: az login")
        sys.exit(1)

# ─────────────────────────────────────────────
# STEP 2 — READ EMISSION FACTOR FROM DB
# Configurable by year — not hardcoded
# ─────────────────────────────────────────────

def get_emission_factor(conn, year):
    print(f"\n[2/5] Reading emission factor for year {year}...")

    cursor = conn.cursor()
    cursor.execute("""
        SELECT factor_id, kg_co2_per_kwh, source
        FROM emissions_factors
        WHERE year = ?
    """, year)

    row = cursor.fetchone()

    if not row:
        print(f"\n❌ No emission factor found for year {year} in emissions_factors table.")
        print(f"      Available years:")
        cursor.execute("SELECT year, kg_co2_per_kwh FROM emissions_factors ORDER BY year")
        for r in cursor.fetchall():
            print(f"        {r[0]}: {r[1]} kg CO2/kWh")
        print(f"\n      Run with: python calculate_emissions.py --year <year>")
        conn.close()
        sys.exit(1)

    factor_id, kg_co2_per_kwh, source = row
    print(f"      ✅ Factor found:")
    print(f"         Year:   {year}")
    print(f"         Factor: {kg_co2_per_kwh} kg CO2/kWh")
    print(f"         Source: {source}")
    print(f"         Factor ID: {factor_id}")

    return factor_id, float(kg_co2_per_kwh)

# ─────────────────────────────────────────────
# STEP 3 — READ GREENHOUSE DATA GROUPED BY DAY
# Only uses Mains PA + PB + PC (total grid draw)
# Negative values included (solar export = carbon credit)
# Excludes rows flagged as suspect (data_quality != 'ok' AND != 'negative_kw')
# ─────────────────────────────────────────────

def read_daily_energy(conn):
    print(f"\n[3/5] Reading greenhouse_readings grouped by day...")
    print(f"      Using: Mains PA + PB + PC (total grid draw)")
    print(f"      Excluding: data_quality = 'suspect' rows only")

    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            CAST(timestamp_utc AS DATE)             AS reading_date,
            -- Sum all three Mains panels, divide by 60 to convert kW/min → kWh
            -- ISNULL handles any NULL Mains readings gracefully (treats as 0)
            SUM(
                ISNULL(mains_pa_kw, 0) +
                ISNULL(mains_pb_kw, 0) +
                ISNULL(mains_pc_kw, 0)
            ) / 60.0                                AS total_kwh,
            COUNT(*)                                AS reading_count
        FROM greenhouse_readings
        WHERE site_id = ?
          AND data_quality IN ('ok', 'negative_kw')  -- exclude only 'suspect'
        GROUP BY CAST(timestamp_utc AS DATE)
        ORDER BY reading_date
    """, SITE_ID)

    rows = cursor.fetchall()
    cursor.close()

    if not rows:
        print(f"\n❌ No greenhouse readings found for site_id = {SITE_ID}")
        print(f"      Make sure the greenhouse ingestion script ran successfully first.")
        conn.close()
        sys.exit(1)

    print(f"      ✅ Found {len(rows)} days of data")
    print(f"      Date range: {rows[0][0]} → {rows[-1][0]}")

    return rows

# ─────────────────────────────────────────────
# STEP 4 — CALCULATE + INSERT INTO emission_records
# One row per day
# Skips days already calculated (resumable)
# ─────────────────────────────────────────────

def calculate_and_insert(conn, daily_rows, factor_id, kg_co2_per_kwh):
    print(f"\n[4/5] Calculating emissions and inserting into emission_records...")

    # Check what's already been calculated (resumable)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT reading_date FROM emission_records
        WHERE site_id = ? AND factor_id = ?
    """, SITE_ID, factor_id)

    already_done = set(str(row[0]) for row in cursor.fetchall())

    if already_done:
        print(f"      ℹ️  {len(already_done)} days already calculated — skipping those")

    INSERT_SQL = """
        INSERT INTO emission_records
            (site_id, reading_date, total_kwh, kg_co2e, factor_id, calculated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """

    inserted      = 0
    skipped       = 0
    total_kwh_all = 0.0
    total_co2_all = 0.0
    calculated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    # Stats for summary
    max_co2_day   = None
    max_co2_val   = float('-inf')
    min_co2_day   = None
    min_co2_val   = float('inf')

    for reading_date, total_kwh, reading_count in daily_rows:
        date_str = str(reading_date)

        # Skip if already calculated
        if date_str in already_done:
            skipped += 1
            continue

        # Core calculation
        total_kwh_float = float(total_kwh)
        kg_co2e         = round(total_kwh_float * kg_co2_per_kwh, 4)
        total_kwh_round = round(total_kwh_float, 4)

        # Track stats
        total_kwh_all += total_kwh_float
        total_co2_all += kg_co2e

        if kg_co2e > max_co2_val:
            max_co2_val = kg_co2e
            max_co2_day = date_str
        if kg_co2e < min_co2_val:
            min_co2_val = kg_co2e
            min_co2_day = date_str

        # Insert row
        cursor.execute(INSERT_SQL, (
            SITE_ID,
            reading_date,
            total_kwh_round,
            kg_co2e,
            factor_id,
            calculated_at,
        ))
        inserted += 1

        print(f"      {date_str}  |  {total_kwh_round:>10.2f} kWh  |  {kg_co2e:>8.2f} kg CO2e  |  {reading_count} readings")

    conn.commit()
    cursor.close()

    return inserted, skipped, total_kwh_all, total_co2_all, max_co2_day, max_co2_val, min_co2_day, min_co2_val

# ─────────────────────────────────────────────
# STEP 5 — VERIFY
# ─────────────────────────────────────────────

def verify(conn):
    print(f"\n[5/5] Verifying emission_records...")

    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            COUNT(*)            AS total_days,
            MIN(reading_date)   AS from_date,
            MAX(reading_date)   AS to_date,
            SUM(total_kwh)      AS total_kwh,
            SUM(kg_co2e)        AS total_co2e
        FROM emission_records
        WHERE site_id = ?
    """, SITE_ID)

    row = cursor.fetchone()
    cursor.close()

    print(f"      ✅ emission_records now contains:")
    print(f"         Days:       {row[0]}")
    print(f"         From:       {row[1]}")
    print(f"         To:         {row[2]}")
    print(f"         Total kWh:  {float(row[3]):,.2f} kWh")
    print(f"         Total CO2:  {float(row[4]):,.2f} kg CO2e")

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    # Parse optional --year argument
    parser = argparse.ArgumentParser(description="GBTAC Emissions Calculation Pipeline")
    parser.add_argument("--year", type=int, default=2023,
                        help="Emission factor year to use (default: 2023)")
    args = parser.parse_args()

    start_time = datetime.now()

    # Step 1: Connect
    conn = connect(args.year)

    # Step 2: Get emission factor (configurable by year)
    factor_id, kg_co2_per_kwh = get_emission_factor(conn, args.year)

    # Step 3: Read daily energy totals from greenhouse_readings
    daily_rows = read_daily_energy(conn)

    # Step 4: Calculate and insert
    (inserted, skipped,
     total_kwh_all, total_co2_all,
     max_co2_day, max_co2_val,
     min_co2_day, min_co2_val) = calculate_and_insert(
        conn, daily_rows, factor_id, kg_co2_per_kwh
    )

    # Step 5: Verify
    verify(conn)

    conn.close()

    # ── Summary Report ──────────────────────────────────────
    elapsed = (datetime.now() - start_time).seconds
    print(f"\n{'='*60}")
    print(f"✅ EMISSIONS CALCULATION COMPLETE")
    print(f"{'='*60}")
    print(f"  Emission factor used:  {kg_co2_per_kwh} kg CO2/kWh (year {args.year})")
    print(f"  Days calculated:       {inserted}")
    print(f"  Days skipped:          {skipped} (already done)")
    print(f"  Total energy:          {total_kwh_all:,.2f} kWh")
    print(f"  Total CO2 emitted:     {total_co2_all:,.2f} kg CO2e")
    print(f"  Total CO2 (tonnes):    {total_co2_all/1000:,.3f} tCO2e")
    if max_co2_day:
        print(f"  Highest emission day:  {max_co2_day} ({max_co2_val:,.2f} kg CO2e)")
    if min_co2_day:
        print(f"  Lowest emission day:   {min_co2_day} ({min_co2_val:,.2f} kg CO2e)")
    print(f"  Time taken:            {elapsed}s")
    print(f"{'='*60}")
    print(f"\nVerify in Azure Query Editor:")
    print(f"  SELECT * FROM emission_records ORDER BY reading_date;")
    print(f"  SELECT SUM(kg_co2e) AS total_co2e FROM emission_records WHERE site_id = 1;")
    print(f"\nTo recalculate with a different year's factor:")
    print(f"  python calculate_emissions.py --year 2024")

if __name__ == "__main__":
    main()
