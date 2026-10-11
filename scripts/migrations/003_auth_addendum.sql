-- Migration 003: Auth Addendum - Guaranteed User Uniqueness, Email OTP, Sessions & Rate Limiting

-- 1. Extend users table. Keep each ADD COLUMN before any query references it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id_normalized TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_normalized TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'disabled'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Backfill normalized fields for existing records. Explicitly use the columns
-- added above; the statements must run after the ALTER TABLE statements.
UPDATE users
SET
  user_id = COALESCE(user_id, LOWER(SPLIT_PART(email, '@', 1))),
  user_id_normalized = COALESCE(user_id_normalized, LOWER(TRIM(COALESCE(user_id, SPLIT_PART(email, '@', 1))))),
  email_normalized = COALESCE(email_normalized, LOWER(TRIM(email))),
  email_verified_at = COALESCE(email_verified_at, CASE WHEN email_verified = true THEN NOW() ELSE NULL END),
  status = CASE WHEN email_verified = true THEN 'active' ELSE 'active' END
WHERE user_id_normalized IS NULL OR email_normalized IS NULL;

-- Enforce unique constraints on normalized identifiers
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_id_normalized ON users (user_id_normalized);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_normalized ON users (email_normalized);

-- 2. Enhanced email_otps table
CREATE TABLE IF NOT EXISTS email_otps (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email_normalized TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('register', 'login', 'reset')),
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON email_otps (email_normalized, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_otps_user ON email_otps (user_id);

-- 3. Server-side session tracking with revocation support ("log out everywhere")
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

-- 4. Serverless-friendly rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);
