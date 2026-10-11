import crypto from "crypto";
import { Dialect } from "../engine/types";
import { query } from "./pool";

export interface User {
  id: string;
  userId?: string;
  userIdNormalized?: string;
  email: string;
  emailNormalized?: string;
  passwordHash: string;
  passwordPlain?: string;
  name: string;
  role: "user" | "admin";
  timezone: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  status?: "pending" | "active" | "disabled";
  lastLoginAt?: string | null;
  failedLoginCount?: number;
  lockedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  practiceModeEnabled: boolean;
  theme: "dark" | "light";
  leaderboardVisible: boolean;
}

export interface UserQuestionState {
  userId: string;
  dialect: Dialect;
  questionId: string;
  isSolved: boolean;
  status: "not_started" | "attempted" | "solved";
  attemptCount: number;
  hintsUsed: number;
  solutionViewed: boolean;
  firstSolvedAt?: string;
  lastSubmittedQuery?: string;
  lastSubmittedAt?: string;
  updatedAt?: string;
  xpAwarded: number;
}

export interface UserDraft {
  userId: string;
  dialect: Dialect;
  questionId: string;
  draftText: string;
  updatedAt: string;
}

export interface UserAttempt {
  id: string;
  userId: string;
  dialect: Dialect;
  questionId: string;
  queryText: string;
  verdict: "correct" | "incorrect" | "error" | "timeout";
  executionTimeMs: number;
  passedCount: number;
  totalCount: number;
  errorMessage?: string;
  createdAt: string;
}

export interface XpEvent {
  id: string;
  userId: string;
  dialect: Dialect;
  sourceType: "question_solve" | "daily_challenge" | "streak_bonus";
  sourceId: string;
  amount: number;
  createdAt: string;
}

export interface SavedQuestion {
  userId: string;
  dialect: Dialect;
  questionId: string;
  createdAt: string;
}

export interface QueryHistoryItem {
  id: string;
  userId: string;
  dialect: Dialect;
  questionId?: string;
  queryText: string;
  status: "success" | "error";
  createdAt: string;
}

export interface DatabaseState {
  users: User[];
  userSettings: UserSettings[];
  userQuestionState: UserQuestionState[];
  userAttempts: UserAttempt[];
  xpEvents: XpEvent[];
  savedQuestions: SavedQuestion[];
  queryHistory: QueryHistoryItem[];
  userDrafts: UserDraft[];
}

function mapUserRow(row: any): User {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    userIdNormalized: row.user_id_normalized ?? undefined,
    email: row.email,
    emailNormalized: row.email_normalized ?? undefined,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    timezone: row.timezone,
    emailVerified: Boolean(row.email_verified || row.email_verified_at),
    emailVerifiedAt: row.email_verified_at
      ? row.email_verified_at instanceof Date
        ? row.email_verified_at.toISOString()
        : String(row.email_verified_at)
      : undefined,
    status: (row.status as any) || "active",
    lastLoginAt: row.last_login_at
      ? row.last_login_at instanceof Date
        ? row.last_login_at.toISOString()
        : String(row.last_login_at)
      : undefined,
    failedLoginCount: Number(row.failed_login_count ?? 0),
    lockedUntil: row.locked_until
      ? row.locked_until instanceof Date
        ? row.locked_until.toISOString()
        : String(row.locked_until)
      : undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function mapUserSettingsRow(row: any): UserSettings {
  return {
    userId: row.user_id,
    practiceModeEnabled: Boolean(row.practice_mode_enabled),
    theme: row.theme,
    leaderboardVisible: Boolean(row.leaderboard_visible),
  };
}

function mapQuestionStateRow(row: any): UserQuestionState {
  return {
    userId: row.user_id,
    dialect: row.dialect,
    questionId: row.question_id,
    isSolved: Boolean(row.is_solved),
    status: row.status,
    attemptCount: Number(row.attempt_count),
    hintsUsed: Number(row.hints_used),
    solutionViewed: Boolean(row.solution_viewed),
    firstSolvedAt: row.first_solved_at
      ? row.first_solved_at instanceof Date
        ? row.first_solved_at.toISOString()
        : String(row.first_solved_at)
      : undefined,
    lastSubmittedQuery: row.last_submitted_query ?? undefined,
    lastSubmittedAt: row.last_submitted_at
      ? row.last_submitted_at instanceof Date
        ? row.last_submitted_at.toISOString()
        : String(row.last_submitted_at)
      : undefined,
    updatedAt: row.updated_at
      ? row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at)
      : undefined,
    xpAwarded: Number(row.xp_awarded ?? 0),
  };
}

function mapAttemptRow(row: any): UserAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    dialect: row.dialect,
    questionId: row.question_id,
    queryText: row.query_text,
    verdict: row.verdict,
    executionTimeMs: Number(row.execution_time_ms),
    passedCount: Number(row.passed_count),
    totalCount: Number(row.total_count),
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

function mapDraftRow(row: any): UserDraft {
  return {
    userId: row.user_id,
    dialect: row.dialect,
    questionId: row.question_id,
    draftText: row.draft_text,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function mapHistoryRow(row: any): QueryHistoryItem {
  return {
    id: row.id,
    userId: row.user_id,
    dialect: row.dialect,
    questionId: row.question_id ?? undefined,
    queryText: row.query_text,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export class PgAppStore {
  private memState: DatabaseState = {
    users: [],
    userSettings: [],
    userQuestionState: [],
    userAttempts: [],
    xpEvents: [],
    savedQuestions: [],
    queryHistory: [],
    userDrafts: [],
  };

  private isPgConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");
  }

  private schemaEnsured = false;
  private async ensureUsersSchema(): Promise<void> {
    if (this.schemaEnsured || !this.isPgConfigured()) return;
    try {
      await query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id_normalized TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_normalized TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
      `);
      this.schemaEnsured = true;
    } catch {
      // ignore
    }
  }

  // --- Users ---
  async getAllUsers(): Promise<User[]> {
    if (!this.isPgConfigured()) {
      return [...this.memState.users];
    }
    await this.ensureUsersSchema();
    const res = await query(
      `SELECT id, user_id, user_id_normalized, email, email_normalized, password_hash, name, role, timezone,
              email_verified, email_verified_at, status, last_login_at, failed_login_count, locked_until, created_at, updated_at
       FROM users
       ORDER BY created_at ASC;`
    );
    return res.rows.map(mapUserRow);
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (!this.isPgConfigured()) {
      return this.memState.users.find((u) => u.id === id);
    }
    await this.ensureUsersSchema();
    const res = await query(
      `SELECT id, user_id, user_id_normalized, email, email_normalized, password_hash, name, role, timezone,
              email_verified, email_verified_at, status, last_login_at, failed_login_count, locked_until, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
    return res.rows.length > 0 ? mapUserRow(res.rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    let normalized = email.toLowerCase().trim();
    if (normalized === "admin@sqljudge.com") {
      normalized = "admin@quro.com";
    }

    if (!this.isPgConfigured()) {
      return this.memState.users.find(
        (u) =>
          u.email.toLowerCase().trim() === normalized ||
          (u.emailNormalized && u.emailNormalized === normalized)
      );
    }

    await this.ensureUsersSchema();
    const res = await query(
      `SELECT id, user_id, user_id_normalized, email, email_normalized, password_hash, name, role, timezone,
              email_verified, email_verified_at, status, last_login_at, failed_login_count, locked_until, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1) OR email_normalized = LOWER($1)
       LIMIT 1;`,
      [normalized]
    );

    if (res.rows.length === 0 && email.toLowerCase().trim() === "admin@sqljudge.com") {
      const fallback = await query(
        `SELECT id, user_id, user_id_normalized, email, email_normalized, password_hash, name, role, timezone,
                email_verified, email_verified_at, status, last_login_at, failed_login_count, locked_until, created_at, updated_at
         FROM users
         WHERE LOWER(email) = 'admin@sqljudge.com'
         LIMIT 1;`
      );
      if (fallback.rows.length > 0) {
        return mapUserRow(fallback.rows[0]);
      }
    }

    return res.rows.length > 0 ? mapUserRow(res.rows[0]) : undefined;
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const norm = userId.toLowerCase().trim();
    if (!this.isPgConfigured()) {
      return this.memState.users.find(
        (u) =>
          (u.userId && u.userId.toLowerCase().trim() === norm) ||
          (u.userIdNormalized && u.userIdNormalized === norm)
      );
    }
    await this.ensureUsersSchema();
    const res = await query(
      `SELECT id, user_id, user_id_normalized, email, email_normalized, password_hash, name, role, timezone,
              email_verified, email_verified_at, status, last_login_at, failed_login_count, locked_until, created_at, updated_at
       FROM users
       WHERE user_id_normalized = $1 OR LOWER(user_id) = $1
       LIMIT 1;`,
      [norm]
    );
    return res.rows.length > 0 ? mapUserRow(res.rows[0]) : undefined;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    const norm = identifier.toLowerCase().trim();
    if (!this.isPgConfigured()) {
      return this.memState.users.find(
        (u) =>
          u.email.toLowerCase().trim() === norm ||
          (u.userId && u.userId.toLowerCase().trim() === norm) ||
          (u.userIdNormalized && u.userIdNormalized === norm) ||
          (u.emailNormalized && u.emailNormalized === norm)
      );
    }
    await this.ensureUsersSchema();
    const res = await query(
      `SELECT id, user_id, user_id_normalized, email, email_normalized, password_hash, name, role, timezone,
              email_verified, email_verified_at, status, last_login_at, failed_login_count, locked_until, created_at, updated_at
       FROM users
       WHERE user_id_normalized = $1 OR email_normalized = $1 OR LOWER(email) = $1 OR LOWER(user_id) = $1
       LIMIT 1;`,
      [norm]
    );
    return res.rows.length > 0 ? mapUserRow(res.rows[0]) : undefined;
  }

  async createUser(user: User): Promise<User> {
    const createdAt = user.createdAt || new Date().toISOString();
    const updatedAt = user.updatedAt || new Date().toISOString();
    const normalizedEmail = user.email.toLowerCase().trim();
    const rawUserId = user.userId || normalizedEmail.split("@")[0] || user.id;
    const normalizedUserId = rawUserId.toLowerCase().trim();
    const emailVerified = user.emailVerified ?? false;
    const status = user.status || (emailVerified ? "active" : "pending");

    if (!this.isPgConfigured()) {
      const existing = await this.getUserByEmail(normalizedEmail);
      if (existing) {
        throw new Error(`User with email "${normalizedEmail}" already exists.`);
      }
      const newUser: User = {
        ...user,
        userId: rawUserId,
        userIdNormalized: normalizedUserId,
        email: user.email,
        emailNormalized: normalizedEmail,
        emailVerified,
        status,
        createdAt,
        updatedAt,
      };
      delete newUser.passwordPlain;
      this.memState.users.push(newUser);
      this.memState.userSettings.push({
        userId: user.id,
        practiceModeEnabled: false,
        theme: "dark",
        leaderboardVisible: false,
      });
      return newUser;
    }

    await this.ensureUsersSchema();
    await query(
      `INSERT INTO users (
         id, user_id, user_id_normalized, email, email_normalized, password_hash, name, role, timezone,
         email_verified, status, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
      [
        user.id,
        rawUserId,
        normalizedUserId,
        user.email,
        normalizedEmail,
        user.passwordHash,
        user.name,
        user.role,
        user.timezone || "UTC",
        emailVerified,
        status,
        createdAt,
        updatedAt,
      ]
    );

    await query(
      `INSERT INTO user_settings (user_id, practice_mode_enabled, theme, leaderboard_visible)
       VALUES ($1, false, 'dark', false)
       ON CONFLICT (user_id) DO NOTHING;`,
      [user.id]
    );

    return {
      ...user,
      userId: rawUserId,
      userIdNormalized: normalizedUserId,
      email: user.email,
      emailNormalized: normalizedEmail,
      emailVerified,
      status,
      createdAt,
      updatedAt,
    };
  }

  async recordFailedLogin(userId: string): Promise<{ locked: boolean; lockedUntil?: string }> {
    if (!this.isPgConfigured()) {
      const u = this.memState.users.find((x) => x.id === userId);
      if (!u) return { locked: false };
      u.failedLoginCount = (u.failedLoginCount || 0) + 1;
      if (u.failedLoginCount >= 5) {
        u.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        return { locked: true, lockedUntil: u.lockedUntil };
      }
      return { locked: false };
    }

    const res = await query(
      `UPDATE users
       SET failed_login_count = failed_login_count + 1,
           locked_until = CASE 
             WHEN failed_login_count + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
             ELSE locked_until 
           END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING failed_login_count, locked_until;`,
      [userId]
    );
    if (res.rows.length === 0) return { locked: false };
    const row = res.rows[0];
    const isLocked = row.locked_until !== null && new Date(row.locked_until).getTime() > Date.now();
    return {
      locked: isLocked,
      lockedUntil: row.locked_until ? new Date(row.locked_until).toISOString() : undefined,
    };
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    if (!this.isPgConfigured()) {
      const u = this.memState.users.find((x) => x.id === userId);
      if (u) {
        u.failedLoginCount = 0;
        u.lockedUntil = null;
        u.lastLoginAt = new Date().toISOString();
      }
      return;
    }
    await query(
      `UPDATE users
       SET failed_login_count = 0,
           locked_until = NULL,
           last_login_at = NOW(),
           updated_at = NOW()
       WHERE id = $1;`,
      [userId]
    );
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    if (!this.isPgConfigured()) {
      const u = this.memState.users.find((x) => x.id === userId);
      if (u) {
        u.passwordHash = newPasswordHash;
        u.failedLoginCount = 0;
        u.lockedUntil = null;
      }
      return;
    }
    await query(
      `UPDATE users
       SET password_hash = $1,
           failed_login_count = 0,
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $2;`,
      [newPasswordHash, userId]
    );
  }

  async setUserStatus(userId: string, status: "pending" | "active" | "disabled"): Promise<void> {
    if (!this.isPgConfigured()) {
      const u = this.memState.users.find((x) => x.id === userId);
      if (u) u.status = status;
      return;
    }
    await query(
      `UPDATE users
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2;`,
      [status, userId]
    );
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    if (!this.isPgConfigured()) {
      const current = this.memState.users.find((u) => u.id === userId);
      if (!current) return undefined;
      Object.assign(current, updates, { updatedAt: new Date().toISOString() });
      delete current.passwordPlain;
      return current;
    }

    const current = await this.getUserById(userId);
    if (!current) return undefined;

    const email = updates.email !== undefined ? updates.email.toLowerCase().trim() : current.email;
    const passwordHash = updates.passwordHash !== undefined ? updates.passwordHash : current.passwordHash;
    const name = updates.name !== undefined ? updates.name : current.name;
    const role = updates.role !== undefined ? updates.role : current.role;
    const timezone = updates.timezone !== undefined ? updates.timezone : current.timezone;
    const emailVerified = updates.emailVerified !== undefined ? updates.emailVerified : current.emailVerified;
    const updatedAt = new Date().toISOString();

    const res = await query(
      `UPDATE users
       SET email = $1, password_hash = $2, name = $3, role = $4, timezone = $5, email_verified = $6, updated_at = $7
       WHERE id = $8
       RETURNING id, email, password_hash, name, role, timezone, email_verified, created_at, updated_at;`,
      [email, passwordHash, name, role, timezone, emailVerified, updatedAt, userId]
    );

    return res.rows.length > 0 ? mapUserRow(res.rows[0]) : undefined;
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (!this.isPgConfigured()) {
      const idx = this.memState.users.findIndex((u) => u.id === userId);
      if (idx === -1) return false;
      this.memState.users.splice(idx, 1);
      this.memState.userSettings = this.memState.userSettings.filter((s) => s.userId !== userId);
      this.memState.userQuestionState = this.memState.userQuestionState.filter((q) => q.userId !== userId);
      this.memState.userAttempts = this.memState.userAttempts.filter((a) => a.userId !== userId);
      this.memState.xpEvents = this.memState.xpEvents.filter((x) => x.userId !== userId);
      this.memState.savedQuestions = this.memState.savedQuestions.filter((s) => s.userId !== userId);
      this.memState.queryHistory = this.memState.queryHistory.filter((h) => h.userId !== userId);
      this.memState.userDrafts = this.memState.userDrafts.filter((d) => d.userId !== userId);
      return true;
    }
    const res = await query(`DELETE FROM users WHERE id = $1;`, [userId]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- Settings ---
  async getUserSettings(userId: string): Promise<UserSettings> {
    if (!this.isPgConfigured()) {
      const existing = this.memState.userSettings.find((s) => s.userId === userId);
      if (existing) return existing;
      const def: UserSettings = {
        userId,
        practiceModeEnabled: false,
        theme: "dark",
        leaderboardVisible: false,
      };
      this.memState.userSettings.push(def);
      return def;
    }

    const res = await query(
      `SELECT user_id, practice_mode_enabled, theme, leaderboard_visible
       FROM user_settings
       WHERE user_id = $1;`,
      [userId]
    );

    if (res.rows.length > 0) {
      return mapUserSettingsRow(res.rows[0]);
    }

    const def: UserSettings = {
      userId,
      practiceModeEnabled: false,
      theme: "dark",
      leaderboardVisible: false,
    };

    await query(
      `INSERT INTO user_settings (user_id, practice_mode_enabled, theme, leaderboard_visible)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO NOTHING;`,
      [userId, def.practiceModeEnabled, def.theme, def.leaderboardVisible]
    );

    return def;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    if (!this.isPgConfigured()) {
      let s = this.memState.userSettings.find((x) => x.userId === userId);
      if (!s) {
        s = {
          userId,
          practiceModeEnabled: false,
          theme: "dark",
          leaderboardVisible: false,
          ...updates,
        };
        this.memState.userSettings.push(s);
      } else {
        Object.assign(s, updates);
      }
      return s;
    }

    const current = await this.getUserSettings(userId);
    const practiceModeEnabled =
      updates.practiceModeEnabled !== undefined
        ? updates.practiceModeEnabled
        : current.practiceModeEnabled;
    const theme = updates.theme !== undefined ? updates.theme : current.theme;
    const leaderboardVisible =
      updates.leaderboardVisible !== undefined
        ? updates.leaderboardVisible
        : current.leaderboardVisible;

    await query(
      `INSERT INTO user_settings (user_id, practice_mode_enabled, theme, leaderboard_visible)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         practice_mode_enabled = EXCLUDED.practice_mode_enabled,
         theme = EXCLUDED.theme,
         leaderboard_visible = EXCLUDED.leaderboard_visible;`,
      [userId, practiceModeEnabled, theme, leaderboardVisible]
    );

    return {
      userId,
      practiceModeEnabled,
      theme,
      leaderboardVisible,
    };
  }

  // --- Question State ---
  async getUserQuestionState(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): Promise<UserQuestionState> {
    if (!this.isPgConfigured()) {
      const existing = this.memState.userQuestionState.find(
        (q) => q.userId === userId && q.questionId === questionId && q.dialect === dialect
      );
      if (existing) return existing;
      return {
        userId,
        dialect,
        questionId,
        isSolved: false,
        status: "not_started",
        attemptCount: 0,
        hintsUsed: 0,
        solutionViewed: false,
        xpAwarded: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    const res = await query(
      `SELECT user_id, dialect, question_id, is_solved, status, attempt_count, hints_used,
              solution_viewed, first_solved_at, last_submitted_query, last_submitted_at,
              updated_at, xp_awarded
       FROM user_question_state
       WHERE user_id = $1 AND dialect = $2 AND question_id = $3;`,
      [userId, dialect, questionId]
    );

    if (res.rows.length > 0) {
      return mapQuestionStateRow(res.rows[0]);
    }

    return {
      userId,
      dialect,
      questionId,
      isSolved: false,
      status: "not_started",
      attemptCount: 0,
      hintsUsed: 0,
      solutionViewed: false,
      xpAwarded: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  async recordHintUsed(
    userId: string,
    questionId: string,
    level: number,
    dialect: Dialect = "postgresql"
  ): Promise<UserQuestionState> {
    if (!this.isPgConfigured()) {
      let q = this.memState.userQuestionState.find(
        (x) => x.userId === userId && x.questionId === questionId && x.dialect === dialect
      );
      if (!q) {
        q = {
          userId,
          dialect,
          questionId,
          isSolved: false,
          status: "not_started",
          attemptCount: 0,
          hintsUsed: level,
          solutionViewed: false,
          xpAwarded: 0,
          updatedAt: new Date().toISOString(),
        };
        this.memState.userQuestionState.push(q);
      } else if (level > q.hintsUsed) {
        q.hintsUsed = level;
        q.updatedAt = new Date().toISOString();
      }
      return q;
    }

    const current = await this.getUserQuestionState(userId, questionId, dialect);
    const newHints = Math.max(current.hintsUsed, level);
    const now = new Date().toISOString();

    const res = await query(
      `INSERT INTO user_question_state (
         user_id, dialect, question_id, is_solved, status, attempt_count,
         hints_used, solution_viewed, updated_at, xp_awarded
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, dialect, question_id) DO UPDATE SET
         hints_used = GREATEST(user_question_state.hints_used, EXCLUDED.hints_used),
         updated_at = EXCLUDED.updated_at
       RETURNING *;`,
      [
        userId,
        dialect,
        questionId,
        current.isSolved,
        current.status,
        current.attemptCount,
        newHints,
        current.solutionViewed,
        now,
        current.xpAwarded,
      ]
    );

    return mapQuestionStateRow(res.rows[0]);
  }

  async recordSolutionViewed(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): Promise<UserQuestionState> {
    if (!this.isPgConfigured()) {
      let q = this.memState.userQuestionState.find(
        (x) => x.userId === userId && x.questionId === questionId && x.dialect === dialect
      );
      if (!q) {
        q = {
          userId,
          dialect,
          questionId,
          isSolved: false,
          status: "not_started",
          attemptCount: 0,
          hintsUsed: 0,
          solutionViewed: true,
          xpAwarded: 0,
          updatedAt: new Date().toISOString(),
        };
        this.memState.userQuestionState.push(q);
      } else {
        q.solutionViewed = true;
        q.updatedAt = new Date().toISOString();
      }
      return q;
    }

    const current = await this.getUserQuestionState(userId, questionId, dialect);
    const now = new Date().toISOString();

    const res = await query(
      `INSERT INTO user_question_state (
         user_id, dialect, question_id, is_solved, status, attempt_count,
         hints_used, solution_viewed, updated_at, xp_awarded
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
       ON CONFLICT (user_id, dialect, question_id) DO UPDATE SET
         solution_viewed = true,
         updated_at = EXCLUDED.updated_at
       RETURNING *;`,
      [
        userId,
        dialect,
        questionId,
        current.isSolved,
        current.status,
        current.attemptCount,
        current.hintsUsed,
        now,
        current.xpAwarded,
      ]
    );

    return mapQuestionStateRow(res.rows[0]);
  }

  // --- Submissions, Attempts, XP ---
  async recordSubmission(params: {
    userId: string;
    questionId: string;
    dialect?: Dialect;
    queryText: string;
    verdict: "correct" | "incorrect" | "error" | "timeout";
    executionTimeMs: number;
    passedCount: number;
    totalCount: number;
    baseXp: number;
    errorMessage?: string;
  }): Promise<{ attempt: UserAttempt; xpEarned: number }> {
    const {
      userId,
      questionId,
      dialect = "postgresql",
      queryText,
      verdict,
      executionTimeMs,
      passedCount,
      totalCount,
      baseXp,
      errorMessage,
    } = params;

    const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    if (!this.isPgConfigured()) {
      const attempt: UserAttempt = {
        id: attemptId,
        userId,
        dialect,
        questionId,
        queryText,
        verdict,
        executionTimeMs,
        passedCount,
        totalCount,
        errorMessage,
        createdAt: now,
      };
      this.memState.userAttempts.push(attempt);
      this.memState.queryHistory.push({
        id: `qh-${Date.now()}`,
        userId,
        dialect,
        questionId,
        queryText,
        status: verdict === "correct" ? "success" : "error",
        createdAt: now,
      });

      let q = this.memState.userQuestionState.find(
        (x) => x.userId === userId && x.questionId === questionId && x.dialect === dialect
      );
      if (!q) {
        q = {
          userId,
          dialect,
          questionId,
          isSolved: false,
          status: "not_started",
          attemptCount: 0,
          hintsUsed: 0,
          solutionViewed: false,
          xpAwarded: 0,
          updatedAt: now,
        };
        this.memState.userQuestionState.push(q);
      }

      q.attemptCount = (q.attemptCount || 0) + 1;
      q.lastSubmittedQuery = queryText;
      q.lastSubmittedAt = now;
      q.updatedAt = now;

      let xpEarned = 0;
      if (verdict === "correct") {
        const wasAlreadySolved = q.isSolved;
        q.isSolved = true;
        q.status = "solved";
        if (!q.firstSolvedAt) q.firstSolvedAt = now;
        if (!wasAlreadySolved) {
          if (q.solutionViewed) {
            xpEarned = 0;
          } else {
            const penalty = Math.max(0.4, 1.0 - q.hintsUsed * 0.2);
            xpEarned = Math.round(baseXp * penalty);
          }
          q.xpAwarded = xpEarned;
          if (xpEarned > 0) {
            this.memState.xpEvents.push({
              id: `xp-${Date.now()}`,
              userId,
              dialect,
              sourceType: "question_solve",
              sourceId: questionId,
              amount: xpEarned,
              createdAt: now,
            });
          }
        }
      } else if (!q.isSolved) {
        q.status = "attempted";
      }

      return { attempt, xpEarned };
    }

    const attemptRes = await query(
      `INSERT INTO user_attempts (
         id, user_id, dialect, question_id, query_text, verdict,
         execution_time_ms, passed_count, total_count, error_message, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *;`,
      [
        attemptId,
        userId,
        dialect,
        questionId,
        queryText,
        verdict,
        executionTimeMs,
        passedCount,
        totalCount,
        errorMessage || null,
        now,
      ]
    );

    const historyId = `qh-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    await query(
      `INSERT INTO query_history (id, user_id, dialect, question_id, query_text, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [
        historyId,
        userId,
        dialect,
        questionId,
        queryText,
        verdict === "correct" ? "success" : "error",
        now,
      ]
    );

    const qState = await this.getUserQuestionState(userId, questionId, dialect);
    const newAttemptCount = (qState.attemptCount || 0) + 1;
    let xpEarned = 0;
    let newIsSolved = qState.isSolved;
    let newStatus = qState.status;
    let firstSolvedAt = qState.firstSolvedAt;
    let xpAwarded = qState.xpAwarded;

    if (verdict === "correct") {
      const wasAlreadySolved = qState.isSolved;
      newIsSolved = true;
      newStatus = "solved";
      if (!firstSolvedAt) {
        firstSolvedAt = now;
      }

      if (!wasAlreadySolved) {
        if (qState.solutionViewed) {
          xpEarned = 0;
        } else {
          const penaltyMultiplier = Math.max(0.4, 1.0 - qState.hintsUsed * 0.2);
          xpEarned = Math.round(baseXp * penaltyMultiplier);
        }
        xpAwarded = xpEarned;

        if (xpEarned > 0) {
          const xpId = `xp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          await query(
            `INSERT INTO xp_events (id, user_id, dialect, source_type, source_id, amount, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7);`,
            [xpId, userId, dialect, "question_solve", questionId, xpEarned, now]
          );
        }
      }
    } else {
      if (!qState.isSolved) {
        newStatus = "attempted";
      }
    }

    await query(
      `INSERT INTO user_question_state (
         user_id, dialect, question_id, is_solved, status, attempt_count,
         hints_used, solution_viewed, first_solved_at, last_submitted_query,
         last_submitted_at, updated_at, xp_awarded
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (user_id, dialect, question_id) DO UPDATE SET
         is_solved = EXCLUDED.is_solved,
         status = EXCLUDED.status,
         attempt_count = EXCLUDED.attempt_count,
         first_solved_at = COALESCE(user_question_state.first_solved_at, EXCLUDED.first_solved_at),
         last_submitted_query = EXCLUDED.last_submitted_query,
         last_submitted_at = EXCLUDED.last_submitted_at,
         updated_at = EXCLUDED.updated_at,
         xp_awarded = EXCLUDED.xp_awarded;`,
      [
        userId,
        dialect,
        questionId,
        newIsSolved,
        newStatus,
        newAttemptCount,
        qState.hintsUsed,
        qState.solutionViewed,
        firstSolvedAt || null,
        queryText,
        now,
        now,
        xpAwarded,
      ]
    );

    return {
      attempt: mapAttemptRow(attemptRes.rows[0]),
      xpEarned,
    };
  }

  // --- Draft Management ---
  async saveDraft(
    userId: string,
    questionId: string,
    dialect: Dialect,
    draftText: string
  ): Promise<UserDraft> {
    const now = new Date().toISOString();
    if (!this.isPgConfigured()) {
      let d = this.memState.userDrafts.find(
        (x) => x.userId === userId && x.questionId === questionId && x.dialect === dialect
      );
      if (d) {
        d.draftText = draftText;
        d.updatedAt = now;
      } else {
        d = { userId, dialect, questionId, draftText, updatedAt: now };
        this.memState.userDrafts.push(d);
      }
      return d;
    }

    const res = await query(
      `INSERT INTO user_drafts (user_id, dialect, question_id, draft_text, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, dialect, question_id) DO UPDATE SET
         draft_text = EXCLUDED.draft_text,
         updated_at = EXCLUDED.updated_at
       RETURNING *;`,
      [userId, dialect, questionId, draftText, now]
    );
    return mapDraftRow(res.rows[0]);
  }

  async getDraft(userId: string, questionId: string, dialect: Dialect): Promise<string | undefined> {
    if (!this.isPgConfigured()) {
      return this.memState.userDrafts.find(
        (d) => d.userId === userId && d.questionId === questionId && d.dialect === dialect
      )?.draftText;
    }
    const res = await query(
      `SELECT draft_text FROM user_drafts WHERE user_id = $1 AND dialect = $2 AND question_id = $3;`,
      [userId, dialect, questionId]
    );
    return res.rows.length > 0 ? res.rows[0].draft_text : undefined;
  }

  async clearDraft(userId: string, questionId: string, dialect: Dialect): Promise<void> {
    if (!this.isPgConfigured()) {
      const idx = this.memState.userDrafts.findIndex(
        (d) => d.userId === userId && d.questionId === questionId && d.dialect === dialect
      );
      if (idx >= 0) this.memState.userDrafts.splice(idx, 1);
      return;
    }
    await query(
      `DELETE FROM user_drafts WHERE user_id = $1 AND dialect = $2 AND question_id = $3;`,
      [userId, dialect, questionId]
    );
  }

  async mergeGuestProgress(
    userId: string,
    guestSolvedQuestionIds: string[],
    guestDrafts?: { questionId: string; dialect: Dialect; draftText: string }[],
    dialect: Dialect = "postgresql"
  ): Promise<void> {
    for (const qId of guestSolvedQuestionIds) {
      const qState = await this.getUserQuestionState(userId, qId, dialect);
      if (!qState.isSolved) {
        if (!this.isPgConfigured()) {
          let mem = this.memState.userQuestionState.find(
            (x) => x.userId === userId && x.questionId === qId && x.dialect === dialect
          );
          if (!mem) {
            mem = {
              userId,
              dialect,
              questionId: qId,
              isSolved: true,
              status: "solved",
              attemptCount: 1,
              hintsUsed: 0,
              solutionViewed: false,
              xpAwarded: 0,
              firstSolvedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            this.memState.userQuestionState.push(mem);
          } else {
            mem.isSolved = true;
            mem.status = "solved";
            mem.firstSolvedAt = mem.firstSolvedAt || new Date().toISOString();
          }
        } else {
          await query(
            `INSERT INTO user_question_state (
               user_id, dialect, question_id, is_solved, status, attempt_count,
               hints_used, solution_viewed, first_solved_at, updated_at, xp_awarded
             ) VALUES ($1, $2, $3, true, 'solved', 1, 0, false, NOW(), NOW(), 0)
             ON CONFLICT (user_id, dialect, question_id) DO UPDATE SET
               is_solved = true,
               status = 'solved',
               first_solved_at = COALESCE(user_question_state.first_solved_at, NOW()),
               updated_at = NOW();`,
            [userId, dialect, qId]
          );
        }
      }
    }

    if (guestDrafts) {
      for (const gd of guestDrafts) {
        const d = gd.dialect || dialect;
        const existingDraft = await this.getDraft(userId, gd.questionId, d);
        if (!existingDraft) {
          await this.saveDraft(userId, gd.questionId, d, gd.draftText);
        }
      }
    }
  }

  // --- XP & Progression Metrics ---
  async getUserXp(userId: string, dialect?: Dialect): Promise<number> {
    if (!this.isPgConfigured()) {
      return this.memState.xpEvents
        .filter((e) => e.userId === userId && (!dialect || e.dialect === dialect))
        .reduce((sum, e) => sum + e.amount, 0);
    }
    let sql = `SELECT COALESCE(SUM(amount), 0) AS total FROM xp_events WHERE user_id = $1`;
    const params: any[] = [userId];
    if (dialect) {
      sql += ` AND dialect = $2`;
      params.push(dialect);
    }
    const res = await query(sql, params);
    return Number(res.rows[0]?.total || 0);
  }

  async getUserSolvedQuestions(userId: string, dialect: Dialect = "postgresql"): Promise<string[]> {
    if (!this.isPgConfigured()) {
      return this.memState.userQuestionState
        .filter((s) => s.userId === userId && s.dialect === dialect && s.isSolved)
        .map((s) => s.questionId);
    }
    const res = await query(
      `SELECT question_id FROM user_question_state WHERE user_id = $1 AND dialect = $2 AND is_solved = true;`,
      [userId, dialect]
    );
    return res.rows.map((r) => r.question_id);
  }

  async getUserAccuracy(userId: string, dialect?: Dialect): Promise<number> {
    if (!this.isPgConfigured()) {
      const atts = this.memState.userAttempts.filter(
        (a) => a.userId === userId && (!dialect || a.dialect === dialect)
      );
      if (atts.length === 0) return 0;
      const correct = atts.filter((a) => a.verdict === "correct").length;
      return Math.round((correct / atts.length) * 100);
    }
    let sql = `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE verdict = 'correct') AS correct FROM user_attempts WHERE user_id = $1`;
    const params: any[] = [userId];
    if (dialect) {
      sql += ` AND dialect = $2`;
      params.push(dialect);
    }
    const res = await query(sql, params);
    const total = Number(res.rows[0]?.total || 0);
    if (total === 0) return 0;
    const correct = Number(res.rows[0]?.correct || 0);
    return Math.round((correct / total) * 100);
  }

  // --- Bookmarks / Saved Questions ---
  async toggleBookmark(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): Promise<boolean> {
    if (!this.isPgConfigured()) {
      const idx = this.memState.savedQuestions.findIndex(
        (b) => b.userId === userId && b.questionId === questionId && b.dialect === dialect
      );
      if (idx >= 0) {
        this.memState.savedQuestions.splice(idx, 1);
        return false;
      }
      this.memState.savedQuestions.push({
        userId,
        dialect,
        questionId,
        createdAt: new Date().toISOString(),
      });
      return true;
    }

    const check = await query(
      `SELECT 1 FROM saved_questions WHERE user_id = $1 AND dialect = $2 AND question_id = $3;`,
      [userId, dialect, questionId]
    );

    if (check.rows.length > 0) {
      await query(
        `DELETE FROM saved_questions WHERE user_id = $1 AND dialect = $2 AND question_id = $3;`,
        [userId, dialect, questionId]
      );
      return false;
    } else {
      await query(
        `INSERT INTO saved_questions (user_id, dialect, question_id, created_at) VALUES ($1, $2, $3, NOW());`,
        [userId, dialect, questionId]
      );
      return true;
    }
  }

  async getUserBookmarks(userId: string, dialect?: Dialect): Promise<string[]> {
    if (!this.isPgConfigured()) {
      return this.memState.savedQuestions
        .filter((b) => b.userId === userId && (!dialect || b.dialect === dialect))
        .map((b) => b.questionId);
    }
    let sql = `SELECT question_id FROM saved_questions WHERE user_id = $1`;
    const params: any[] = [userId];
    if (dialect) {
      sql += ` AND dialect = $2`;
      params.push(dialect);
    }
    const res = await query(sql, params);
    return res.rows.map((r) => r.question_id);
  }

  // --- Query History ---
  async getUserHistory(
    userId: string,
    limit = 50,
    dialect?: Dialect
  ): Promise<QueryHistoryItem[]> {
    if (!this.isPgConfigured()) {
      return this.memState.queryHistory
        .filter((h) => h.userId === userId && (!dialect || h.dialect === dialect))
        .slice(-limit)
        .reverse();
    }
    let sql = `SELECT id, user_id, dialect, question_id, query_text, status, created_at FROM query_history WHERE user_id = $1`;
    const params: any[] = [userId];
    if (dialect) {
      sql += ` AND dialect = $2`;
      params.push(dialect);
    }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const res = await query(sql, params);
    return res.rows.map(mapHistoryRow);
  }

  async ensureDefaultAdmin(): Promise<void> {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = crypto.scryptSync("admin123", salt, 64).toString("hex");
    const passwordHash = `${salt}:${derivedKey}`;

    const adminUser: User = {
      id: "usr-admin-system",
      userId: "admin",
      userIdNormalized: "admin",
      email: "admin@quro.com",
      emailNormalized: "admin@quro.com",
      passwordHash,
      name: "Administrator",
      role: "admin",
      timezone: "UTC",
      emailVerified: true,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.isPgConfigured()) {
      const exists = this.memState.users.some((u) => u.role === "admin");
      if (!exists) {
        this.memState.users.push(adminUser);
        this.memState.userSettings.push({
          userId: adminUser.id,
          practiceModeEnabled: false,
          theme: "dark",
          leaderboardVisible: true,
        });
      }
      return;
    }

    await query(
      `INSERT INTO users (
         id, user_id, user_id_normalized, email, email_normalized, password_hash,
         name, role, timezone, email_verified, status, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'active', $10, $11)
       ON CONFLICT (id) DO NOTHING;`,
      [
        adminUser.id,
        adminUser.userId,
        adminUser.userIdNormalized,
        adminUser.email,
        adminUser.emailNormalized,
        adminUser.passwordHash,
        adminUser.name,
        adminUser.role,
        adminUser.timezone,
        adminUser.createdAt,
        adminUser.updatedAt,
      ]
    );

    await query(
      `INSERT INTO user_settings (user_id, practice_mode_enabled, theme, leaderboard_visible)
       VALUES ($1, false, 'dark', true)
       ON CONFLICT (user_id) DO NOTHING;`,
      [adminUser.id]
    );
  }

  async setUserEmailVerified(email: string, verified = true): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    if (!this.isPgConfigured()) {
      const u = this.memState.users.find(
        (x) => x.email.toLowerCase().trim() === normalizedEmail
      );
      if (u) {
        u.emailVerified = verified;
        u.emailVerifiedAt = verified ? new Date().toISOString() : null;
        return true;
      }
      return false;
    }
    const res = await query(
      `UPDATE users
       SET email_verified = $1, email_verified_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END, updated_at = NOW()
       WHERE LOWER(email) = LOWER($2) OR email_normalized = LOWER($2)
       RETURNING id;`,
      [verified, normalizedEmail]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async resetForTesting(): Promise<void> {
    this.memState = {
      users: [],
      userSettings: [],
      userQuestionState: [],
      userAttempts: [],
      xpEvents: [],
      savedQuestions: [],
      queryHistory: [],
      userDrafts: [],
    };

    if (this.isPgConfigured()) {
      try {
        await query(`
          TRUNCATE email_otps, user_drafts, query_history, saved_questions, xp_events, user_attempts, user_question_state, user_settings, users CASCADE;
        `);
      } catch {}
    }
  }
}

export const appStore = new PgAppStore();
