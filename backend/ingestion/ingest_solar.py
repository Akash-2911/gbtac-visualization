"""
Sprint 2 Ticket 4 — Ingest Concentrated Solar Dataset
Resumable — skips already inserted rows by checking existing timestamps.

Usage:
  pip install pandas openpyxl pyodbc azure-identity --break-system-packages
  python ingest_solar.py
"""

import struct
import pandas as pd
import pyodbc
from azure.identity import AzureCliCredential

EXCEL_FILE = "2023_07_24_Nov_to_July_24_Sprung_CS.xlsx"
SHEET_NAME = "data (77)"
SITE_ID    = 1
CONN_STR = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=sqlsrv-gbtac-dev1.database.windows.net,1433;"
    "Database=sql-gbtac-dev;"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
)
BATCH_SIZE = 200

def get_token():
    credential = AzureCliCredential()
    token = credential.get_token("https://database.windows.net/.default")
    token_bytes = token.token.encode("utf-16-le")
    return struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

def get_connection():
    return pyodbc.connect(CONN_STR, attrs_before={1256: get_token()}, timeout=60)

def get_existing_count(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM solar_readings WHERE site_id = ?", SITE_ID)
    count = cursor.fetchone()[0]
    cursor.close()
    return count

def load_and_clean(filepath: str):
    print(f"Reading {filepath} ...")
    df = pd.read_excel(filepath, sheet_name=SHEET_NAME)
    print(f"  Raw rows: {len(df):,}")

    df = df.rename(columns={
        "Mountain Time":                     "timestamp_mt",
        "Available Sun Light Total (W/mҩ)":  "sunlight_wm2",
        "Collector T IN (у)":               "temp_in_c",
        "Flow1 (l/m)":                       "flow_rate_lm",
        "Collector 1 T OUT (у)":            "collector1_out_c",
        "Power Collected 1 (kW)":            "collector1_power_kw",
        "Flow2 (l/m)":                       "flow2_lm",
        "Collector 2 T OUT (у)":            "collector2_out_c",
        "Power Collected 2 (kW)":            "collector2_power_kw",
        "Collector Active":                  "collector_active_raw",
        "Alarms":                            "alarm_raw",
    })

    df["timestamp_mt"] = pd.to_datetime(df["timestamp_mt"])
    df["timestamp_utc"] = (
        df["timestamp_mt"]
        .dt.tz_localize("America/Denver", ambiguous="infer", nonexistent="shift_forward")
        .dt.tz_convert("UTC")
        .dt.tz_localize(None)
    )

    before = len(df)
    df = df.drop_duplicates(subset=["timestamp_utc"])
    print(f"  Dropped {before - len(df):,} duplicate timestamps")

    df["data_quality"]     = df["alarm_raw"].apply(lambda x: "ok" if x == 0 else "alarm")
    df["collector_active"] = df["collector_active_raw"].apply(lambda x: bool(x > 0))
    df["site_id"]          = SITE_ID

    df = df[[
        "site_id", "timestamp_utc", "sunlight_wm2",
        "collector1_power_kw", "collector2_power_kw",
        "temp_in_c", "collector1_out_c", "collector2_out_c",
        "flow_rate_lm", "collector_active",
        "alarm_raw", "data_quality",
    ]]

    df = df.sort_values("timestamp_utc").reset_index(drop=True)

    print(f"  Clean rows ready to insert: {len(df):,}")
    print(f"  Alarm rows: {(df['data_quality'] == 'alarm').sum():,}")
    print(f"  Date range: {df['timestamp_utc'].min()} → {df['timestamp_utc'].max()}")
    return df

INSERT_SQL = """
INSERT INTO solar_readings (
    site_id, timestamp_utc, sunlight_wm2,
    collector1_power_kw, collector2_power_kw,
    temp_in_c, collector1_out_c, collector2_out_c,
    flow_rate_lm, collector_active,
    alarm_flag, data_quality, upload_batch_id
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
"""

def make_row(r):
    alarm_flag = None if r.alarm_raw == 0 else str(int(r.alarm_raw))
    return (
        int(r.site_id),
        r.timestamp_utc.to_pydatetime(),
        float(r.sunlight_wm2),
        float(r.collector1_power_kw),
        float(r.collector2_power_kw),
        float(r.temp_in_c),
        float(r.collector1_out_c),
        float(r.collector2_out_c),
        float(r.flow_rate_lm),
        bool(r.collector_active),
        alarm_flag,
        str(r.data_quality),
        None,
    )

def insert_batches(df: pd.DataFrame):
    print("\nConnecting to Azure SQL ...")
    conn = get_connection()

    already = get_existing_count(conn)
    if already > 0:
        print(f"  Resuming — {already:,} rows already in DB, skipping those ...")
        df = df.iloc[already:].reset_index(drop=True)

    rows = [make_row(r) for r in df.itertuples(index=False)]
    total    = len(rows)
    inserted = 0

    if total == 0:
        print("All rows already inserted!")
        conn.close()
        return

    print(f"Inserting {total:,} remaining rows in batches of {BATCH_SIZE} ...")

    cursor = conn.cursor()
    cursor.fast_executemany = False

    for i in range(0, total, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        try:
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)
            print(f"  {inserted + already:,} / {total + already:,}", end="\r")
        except pyodbc.OperationalError:
            print(f"\n  Connection lost at {inserted + already:,} rows. Reconnecting ...")
            conn.close()
            conn = get_connection()
            cursor = conn.cursor()
            cursor.fast_executemany = False
            cursor.executemany(INSERT_SQL, batch)
            conn.commit()
            inserted += len(batch)

    cursor.close()
    conn.close()
    print(f"\nDone. {inserted + already:,} total rows in solar_readings.")

if __name__ == "__main__":
    df = load_and_clean(EXCEL_FILE)
    insert_batches(df)