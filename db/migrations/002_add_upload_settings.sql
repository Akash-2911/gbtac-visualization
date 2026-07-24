-- ============================================================
-- GBTAC Visualization Project — Azure SQL Migration Script
-- File:    002_add_upload_settings.sql
-- Purpose: Make the upload file-size limit configurable by a
--          SuperAdmin from the Admin page instead of being a
--          hardcoded constant duplicated in processUpload.js,
--          uploadFile.js, and the frontend.
-- DB:      Azure SQL Database (SQL Server 2019 / Compatibility Level 150)
-- Notes:   Run after 001_gbtac_create_all_tables.sql (depends on users).
-- ============================================================

-- Single-row settings table — CHECK(id = 1) keeps it a singleton so
-- there's never ambiguity about which row is "the" current setting.
CREATE TABLE upload_settings (
    id                  INT            NOT NULL PRIMARY KEY DEFAULT 1
        CONSTRAINT CHK_upload_settings_single_row CHECK (id = 1),
    max_upload_mb       INT            NOT NULL DEFAULT 100
        CONSTRAINT CHK_upload_settings_max_mb CHECK (max_upload_mb BETWEEN 1 AND 1000),
    updated_at          DATETIME2(0)   NOT NULL DEFAULT GETUTCDATE(),
    updated_by_user_id  INT            NULL REFERENCES users(user_id)
);
GO

INSERT INTO upload_settings (id, max_upload_mb) VALUES (1, 100);
GO

-- ============================================================
-- END OF MIGRATION
-- Verify with:
--   SELECT * FROM upload_settings;
-- ============================================================
