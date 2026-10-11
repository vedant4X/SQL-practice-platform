-- Migration 003: Add auth columns to the users table.
-- Keep schema changes separate from statements that reference newly added columns.
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id_normalized TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_normalized TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'disabled'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
