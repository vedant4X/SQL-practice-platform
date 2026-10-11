import crypto from "crypto";
import { Dialect } from "../engine/types";
import { query } from "./pool";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  passwordPlain?: string;
  name: string;
  role: "user" | "admin";
  timezone: string;
  emailVerified?: boolean;
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
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    timezone: row.timezone,
    emailVerified: Boolean(row.email_verified),
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
  // --- Users ---
  async getAllUsers(): Promise<User[]> {
    const res = await query(
      `SELECT id, email, password_hash, name, role, timezone, email_verified, created_at, updated_at
       FROM users
       ORDER BY created_at ASC;`
    );
    return res.rows.map(mapUserRow);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const res = await query(
      `SELECT id, email, password_hash, name, role, timezone, email_verified, created_at, updated_at
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

    const res = await query(
      `SELECT id, email, password_hash, name, role, timezone, email_verified, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1;`,
      [normalized]
    );

    if (res.rows.length === 0 && email.toLowerCase().trim() === "admin@sqljudge.com") {
      const fallback = await query(
        `SELECT id, email, password_hash, name, role, timezone, email_verified, created_at, updated_at
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

  async createUser(user: User): Promise<User> {
    const createdAt = user.createdAt || new Date().toISOString();
    const updatedAt = user.updatedAt || new Date().toISOString();
    const normalizedEmail = user.email.toLowerCase().trim();
    const emailVerified = user.emailVerified ?? false;

    // Check email uniqueness explicitly to guard case-insensitive uniqueness
    const existing = await this.getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`User with email "${normalizedEmail}" already exists.`);
    }

    await query(
      `INSERT INTO users (id, email, password_hash, name, role, timezone, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        user.id,
        normalizedEmail,
        user.passwordHash,
        user.name,
        user.role,
        user.timezone || "UTC",
        emailVerified,
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
      email: normalizedEmail,
      emailVerified,
      createdAt,
      updatedAt,
    };
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
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
    const res = await query(`DELETE FROM users WHERE id = $1;`, [userId]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- Settings ---
  async getUserSettings(userId: string): Promise<UserSettings> {
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
      [def.userId, def.practiceModeEnabled, def.theme, def.leaderboardVisible]
    );

    return def;
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
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

    const res = await query(
      `INSERT INTO user_settings (user_id, practice_mode_enabled, theme, leaderboard_visible)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
       SET practice_mode_enabled = EXCLUDED.practice_mode_enabled,
           theme = EXCLUDED.theme,
           leaderboard_visible = EXCLUDED.leaderboard_visible
       RETURNING user_id, practice_mode_enabled, theme, leaderboard_visible;`,
      [userId, practiceModeEnabled, theme, leaderboardVisible]
    );

    return mapUserSettingsRow(res.rows[0]);
  }

  // --- Question State ---
  async getUserQuestionState(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): Promise<UserQuestionState> {
    const res = await query(
      `SELECT user_id, dialect, question_id, is_solved, status, attempt_count,
              hints_used, solution_viewed, first_solved_at, last_submitted_query,
              last_submitted_at, updated_at, xp_awarded
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
    const res = await query(
      `INSERT INTO user_question_state (
         user_id, dialect, question_id, is_solved, status, attempt_count,
         hints_used, solution_viewed, first_solved_at, last_submitted_query,
         last_submitted_at, updated_at, xp_awarded
       ) VALUES ($1, $2, $3, false, 'not_started', 0, $4, false, NULL, NULL, NULL, NOW(), 0)
       ON CONFLICT (user_id, dialect, question_id) DO UPDATE
       SET hints_used = GREATEST(user_question_state.hints_used, EXCLUDED.hints_used),
           updated_at = CASE
             WHEN EXCLUDED.hints_used > user_question_state.hints_used THEN NOW()
             ELSE user_question_state.updated_at
           END
       RETURNING user_id, dialect, question_id, is_solved, status, attempt_count,
                 hints_used, solution_viewed, first_solved_at, last_submitted_query,
                 last_submitted_at, updated_at, xp_awarded;`,
      [userId, dialect, questionId, level]
    );

    return mapQuestionStateRow(res.rows[0]);
  }

  async recordSolutionViewed(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): Promise<UserQuestionState> {
    const res = await query(
      `INSERT INTO user_question_state (
         user_id, dialect, question_id, is_solved, status, attempt_count,
         hints_used, solution_viewed, first_solved_at, last_submitted_query,
         last_submitted_at, updated_at, xp_awarded
       ) VALUES ($1, $2, $3, false, 'not_started', 0, 0, true, NULL, NULL, NULL, NOW(), 0)
       ON CONFLICT (user_id, dialect, question_id) DO UPDATE
       SET solution_viewed = true,
           updated_at = NOW()
       RETURNING user_id, dialect, question_id, is_solved, status, attempt_count,
                 hints_used, solution_viewed, first_solved_at, last_submitted_query,
                 last_submitted_at, updated_at, xp_awarded;`,
      [userId, dialect, questionId]
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
  }): { attempt: UserAttempt; xpEarned: number } | Promise<{ attempt: UserAttempt; xpEarned: number }> {
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

    const nowIso = new Date().toISOString();
    const attemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
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
      createdAt: nowIso,
    };

    await query(
      `INSERT INTO user_attempts (
         id, user_id, dialect, question_id, query_text, verdict,
         execution_time_ms, passed_count, total_count, error_message, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
      [
        attempt.id,
        attempt.userId,
        attempt.dialect,
        attempt.questionId,
        attempt.queryText,
        attempt.verdict,
        attempt.executionTimeMs,
        attempt.passedCount,
        attempt.totalCount,
        attempt.errorMessage || null,
        attempt.createdAt,
      ]
    );

    const historyId = `qh-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const historyStatus = verdict === "correct" ? "success" : "error";
    await query(
      `INSERT INTO query_history (
         id, user_id, dialect, question_id, query_text, status, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [historyId, userId, dialect, questionId, queryText, historyStatus, nowIso]
    );

    let xpEarned = 0;
    const qState = await this.getUserQuestionState(userId, questionId, dialect);

    const newAttemptCount = (qState.attemptCount || 0) + 1;
    let newIsSolved = qState.isSolved;
    let newStatus = qState.status;
    let firstSolvedAt = qState.firstSolvedAt;
    let xpAwarded = qState.xpAwarded;

    if (verdict === "correct") {
      const wasAlreadySolved = qState.isSolved;
      newIsSolved = true;
      newStatus = "solved";
      if (!firstSolvedAt) {
        firstSolvedAt = nowIso;
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
          const xpEventId = `xp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          await query(
            `INSERT INTO xp_events (
               id, user_id, dialect, source_type, source_id, amount, created_at
             ) VALUES ($1, $2, $3, 'question_solve', $4, $5, $6);`,
            [xpEventId, userId, dialect, questionId, xpEarned, nowIso]
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
       ON CONFLICT (user_id, dialect, question_id) DO UPDATE
       SET is_solved = EXCLUDED.is_solved,
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
        nowIso,
        nowIso,
        xpAwarded,
      ]
    );

    return { attempt, xpEarned };
  }

  // --- Draft Management ---
  async saveDraft(
    userId: string,
    questionId: string,
    dialect: Dialect,
    draftText: string
  ): Promise<UserDraft> {
    const now = new Date().toISOString();
    const res = await query(
      `INSERT INTO user_drafts (user_id, dialect, question_id, draft_text, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, dialect, question_id) DO UPDATE
       SET draft_text = EXCLUDED.draft_text,
           updated_at = EXCLUDED.updated_at
       RETURNING user_id, dialect, question_id, draft_text, updated_at;`,
      [userId, dialect, questionId, draftText, now]
    );

    return mapDraftRow(res.rows[0]);
  }

  async getDraft(userId: string, questionId: string, dialect: Dialect): Promise<string | undefined> {
    const res = await query(
      `SELECT draft_text
       FROM user_drafts
       WHERE user_id = $1 AND dialect = $2 AND question_id = $3;`,
      [userId, dialect, questionId]
    );

    return res.rows.length > 0 ? res.rows[0].draft_text : undefined;
  }

  async clearDraft(userId: string, questionId: string, dialect: Dialect): Promise<void> {
    await query(
      `DELETE FROM user_drafts
       WHERE user_id = $1 AND dialect = $2 AND question_id = $3;`,
      [userId, dialect, questionId]
    );
  }

  // --- Guest Progress Merge ---
  async mergeGuestProgress(
    userId: string,
    guestSolvedQuestionIds: string[],
    guestDrafts?: { questionId: string; dialect: Dialect; draftText: string }[],
    dialect: Dialect = "postgresql"
  ): Promise<void> {
    const now = new Date().toISOString();
    for (const qId of guestSolvedQuestionIds) {
      const qState = await this.getUserQuestionState(userId, qId, dialect);
      if (!qState.isSolved) {
        await query(
          `INSERT INTO user_question_state (
             user_id, dialect, question_id, is_solved, status, attempt_count,
             hints_used, solution_viewed, first_solved_at, updated_at, xp_awarded
           ) VALUES ($1, $2, $3, true, 'solved', 0, 0, false, $4, $4, 0)
           ON CONFLICT (user_id, dialect, question_id) DO UPDATE
           SET is_solved = true,
               status = 'solved',
               first_solved_at = COALESCE(user_question_state.first_solved_at, EXCLUDED.first_solved_at),
               updated_at = EXCLUDED.updated_at;`,
          [userId, dialect, qId, now]
        );
      }
    }

    if (guestDrafts) {
      for (const gd of guestDrafts) {
        const dDialect = gd.dialect || dialect;
        const existing = await this.getDraft(userId, gd.questionId, dDialect);
        if (!existing) {
          await this.saveDraft(userId, gd.questionId, dDialect, gd.draftText);
        }
      }
    }
  }

  // --- XP & Progression Metrics ---
  async getUserXp(userId: string, dialect?: Dialect): Promise<number> {
    let sql = `SELECT COALESCE(SUM(amount), 0) AS total FROM xp_events WHERE user_id = $1`;
    const params: any[] = [userId];
    if (dialect) {
      sql += ` AND dialect = $2`;
      params.push(dialect);
    }
    const res = await query(sql, params);
    return Number(res.rows[0]?.total ?? 0);
  }

  async getUserSolvedQuestions(userId: string, dialect: Dialect = "postgresql"): Promise<string[]> {
    const res = await query(
      `SELECT question_id
       FROM user_question_state
       WHERE user_id = $1 AND dialect = $2 AND is_solved = true
       ORDER BY first_solved_at ASC NULLS LAST;`,
      [userId, dialect]
    );
    return res.rows.map((r) => r.question_id);
  }

  async getUserAccuracy(userId: string, dialect?: Dialect): Promise<number> {
    let sql = `SELECT
                 COUNT(*) AS total,
                 COUNT(*) FILTER (WHERE verdict = 'correct') AS correct
               FROM user_attempts
               WHERE user_id = $1`;
    const params: any[] = [userId];
    if (dialect) {
      sql += ` AND dialect = $2`;
      params.push(dialect);
    }
    const res = await query(sql, params);
    const total = Number(res.rows[0]?.total ?? 0);
    const correct = Number(res.rows[0]?.correct ?? 0);
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  // --- Bookmarks / Saved Questions ---
  async toggleBookmark(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): Promise<boolean> {
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
        `INSERT INTO saved_questions (user_id, dialect, question_id, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, dialect, question_id) DO NOTHING;`,
        [userId, dialect, questionId]
      );
      return true;
    }
  }

  async getUserBookmarks(userId: string, dialect?: Dialect): Promise<string[]> {
    let sql = `SELECT question_id FROM saved_questions WHERE user_id = $1`;
    const params: any[] = [userId];
    if (dialect) {
      sql += ` AND dialect = $2`;
      params.push(dialect);
    }
    sql += ` ORDER BY created_at DESC;`;
    const res = await query(sql, params);
    return res.rows.map((r) => r.question_id);
  }

  // --- Query History ---
  async getUserHistory(
    userId: string,
    limit = 50,
    dialect?: Dialect
  ): Promise<QueryHistoryItem[]> {
    let sql = `SELECT id, user_id, dialect, question_id, query_text, status, created_at
               FROM query_history
               WHERE user_id = $1`;
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

  // --- Admin & Testing Utilities ---
  async ensureDefaultAdmin(): Promise<void> {
    const check = await query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1;`);
    if (check.rows.length === 0) {
      const salt = crypto.randomBytes(16).toString("hex");
      const derivedKey = crypto.scryptSync("admin123", salt, 64).toString("hex");
      const passwordHash = `${salt}:${derivedKey}`;

      const adminUser: User = {
        id: "usr-admin-system",
        email: "admin@quro.com",
        passwordHash,
        name: "Administrator",
        role: "admin",
        timezone: "UTC",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await query(
        `INSERT INTO users (id, email, password_hash, name, role, timezone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING;`,
        [
          adminUser.id,
          adminUser.email,
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
  }

  // --- Email OTP Verification ---
  async createEmailOtp(
    email: string,
    otpCode: string,
    purpose: "registration" | "login" | "verification" | "reset_password" = "registration",
    expiresInMinutes = 10
  ): Promise<string> {
    const id = `otp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const normalizedEmail = email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Invalidate any existing unconsumed OTPs for this email and purpose
    await query(
      `UPDATE email_otps
       SET consumed_at = NOW()
       WHERE LOWER(email) = LOWER($1) AND purpose = $2 AND consumed_at IS NULL;`,
      [normalizedEmail, purpose]
    );

    await query(
      `INSERT INTO email_otps (id, email, otp_code, purpose, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW());`,
      [id, normalizedEmail, otpCode, purpose, expiresAt.toISOString()]
    );

    return id;
  }

  async getLatestActiveOtp(
    email: string,
    purpose: "registration" | "login" | "verification" | "reset_password" = "registration"
  ): Promise<{ id: string; otpCode: string; expiresAt: Date; attempts: number; createdAt: Date } | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const res = await query(
      `SELECT id, otp_code, expires_at, attempts, created_at
       FROM email_otps
       WHERE LOWER(email) = LOWER($1) AND purpose = $2 AND consumed_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1;`,
      [normalizedEmail, purpose]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      otpCode: row.otp_code,
      expiresAt: new Date(row.expires_at),
      attempts: Number(row.attempts),
      createdAt: new Date(row.created_at),
    };
  }

  async recordOtpAttempt(id: string): Promise<number> {
    const res = await query(
      `UPDATE email_otps
       SET attempts = attempts + 1
       WHERE id = $1
       RETURNING attempts;`,
      [id]
    );
    return res.rows.length > 0 ? Number(res.rows[0].attempts) : 0;
  }

  async markOtpConsumed(id: string): Promise<void> {
    await query(
      `UPDATE email_otps
       SET consumed_at = NOW()
       WHERE id = $1;`,
      [id]
    );
  }

  async setUserEmailVerified(email: string, verified = true): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const res = await query(
      `UPDATE users
       SET email_verified = $1, updated_at = NOW()
       WHERE LOWER(email) = LOWER($2)
       RETURNING id;`,
      [verified, normalizedEmail]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async resetForTesting(): Promise<void> {
    await query(`
      TRUNCATE email_otps, user_drafts, query_history, saved_questions, xp_events, user_attempts, user_question_state, user_settings, users CASCADE;
    `);
  }
}

export const appStore = new PgAppStore();
