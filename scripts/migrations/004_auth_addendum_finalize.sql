-- Migration 004: Backfill auth identifiers and create auth support tables.
-- This migration runs after 003 has committed the users-table column additions.

UPDATE users
SET
  user_id = COALESCE(user_id, LOWER(SPLIT_PART(email, '@', 1))),
  user_id_normalized = COALESCE(user_id_normalized, LOWER(TRIM(COALESCE(user_id, SPLIT_PART(email, '@', 1))))),
  email_normalized = COALESCE(email_normalized, LOWER(TRIM(email))),
  email_verified_at = COALESCE(email_verified_at, CASE WHEN email_verified = true THEN NOW() ELSE NULL END),
  status = CASE WHEN email_verified = true THEN 'active' ELSE 'active' END
WHERE user_id_normalized IS NULL OR email_normalized IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_id_normalized ON users (user_id_normalized);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_normalized ON users (email_normalized);

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
