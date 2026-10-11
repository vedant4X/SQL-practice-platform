-- Migration 005: Backfill normalized identifiers, update legacy OTP rows, and add auth support tables.
-- The columns referenced below were committed by migrations 003 and 004.

UPDATE users
SET
  user_id = COALESCE(user_id, LOWER(SPLIT_PART(email, '@', 1))),
  user_id_normalized = COALESCE(user_id_normalized, LOWER(TRIM(COALESCE(user_id, SPLIT_PART(email, '@', 1))))),
  email_normalized = COALESCE(email_normalized, LOWER(TRIM(email))),
  email_verified_at = COALESCE(email_verified_at, CASE WHEN email_verified = true THEN NOW() ELSE NULL END),
  status = 'active'
WHERE user_id_normalized IS NULL OR email_normalized IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_id_normalized ON users (user_id_normalized);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_normalized ON users (email_normalized);

-- Normalize old OTP rows. Legacy OTPs are invalidated because they were stored with
-- a different schema and may not use the current HMAC-SHA256 format.
UPDATE email_otps
SET
  email_normalized = LOWER(TRIM(email)),
  code_hash = COALESCE(code_hash, ''),
  consumed_at = COALESCE(consumed_at, NOW()),
  purpose = CASE purpose
    WHEN 'registration' THEN 'register'
    WHEN 'verification' THEN 'register'
    WHEN 'reset_password' THEN 'reset'
    WHEN 'login' THEN 'login'
    WHEN 'register' THEN 'register'
    WHEN 'reset' THEN 'reset'
    ELSE 'register'
  END
WHERE email_normalized IS NULL OR code_hash IS NULL OR consumed_at IS NULL
   OR purpose NOT IN ('register', 'login', 'reset');

ALTER TABLE email_otps ALTER COLUMN email_normalized SET NOT NULL;
ALTER TABLE email_otps ADD CONSTRAINT email_otps_purpose_check
  CHECK (purpose IN ('register', 'login', 'reset'));

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON email_otps (email_normalized, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_otps_user ON email_otps (user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);
