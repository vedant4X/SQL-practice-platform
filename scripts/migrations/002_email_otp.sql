-- Migration 002: Email OTP Verification and Email Uniqueness
-- Adds email_verified to users and creates email_otps table

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS email_otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'registration' CHECK (purpose IN ('registration', 'login', 'verification', 'reset_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email_purpose ON email_otps (LOWER(email), purpose);
CREATE INDEX IF NOT EXISTS idx_email_otps_created_at ON email_otps (created_at);
