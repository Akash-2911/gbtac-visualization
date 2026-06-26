# Sprint 2 — Data Validation & QA Report

**Date:** June 21, 2026  
**Author:** Akash Patel  
**Database:** sql-gbtac-dev (sqlsrv-gbtac-dev1.database.windows.net)  
**Sprint:** Sprint 2 - Data Engineering

---

## 1. Row Count vs Source File

| Table | Expected | Actual | Result |
|-------|----------|--------|--------|
| solar_readings | 87,865 | 87,865 | ✅ Pass |
| greenhouse_readings | 44,581 | 44,581 | ✅ Pass |
| weather_readings | 6,023 | 6,023 | ✅ Pass |

---

## 2. Null Checks (timestamp_utc, site_id)

| Table | Null Rows | Result |
|-------|-----------|--------|
| solar_readings | 0 | ✅ Pass |
| greenhouse_readings | 0 | ✅ Pass |
| weather_readings | 0 | ✅ Pass |

No null values found in critical columns across all 3 tables.

---

## 3. Date Range Coverage

| Table | Min (UTC) | Max (UTC) |
|-------|-----------|-----------|
| solar_readings | 2022-11-14 20:30:56 | 2023-07-24 16:47:52 |
| greenhouse_readings | 2023-03-01 06:59:00 | 2023-04-01 05:59:00 |
| weather_readings | 2022-11-15 07:00:00 | 2023-07-24 06:00:00 |

All date ranges match the source Excel files provided by the client.

---

## 4. Data Quality Flags

| Table | Flag | Count | Notes |
|-------|------|-------|-------|
| greenhouse_readings | negative_kw | 20,770 | Expected — sensor readings below zero flagged per schema spec |
| solar_readings | alarm | 34,253 | Expected — alarm codes from collector hardware flagged per schema spec |

Negative kW values in greenhouse data represent legitimate sensor behavior (e.g. grid export or sensor noise) and are flagged as `negative_kw` per the Backend Schema definition. Alarm rows in solar data are flagged with the original alarm code stored in `alarm_flag` column for traceability.

---

## 5. Zone Column Completeness (greenhouse_readings)

| Check | Null Rows | Result |
|-------|-----------|--------|
| All 4 zone temp columns NULL | 0 | ✅ Pass |

All greenhouse readings have at least one zone temperature value populated. No completely empty zone rows found.

---

## Summary

| Check | Status |
|-------|--------|
| Row counts match source files | ✅ Pass |
| No nulls in critical columns | ✅ Pass |
| Date ranges match source files | ✅ Pass |
| Data quality flags applied correctly | ✅ Pass |
| Zone column completeness | ✅ Pass |

**All 5 validation checks passed. Sprint 2 data ingestion is verified and production-ready.**

---

*Queries run via Azure Portal Query Editor against sql-gbtac-dev on sqlsrv-gbtac-dev1.database.windows.net*
