-- ============================================================
-- GBTAC Visualization Project — Azure SQL Migration Script
-- File:    001_gbtac_create_all_tables.sql
-- Ticket:  Sprint 2, Ticket 1 — Create Azure SQL database and tables
-- Author:  Aryan
-- Date:    2026-06-14
-- DB:      Azure SQL Database (SQL Server 2019 / Compatibility Level 150)
-- Notes:   Run tables in order — foreign key dependencies must be satisfied.
--          All timestamps stored in UTC. MT conversion at application layer.
-- ============================================================


-- ============================================================
-- STEP 0 — Set database options (run once after provisioning)
-- ============================================================

-- Confirm compatibility level is 150 (SQL Server 2019)
-- ALTER DATABASE [gbtac_db] SET COMPATIBILITY_LEVEL = 150;

-- Confirm collation (set at DB creation time in Azure Portal):
-- SQL_Latin1_General_CP1_CI_AS


-- ============================================================
-- STEP 1 — sites
-- Must be created first — referenced by all reading tables
--          and upload_batches.
-- ============================================================

CREATE TABLE sites (
    site_id     INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
    site_name   NVARCHAR(100)   NOT NULL,
    location    NVARCHAR(200)   NOT NULL,
    city        NVARCHAR(100)   NOT NULL,
    province    NVARCHAR(50)    NOT NULL,
    timezone    NVARCHAR(50)    NOT NULL DEFAULT 'America/Edmonton',
    active      BIT             NOT NULL DEFAULT 1,
    created_at  DATETIME2(0)    NOT NULL DEFAULT GETUTCDATE()
);
GO


-- ============================================================
-- STEP 2 — users
-- Must be created before upload_batches (FK: uploaded_by_user_id).
-- Authentication via Microsoft Entra ID — entra_oid links JWT → row.
-- ============================================================

CREATE TABLE users (
    user_id      INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    entra_oid    NVARCHAR(100)  NOT NULL,
    display_name NVARCHAR(150)  NOT NULL,
    email        NVARCHAR(200)  NOT NULL,
    role         NVARCHAR(20)   NOT NULL
        CONSTRAINT CHK_users_role CHECK (role IN ('admin', 'staff', 'viewer')),
    active       BIT            NOT NULL DEFAULT 1,
    last_login   DATETIME2(0)   NULL,
    created_at   DATETIME2(0)   NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_users_entra_oid UNIQUE (entra_oid),
    CONSTRAINT UQ_users_email     UNIQUE (email)
);
GO


-- ============================================================
-- STEP 3 — upload_batches
-- Tracks every admin file upload. Referenced by all reading tables
-- via upload_batch_id for full traceability.
-- ============================================================

CREATE TABLE upload_batches (
    batch_id             INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    uploaded_by_user_id  INT            NOT NULL REFERENCES users(user_id),
    file_name            NVARCHAR(255)  NOT NULL,
    blob_url             NVARCHAR(500)  NOT NULL,
    data_type            NVARCHAR(20)   NOT NULL
        CONSTRAINT CHK_upload_batches_data_type
            CHECK (data_type IN ('greenhouse', 'solar', 'weather')),
    site_id              INT            NOT NULL REFERENCES sites(site_id),
    row_count            INT            NULL,
    status               NVARCHAR(20)   NOT NULL DEFAULT 'pending'
        CONSTRAINT CHK_upload_batches_status
            CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
    uploaded_at          DATETIME2(0)   NOT NULL DEFAULT GETUTCDATE(),
    processing_started   DATETIME2(0)   NULL,
    processed_at         DATETIME2(0)   NULL,
    error_message        NVARCHAR(MAX)  NULL
);
GO


-- ============================================================
-- STEP 4 — greenhouse_readings
-- Minute-by-minute greenhouse energy and zone sensor data.
-- Primary data table — will grow to 10M+ rows.
-- ============================================================

CREATE TABLE greenhouse_readings (
    reading_id      BIGINT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    site_id         INT             NOT NULL REFERENCES sites(site_id),
    timestamp_utc   DATETIME2(0)    NOT NULL,

    -- Energy systems (kW per minute reading)
    chiller_pa_kw   DECIMAL(10,4)   NULL,   -- Chiller Panel A
    chiller_pb_kw   DECIMAL(10,4)   NULL,   -- Chiller Panel B
    lighting_pa_kw  DECIMAL(10,4)   NULL,   -- Lighting Panel A
    lighting_pb_kw  DECIMAL(10,4)   NULL,   -- Lighting Panel B
    lighting_pc_kw  DECIMAL(10,4)   NULL,   -- Lighting Panel C
    heater_big_kw   DECIMAL(10,4)   NULL,   -- Big Heater
    heater_small_kw DECIMAL(10,4)   NULL,   -- Small Heater
    rinnai_hw_kw    DECIMAL(10,4)   NULL,   -- Rinnai Hot Water
    mains_pa_kw     DECIMAL(10,4)   NULL,   -- Mains Panel A
    mains_pb_kw     DECIMAL(10,4)   NULL,   -- Mains Panel B
    mains_pc_kw     DECIMAL(10,4)   NULL,   -- Mains Panel C
    superpump_kw    DECIMAL(10,4)   NULL,   -- Superpump
    sand_filter_kw  DECIMAL(10,4)   NULL,   -- Sand Filter

    -- Zone temperatures (°C)
    temp_se_c       DECIMAL(6,2)    NULL,   -- Temperature SE zone
    temp_sw_c       DECIMAL(6,2)    NULL,   -- Temperature SW zone
    temp_ne_c       DECIMAL(6,2)    NULL,   -- Temperature NE zone
    temp_nw_c       DECIMAL(6,2)    NULL,   -- Temperature NW zone

    -- Zone humidity (%)
    humidity_se_pct DECIMAL(6,2)    NULL,   -- Humidity SE zone
    humidity_sw_pct DECIMAL(6,2)    NULL,   -- Humidity SW zone
    humidity_ne_pct DECIMAL(6,2)    NULL,   -- Humidity NE zone
    humidity_nw_pct DECIMAL(6,2)    NULL,   -- Humidity NW zone

    -- Data quality & traceability
    data_quality    NVARCHAR(20)    NULL DEFAULT 'ok',  -- ok / suspect / negative_kw
    upload_batch_id INT             NULL REFERENCES upload_batches(batch_id),

    CONSTRAINT UQ_greenhouse_site_timestamp UNIQUE (site_id, timestamp_utc)
);
GO


-- ============================================================
-- STEP 5 — solar_readings
-- Minute-by-minute concentrated solar generation data.
-- Two collectors (Collector 1 and Collector 2).
-- ============================================================

CREATE TABLE solar_readings (
    reading_id          BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    site_id             INT            NOT NULL REFERENCES sites(site_id),
    timestamp_utc       DATETIME2(0)   NOT NULL,

    -- Solar irradiance & power
    sunlight_wm2        DECIMAL(10,4)  NULL,   -- Available sunlight (W/m²)
    collector1_power_kw DECIMAL(10,4)  NULL,   -- Collector 1 power output (kW)
    collector2_power_kw DECIMAL(10,4)  NULL,   -- Collector 2 power output (kW)

    -- Temperatures (°C)
    temp_in_c           DECIMAL(6,2)   NULL,   -- Shared collector inlet temp
    collector1_out_c    DECIMAL(6,2)   NULL,   -- Collector 1 outlet temp
    collector2_out_c    DECIMAL(6,2)   NULL,   -- Collector 2 outlet temp

    -- Flow & status
    flow_rate_lm        DECIMAL(8,4)   NULL,   -- Flow rate (L/min)
    collector_active    BIT            NULL,   -- 1 = active, 0 = inactive
    alarm_flag          NVARCHAR(200)  NULL,   -- Alarm description, NULL if none

    -- Data quality & traceability
    data_quality        NVARCHAR(20)   NULL DEFAULT 'ok',  -- ok / suspect / alarm
    upload_batch_id     INT            NULL REFERENCES upload_batches(batch_id),

    CONSTRAINT UQ_solar_site_timestamp UNIQUE (site_id, timestamp_utc)
);
GO


-- ============================================================
-- STEP 6 — weather_readings
-- Hourly outdoor weather from Black Diamond weather station.
-- Used to correlate ambient conditions with greenhouse performance.
-- ============================================================

CREATE TABLE weather_readings (
    reading_id         BIGINT         NOT NULL IDENTITY(1,1) PRIMARY KEY,
    site_id            INT            NOT NULL REFERENCES sites(site_id),
    timestamp_utc      DATETIME2(0)   NOT NULL,

    -- Temperature (°C)
    air_temp_instant_c DECIMAL(6,2)   NULL,   -- Instantaneous air temp
    air_temp_min_c     DECIMAL(6,2)   NULL,   -- Min air temp in period
    air_temp_max_c     DECIMAL(6,2)   NULL,   -- Max air temp in period

    -- Other weather
    humidity_pct       DECIMAL(6,2)   NULL,   -- Relative humidity (%)
    precipitation_mm   DECIMAL(8,4)   NULL,   -- Precipitation (mm)

    -- Data quality & traceability
    data_quality       NVARCHAR(20)   NULL DEFAULT 'ok',  -- ok / suspect
    upload_batch_id    INT            NULL REFERENCES upload_batches(batch_id),

    CONSTRAINT UQ_weather_site_timestamp UNIQUE (site_id, timestamp_utc)
);
GO


-- ============================================================
-- STEP 7 — emissions_factors
-- Reference table: Alberta grid emission intensity by year.
-- Source: Environment and Climate Change Canada (ECCC) NIR.
-- Standalone — no FK dependencies.
-- ============================================================

CREATE TABLE emissions_factors (
    factor_id      INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    year           INT            NOT NULL,
    kg_co2_per_kwh DECIMAL(10,6)  NOT NULL,   -- Alberta grid kg CO2e per kWh
    source         NVARCHAR(300)  NOT NULL,   -- ECCC publication citation
    effective_from DATE           NOT NULL,
    effective_to   DATE           NULL,       -- NULL = currently active factor
    created_at     DATETIME2(0)   NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_emissions_factor_year UNIQUE (year)
);
GO


-- ============================================================
-- INDEXES
-- All time-series tables indexed on (site_id, timestamp_utc)
-- as the dominant query pattern is filter by site + date range.
-- ============================================================

-- greenhouse_readings indexes
CREATE NONCLUSTERED INDEX IX_greenhouse_site_ts
    ON greenhouse_readings (site_id, timestamp_utc)
    INCLUDE (mains_pa_kw, mains_pb_kw, mains_pc_kw, data_quality);

CREATE NONCLUSTERED INDEX IX_greenhouse_quality
    ON greenhouse_readings (data_quality);

CREATE NONCLUSTERED INDEX IX_greenhouse_batch
    ON greenhouse_readings (upload_batch_id);

-- solar_readings indexes
CREATE NONCLUSTERED INDEX IX_solar_site_ts
    ON solar_readings (site_id, timestamp_utc);

CREATE NONCLUSTERED INDEX IX_solar_active
    ON solar_readings (collector_active);

CREATE NONCLUSTERED INDEX IX_solar_batch
    ON solar_readings (upload_batch_id);

-- weather_readings indexes
CREATE NONCLUSTERED INDEX IX_weather_site_ts
    ON weather_readings (site_id, timestamp_utc);

-- upload_batches indexes
CREATE NONCLUSTERED INDEX IX_upload_batches_status
    ON upload_batches (status);

-- users indexes
CREATE NONCLUSTERED INDEX IX_users_entra_oid
    ON users (entra_oid);
GO


-- ============================================================
-- VIEWS
-- ============================================================

-- vw_daily_energy_summary
-- Aggregates greenhouse_readings to daily kWh totals per system.
-- kW / 60 converts per-minute kW readings → kWh.
-- Used by Power BI Energy dashboard and /summary API endpoint.

CREATE VIEW vw_daily_energy_summary AS
SELECT
    site_id,
    CAST(timestamp_utc AS DATE)           AS reading_date,
    ROUND(SUM(chiller_pa_kw)   / 60, 4)  AS chiller_pa_kwh,
    ROUND(SUM(chiller_pb_kw)   / 60, 4)  AS chiller_pb_kwh,
    ROUND(SUM(lighting_pa_kw)  / 60, 4)  AS lighting_pa_kwh,
    ROUND(SUM(lighting_pb_kw)  / 60, 4)  AS lighting_pb_kwh,
    ROUND(SUM(lighting_pc_kw)  / 60, 4)  AS lighting_pc_kwh,
    ROUND(SUM(heater_big_kw)   / 60, 4)  AS heater_big_kwh,
    ROUND(SUM(heater_small_kw) / 60, 4)  AS heater_small_kwh,
    ROUND(SUM(mains_pa_kw)     / 60, 4)  AS mains_pa_kwh,
    ROUND(SUM(mains_pb_kw)     / 60, 4)  AS mains_pb_kwh,
    ROUND(SUM(mains_pc_kw)     / 60, 4)  AS mains_pc_kwh,
    COUNT(*)                              AS reading_count
FROM greenhouse_readings
WHERE data_quality = 'ok'
GROUP BY site_id, CAST(timestamp_utc AS DATE);
GO

-- vw_daily_solar_summary
-- Aggregates solar_readings to daily kWh totals per collector.

CREATE VIEW vw_daily_solar_summary AS
SELECT
    site_id,
    CAST(timestamp_utc AS DATE)                AS reading_date,
    ROUND(SUM(CASE WHEN collector1_power_kw > 0
                   THEN collector1_power_kw ELSE 0 END) / 60, 4) AS collector1_kwh,
    ROUND(SUM(CASE WHEN collector2_power_kw > 0
                   THEN collector2_power_kw ELSE 0 END) / 60, 4) AS collector2_kwh,
    AVG(sunlight_wm2)                          AS avg_sunlight_wm2,
    COUNT(*)                                   AS reading_count
FROM solar_readings
WHERE data_quality = 'ok'
GROUP BY site_id, CAST(timestamp_utc AS DATE);
GO


-- ============================================================
-- STORED FUNCTION — UTC to Mountain Time conversion
-- ============================================================

CREATE FUNCTION fn_convert_utc_to_mt (@utc DATETIME2)
RETURNS DATETIME2
AS
BEGIN
    -- Uses Azure SQL built-in AT TIME ZONE
    -- Correctly handles MST (UTC-7) and MDT (UTC-6) DST transitions
    RETURN CAST(@utc AT TIME ZONE 'UTC'
                    AT TIME ZONE 'Mountain Standard Time' AS DATETIME2);
END;
GO


-- ============================================================
-- SEED DATA
-- Run immediately after tables are created.
-- ============================================================

-- Seed: sites — ARK Net Zero Campus (only site for initial deployment)
INSERT INTO sites (site_name, location, city, province)
VALUES (
    'ARK Net Zero Campus',
    'Aldersyde, AB — Sprung Greenhouse',
    'Aldersyde',
    'Alberta'
);

-- Seed: emissions_factors — 2023 Alberta grid factor
-- SOURCE: Environment and Climate Change Canada, National Inventory Report 2023
-- NOTE: Verify kg_co2_per_kwh against current ECCC NIR before production deployment.
INSERT INTO emissions_factors (year, kg_co2_per_kwh, source, effective_from)
VALUES (
    2023,
    0.54,
    'Environment and Climate Change Canada, National Inventory Report 2023',
    '2023-01-01'
);

-- Seed: users — Initial admin account will be inserted on Maeric's first login.
-- The entra_oid is extracted from the JWT token at first login by the backend.
-- Do NOT hardcode Maeric's OID here — let the application handle it.

GO

-- ============================================================
-- END OF MIGRATION
-- Verify by running:
--   SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
--   SELECT name FROM sys.indexes WHERE type_desc = 'NONCLUSTERED';
-- ============================================================
