-- Migration 001: Initial Schema
-- Creates all application data tables

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  practice_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  leaderboard_visible BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_question_state (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dialect TEXT NOT NULL CHECK (dialect IN ('postgresql', 'mysql')),
  question_id TEXT NOT NULL,
  is_solved BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'attempted', 'solved')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  solution_viewed BOOLEAN NOT NULL DEFAULT false,
  first_solved_at TIMESTAMPTZ,
  last_submitted_query TEXT,
  last_submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, dialect, question_id)
);

CREATE TABLE IF NOT EXISTS user_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dialect TEXT NOT NULL CHECK (dialect IN ('postgresql', 'mysql')),
  question_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('correct', 'incorrect', 'error', 'timeout')),
  execution_time_ms INTEGER NOT NULL DEFAULT 0,
  passed_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_attempts_user ON user_attempts (user_id, dialect);

CREATE TABLE IF NOT EXISTS xp_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dialect TEXT NOT NULL CHECK (dialect IN ('postgresql', 'mysql')),
  source_type TEXT NOT NULL CHECK (source_type IN ('question_solve', 'daily_challenge', 'streak_bonus')),
  source_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events (user_id, dialect);

CREATE TABLE IF NOT EXISTS saved_questions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dialect TEXT NOT NULL CHECK (dialect IN ('postgresql', 'mysql')),
  question_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, dialect, question_id)
);

CREATE TABLE IF NOT EXISTS query_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dialect TEXT NOT NULL CHECK (dialect IN ('postgresql', 'mysql')),
  question_id TEXT,
  query_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_history_user ON query_history (user_id, dialect);

CREATE TABLE IF NOT EXISTS user_drafts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dialect TEXT NOT NULL CHECK (dialect IN ('postgresql', 'mysql')),
  question_id TEXT NOT NULL,
  draft_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, dialect, question_id)
);
