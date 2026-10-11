-- Migration 004: Extend the legacy OTP table with columns used by the current auth flow.
-- Migration 002 already creates email_otps with an older schema, so CREATE TABLE IF NOT EXISTS
-- alone is insufficient here. Keep this file structural: backfills run in migration 005.
ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS email_normalized TEXT;
ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS code_hash TEXT;
ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS request_ip_hash TEXT;

-- The legacy columns are retained for compatibility, but the new application inserts use
-- email_normalized/code_hash and do not provide values for these older required columns.
ALTER TABLE email_otps ALTER COLUMN email DROP NOT NULL;
ALTER TABLE email_otps ALTER COLUMN otp_code DROP NOT NULL;

-- Existing rows used a different set of purpose values; replace that check in migration 005.
ALTER TABLE email_otps DROP CONSTRAINT IF EXISTS email_otps_purpose_check;
