"""
GBTAC Visualization Project
Sprint 5 — Ticket 3: Build Predictive Analytics — Energy Forecast
File:    forecast_energy.py
Author:  Aryan

What this script does:
  1. Pulls daily total kWh from emission_records table (already calculated)
  2. Fits an ARIMA time-series model on the historical data
  3. Forecasts the next 7 days of energy consumption
  4. Returns predictions with confidence intervals
  5. Saves forecast results to a new forecast_results table in Azure SQL

This output is what Akash's GET /ai/predict endpoint will call and return
to the frontend as a dashed line extension on the Energy dashboard chart.

Data note:
  Only 6 full days of real Mains sensor data exist (March 27 - April 1, 2023).
  ARIMA typically needs 30+ points for high accuracy. With 6 points the model
  will produce wide confidence intervals — this is expected and disclosed in
  the UI via the disclaimer field in the output.
  When Maeric provides more months of data, rerun this script — accuracy
  will improve automatically as the dataset grows.

ARIMA(p,d,q) parameters:
  p=1 (autoregression — use 1 lag)
  d=1 (differencing — make series stationary)
  q=0 (no moving average)
  These are conservative defaults for a small dataset.
  Auto-selection (auto_arima) is used if statsmodels is available.

Usage:
  python forecast_energy.py
  python forecast_energy.py --days 14   (forecast 14 days instead of 7)
  python forecast_energy.py --horizon 7 --save  (save results to DB)
"""

import struct
import sys
import argparse
import json
from datetime import datetime, timezone, timedelta
import pyodbc
from azure.identity import AzureCliCredential

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

SITE_ID = 1
DEFAULT_HORIZON = 7  # forecast 7 days ahead

CONN_STR = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=sqlsrv-gbtac-dev1.database.windows.net,1433;"
    "Database=sql-gbtac-dev;"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
)

# ─────────────────────────────────────────────
# AZURE CLI AUTH
# ─────────────────────────────────────────────

def get_token():
    credential = AzureCliCredential()
    token = credential.get_token("https://database.windows.net/.default")
    token_bytes = token.token.encode("utf-16-le")
    return struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

def get_connection():
    return pyodbc.connect(CONN_STR, attrs_before={1256: get_token()}, timeout=60)

# ─────────────────────────────────────────────
# STEP 1 — CREATE forecast_results TABLE (if not exists)
# Stores forecast output so Akash's /ai/predict endpoint
# can query it directly without rerunning the model each time.
# ─────────────────────────────────────────────

def ensure_forecast_table(conn):
    cursor = conn.cursor()
    cursor.execute("""
        IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = 'forecast_results'
        )
        BEGIN
            CREATE TABLE forecast_results (
                forecast_id     INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
                site_id         INT             NOT NULL,
                forecast_date   DATE            NOT NULL,
                predicted_kwh   DECIMAL(12,4)   NOT NULL,
                lower_bound     DECIMAL(12,4)   NOT NULL,
                upper_bound     DECIMAL(12,4)   NOT NULL,
                model_name      NVARCHAR(50)    NOT NULL DEFAULT 'ARIMA',
                training_days   INT             NOT NULL,
                generated_at    DATETIME2(0)    NOT NULL DEFAULT GETUTCDATE(),
                CONSTRAINT UQ_forecast_site_date UNIQUE (site_id, forecast_date)
            );
            CREATE NONCLUSTERED INDEX IX_forecast_site_date
                ON forecast_results (site_id, forecast_date);
        END
    """)
    conn.commit()
    cursor.close()
    print("      ✅ forecast_results table confirmed")

# ─────────────────────────────────────────────
# STEP 2 — PULL HISTORICAL DAILY kWh FROM DB
# Uses emission_records which already has daily total_kwh
# calculated from all energy systems — the most reliable
# source we have for total energy consumption per day.
# Only includes days with real data (total_kwh > 0)
# to exclude the pre-sensor-install zero days.
# ─────────────────────────────────────────────

def fetch_historical_data(conn):
    print(f"\n[2/5] Fetching historical daily energy data from emission_records...")

    cursor = conn.cursor()
    cursor.execute("""
    SELECT
        reading_date,
        total_kwh
    FROM emission_records
    WHERE site_id = ?
      AND total_kwh > 50        -- exclude partial days (< 50 kWh = incomplete day)
      AND data_note IS NULL
    ORDER BY reading_date ASC
""", SITE_ID)

    rows = cursor.fetchall()
    cursor.close()

    if not rows:
        print("❌ No historical energy data found in emission_records.")
        print("   Make sure calculate_emissions.py has been run first.")
        sys.exit(1)

    dates  = [row[0] for row in rows]
    values = [float(row[1]) for row in rows]

    print(f"      ✅ Found {len(rows)} days of historical data")
    print(f"      Date range: {dates[0]} → {dates[-1]}")
    print(f"      Daily kWh values: {[round(v, 2) for v in values]}")

    if len(rows) < 3:
        print(f"\n⚠️  WARNING: Only {len(rows)} data points found.")
        print(f"   ARIMA needs at least 3 points to fit.")
        print(f"   Forecast accuracy will be very low.")
        print(f"   Upload more months of greenhouse data to improve this.")

    return dates, values

# ─────────────────────────────────────────────
# STEP 3 — FIT ARIMA MODEL AND FORECAST
# Uses statsmodels ARIMA with conservative parameters
# suitable for small datasets.
# Falls back to simple moving average if statsmodels
# is not installed or ARIMA fails.
# ─────────────────────────────────────────────

def fit_and_forecast(dates, values, horizon):
    print(f"\n[3/5] Fitting ARIMA model and forecasting {horizon} days ahead...")

    last_date = dates[-1]
    n         = len(values)

    try:
        # Try ARIMA with statsmodels
        from statsmodels.tsa.arima.model import ARIMA
        import numpy as np

        # ARIMA(1,1,0) — conservative for small datasets
        # p=1: use 1 lag for autoregression
        # d=1: first-order differencing for stationarity
        # q=0: no moving average term
        # If we have enough data (10+), try auto-selecting better params
        if n >= 10:
            try:
                import pmdarima as pm
                auto_model = pm.auto_arima(
                    values,
                    start_p=0, start_q=0,
                    max_p=3,   max_q=3,
                    d=1,
                    stepwise=True,
                    suppress_warnings=True,
                    error_action='ignore'
                )
                order = auto_model.order
                print(f"      Auto-selected ARIMA order: {order}")
            except ImportError:
                order = (1, 1, 0)
                print(f"      Using default ARIMA order: {order} (install pmdarima for auto-selection)")
        else:
            order = (1, 1, 0)
            print(f"      Using default ARIMA order: {order} (small dataset)")

        model  = ARIMA(values, order=order)
        fitted = model.fit()

        # Generate forecast with confidence intervals
        forecast_result = fitted.get_forecast(steps=horizon)
        predictions     = forecast_result.predicted_mean.tolist()
        conf_int = forecast_result.conf_int(alpha=0.20)
        # Handle both DataFrame and ndarray output depending on statsmodels version
        import numpy as np
        if hasattr(conf_int, 'iloc'):
            lower_bounds = conf_int.iloc[:, 0].tolist()
            upper_bounds = conf_int.iloc[:, 1].tolist()
        else:
            conf_int_arr = np.array(conf_int)
            lower_bounds = conf_int_arr[:, 0].tolist()
            upper_bounds = conf_int_arr[:, 1].tolist()

        model_name = f"ARIMA{order}"
        print(f"      ✅ ARIMA model fitted successfully")
        print(f"      AIC: {fitted.aic:.2f}")

    except ImportError:
        # Fallback: simple moving average if statsmodels not installed
        print(f"      ⚠️  statsmodels not found — falling back to simple moving average")
        print(f"      Install statsmodels: python -m pip install statsmodels")

        avg        = sum(values) / len(values)
        std        = (sum((v - avg) ** 2 for v in values) / len(values)) ** 0.5

        predictions  = [avg] * horizon
        lower_bounds = [max(0, avg - 1.645 * std)] * horizon  # 90% CI lower
        upper_bounds = [avg + 1.645 * std] * horizon           # 90% CI upper
        model_name   = "MovingAverage"

    except Exception as e:
        print(f"      ⚠️  ARIMA failed: {e} — falling back to moving average")
        avg          = sum(values) / len(values)
        std          = (sum((v - avg) ** 2 for v in values) / len(values)) ** 0.5
        predictions  = [avg] * horizon
        lower_bounds = [max(0, avg - 1.645 * std)] * horizon
        upper_bounds = [avg + 1.645 * std] * horizon
        model_name   = "MovingAverage"

    # Build forecast rows — one per day
    forecast_rows = []
    for i in range(horizon):
        forecast_date  = last_date + timedelta(days=i + 1)
        predicted_kwh  = max(0, round(float(predictions[i]),  4))  # floor at 0
        lower_bound    = max(0, round(float(lower_bounds[i]), 4))
        upper_bound    = max(0, round(float(upper_bounds[i]), 4))

        forecast_rows.append({
            "forecast_date":  forecast_date,
            "predicted_kwh":  predicted_kwh,
            "lower_bound":    lower_bound,
            "upper_bound":    upper_bound,
            "model_name":     model_name,
            "training_days":  n,
        })

        print(f"      {forecast_date}  →  {predicted_kwh:.2f} kWh  "
              f"[{lower_bound:.2f} – {upper_bound:.2f}]")

    return forecast_rows, model_name

# ─────────────────────────────────────────────
# STEP 4 — SAVE FORECAST TO DB
# Upserts forecast rows into forecast_results table.
# Old forecasts for the same dates are replaced.
# ─────────────────────────────────────────────

def save_forecast(conn, forecast_rows):
    print(f"\n[4/5] Saving forecast to forecast_results table...")

    cursor = conn.cursor()

    for row in forecast_rows:
        # Delete existing forecast for this date if it exists
        cursor.execute("""
            DELETE FROM forecast_results
            WHERE site_id = ? AND forecast_date = ?
        """, SITE_ID, row["forecast_date"])

        # Insert new forecast
        cursor.execute("""
            INSERT INTO forecast_results
                (site_id, forecast_date, predicted_kwh, lower_bound,
                 upper_bound, model_name, training_days, generated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            SITE_ID,
            row["forecast_date"],
            row["predicted_kwh"],
            row["lower_bound"],
            row["upper_bound"],
            row["model_name"],
            row["training_days"],
            datetime.now(timezone.utc).replace(tzinfo=None),
        ))

    conn.commit()
    cursor.close()
    print(f"      ✅ {len(forecast_rows)} forecast rows saved")

# ─────────────────────────────────────────────
# STEP 5 — PRINT JSON OUTPUT
# This is the exact format Akash's /ai/predict endpoint
# will return to the frontend.
# Share this with Akash so he can match the response shape.
# ─────────────────────────────────────────────

def print_json_output(forecast_rows, dates, values, model_name):
    print(f"\n[5/5] Forecast output (JSON format for /ai/predict endpoint):")

    output = {
        "site_id":       SITE_ID,
        "model":         model_name,
        "training_days": len(values),
        "generated_at":  datetime.now(timezone.utc).isoformat(),
        "disclaimer":    (
            f"Forecast based on {len(values)} days of historical data. "
            f"Confidence intervals are wide due to limited training data. "
            f"Accuracy will improve as more months of greenhouse data are uploaded."
            if len(values) < 15 else
            f"Forecast based on {len(values)} days of historical data."
        ),
        "historical": [
            {
                "date":      str(dates[i]),
                "actual_kwh": round(values[i], 4),
            }
            for i in range(len(dates))
        ],
        "forecast": [
            {
                "date":          str(row["forecast_date"]),
                "predicted_kwh": row["predicted_kwh"],
                "lower_bound":   row["lower_bound"],
                "upper_bound":   row["upper_bound"],
            }
            for row in forecast_rows
        ],
    }

    print(json.dumps(output, indent=2, default=str))
    return output

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="GBTAC Energy Forecast — ARIMA Model")
    parser.add_argument("--days",    type=int, default=DEFAULT_HORIZON,
                        help=f"Number of days to forecast ahead (default: {DEFAULT_HORIZON})")
    parser.add_argument("--save",    action="store_true",
                        help="Save forecast results to forecast_results table in Azure SQL")
    parser.add_argument("--no-db",   action="store_true",
                        help="Run without DB connection (uses sample data for testing)")
    args = parser.parse_args()

    start_time = datetime.now()

    print(f"\n{'='*60}")
    print(f"GBTAC Energy Forecast — ARIMA Model")
    print(f"{'='*60}")
    print(f"Forecast horizon: {args.days} days")
    print(f"Save to DB:       {args.save}")

    if args.no_db:
        # Sample data mode — useful for testing without DB connection
        print(f"\n[1/5] Running in --no-db mode with sample data...")
        from datetime import date
        dates  = [date(2023, 3, 27) + timedelta(days=i) for i in range(6)]
        values = [12.80, 167.49, 167.18, 157.91, 171.57, 51.31]
        print(f"      Using sample data: {list(zip([str(d) for d in dates], values))}")
        conn   = None
    else:
        # Step 1: Connect
        print(f"\n[1/5] Connecting to Azure SQL...")
        try:
            conn = get_connection()
            print(f"      ✅ Connected to sql-gbtac-dev")
            ensure_forecast_table(conn)
        except Exception as e:
            print(f"\n❌ Connection failed: {e}")
            print("      Make sure you ran: az login")
            print("      Or use --no-db flag for offline testing")
            sys.exit(1)

        # Step 2: Fetch historical data
        dates, values = fetch_historical_data(conn)

    # Step 3: Fit model and forecast
    forecast_rows, model_name = fit_and_forecast(dates, values, args.days)

    # Step 4: Save to DB (optional)
    if args.save and conn:
        save_forecast(conn, forecast_rows)
    elif not args.save:
        print(f"\n[4/5] Skipping DB save (run with --save to persist results)")

    # Step 5: Print JSON output
    output = print_json_output(forecast_rows, dates, values, model_name)

    if conn:
        conn.close()

    elapsed = (datetime.now() - start_time).seconds
    print(f"\n{'='*60}")
    print(f"✅ FORECAST COMPLETE")
    print(f"{'='*60}")
    print(f"  Model:           {model_name}")
    print(f"  Training days:   {len(values)}")
    print(f"  Forecast days:   {args.days}")
    print(f"  Time taken:      {elapsed}s")
    print(f"{'='*60}")
    print(f"\nNext steps:")
    print(f"  1. Share the JSON output above with Akash for /ai/predict endpoint shape")
    print(f"  2. Run with --save to persist results to forecast_results table")
    print(f"  3. Install statsmodels if not already: python -m pip install statsmodels pmdarima")
    print(f"  4. Rerun when Maeric uploads more months of data for better accuracy")

if __name__ == "__main__":
    main()
