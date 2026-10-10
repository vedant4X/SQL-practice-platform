import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Dialect } from "../engine/types";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  passwordPlain?: string;
  name: string;
  role: "user" | "admin";
  timezone: string;
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

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "app-db.json");

/**
 * Migration: Ensures all historical records in data/app-db.json are tagged with dialect = "postgresql"
 */
export function migrateAppDbToDualDialect(rawState: any): DatabaseState {
  const state: DatabaseState = {
    users: (rawState?.users || []).map((u: any) => {
      if (u.email === "admin@sqljudge.com") {
        return { ...u, email: "admin@quro.com" };
      }
      return u;
    }),
    userSettings: rawState?.userSettings || [],
    userQuestionState: (rawState?.userQuestionState || []).map((q: any) => ({
      ...q,
      dialect: q.dialect || "postgresql",
      status: q.status || (q.isSolved ? "solved" : "not_started"),
      attemptCount: q.attemptCount ?? (q.isSolved ? 1 : 0),
      updatedAt: q.updatedAt || new Date().toISOString(),
    })),
    userAttempts: (rawState?.userAttempts || []).map((a: any) => ({
      ...a,
      dialect: a.dialect || "postgresql",
    })),
    xpEvents: (rawState?.xpEvents || []).map((x: any) => ({
      ...x,
      dialect: x.dialect || "postgresql",
    })),
    savedQuestions: (rawState?.savedQuestions || []).map((s: any) => ({
      ...s,
      dialect: s.dialect || "postgresql",
    })),
    queryHistory: (rawState?.queryHistory || []).map((h: any) => ({
      ...h,
      dialect: h.dialect || "postgresql",
    })),
    userDrafts: (rawState?.userDrafts || []).map((d: any) => ({
      ...d,
      dialect: d.dialect || "postgresql",
    })),
  };
  return state;
}

class AppStore {
  private state: DatabaseState = {
    users: [],
    userSettings: [],
    userQuestionState: [],
    userAttempts: [],
    xpEvents: [],
    savedQuestions: [],
    queryHistory: [],
    userDrafts: [],
  };

  private initialized = false;
  private persistTimer: NodeJS.Timeout | null = null;

  // In-memory indexes for rapid O(1) lookups
  private userByIdIndex = new Map<string, User>();
  private userByEmailIndex = new Map<string, User>();
  private questionStateIndex = new Map<string, UserQuestionState>(); // key: `${userId}:${dialect}:${questionId}`
  private draftIndex = new Map<string, UserDraft>(); // key: `${userId}:${dialect}:${questionId}`

  constructor() {
    this.init();
  }

  private rebuildIndexes() {
    this.userByIdIndex.clear();
    this.userByEmailIndex.clear();
    this.questionStateIndex.clear();
    this.draftIndex.clear();

    for (const u of this.state.users) {
      this.userByIdIndex.set(u.id, u);
      this.userByEmailIndex.set(u.email.toLowerCase(), u);
    }

    for (const q of this.state.userQuestionState) {
      const key = `${q.userId}:${q.dialect}:${q.questionId}`;
      this.questionStateIndex.set(key, q);
    }

    for (const d of this.state.userDrafts) {
      const key = `${d.userId}:${d.dialect}:${d.questionId}`;
      this.draftIndex.set(key, d);
    }
  }

  private init() {
    if (this.initialized) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.state = migrateAppDbToDualDialect(parsed);
        this.persistSync(); // Save migrated state immediately
      } else {
        this.persistSync();
      }
      this.rebuildIndexes();
      this.ensureDefaultAdmin();
      this.initialized = true;
    } catch {
      this.initialized = true;
    }
  }

  public ensureDefaultAdmin() {
    const adminExists = this.state.users.some((u) => u.role === "admin");
    if (!adminExists) {
      const salt = crypto.randomBytes(16).toString("hex");
      const derivedKey = crypto.scryptSync("admin123", salt, 64).toString("hex");
      const passwordHash = `${salt}:${derivedKey}`;

      const adminUser: User = {
        id: "usr-admin-system",
        email: "admin@quro.com",
        passwordHash,
        passwordPlain: "admin123",
        name: "Administrator",
        role: "admin",
        timezone: "UTC",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.state.users.push(adminUser);
      this.userByIdIndex.set(adminUser.id, adminUser);
      this.userByEmailIndex.set(adminUser.email.toLowerCase(), adminUser);
      this.state.userSettings.push({
        userId: adminUser.id,
        practiceModeEnabled: false,
        theme: "dark",
        leaderboardVisible: true,
      });
      this.persistSync();
    }
  }

  public persistSync() {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(this.state, null, 2), "utf-8");
      fs.renameSync(tmp, DB_FILE);
    } catch {
      // In-memory fallback
    }
  }

  private persist() {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persistSync();
    }, 200);
  }

  // --- Users ---
  getAllUsers(): User[] {
    return [...this.state.users];
  }

  getUserById(id: string): User | undefined {
    return this.userByIdIndex.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    const normalized = email.toLowerCase().trim();
    if (normalized === "admin@sqljudge.com") {
      return this.userByEmailIndex.get("admin@quro.com") || this.userByEmailIndex.get("admin@sqljudge.com");
    }
    return this.userByEmailIndex.get(normalized);
  }

  createUser(user: User): User {
    this.state.users.push(user);
    this.userByIdIndex.set(user.id, user);
    this.userByEmailIndex.set(user.email.toLowerCase(), user);

    this.state.userSettings.push({
      userId: user.id,
      practiceModeEnabled: false,
      theme: "dark",
      leaderboardVisible: false,
    });
    this.persist();
    return user;
  }

  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return undefined;

    const oldEmail = user.email.toLowerCase();
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });

    if (updates.email && updates.email.toLowerCase() !== oldEmail) {
      this.userByEmailIndex.delete(oldEmail);
      this.userByEmailIndex.set(user.email.toLowerCase(), user);
    }
    this.userByIdIndex.set(user.id, user);
    this.persist();
    return user;
  }

  deleteUser(userId: string): boolean {
    const idx = this.state.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;

    const user = this.state.users[idx];
    this.state.users.splice(idx, 1);
    this.userByIdIndex.delete(user.id);
    this.userByEmailIndex.delete(user.email.toLowerCase());

    this.state.userSettings = this.state.userSettings.filter((s) => s.userId !== userId);
    this.state.userQuestionState = this.state.userQuestionState.filter((q) => q.userId !== userId);
    this.state.userDrafts = this.state.userDrafts.filter((d) => d.userId !== userId);
    this.state.userAttempts = this.state.userAttempts.filter((a) => a.userId !== userId);
    this.state.xpEvents = this.state.xpEvents.filter((x) => x.userId !== userId);
    this.state.savedQuestions = this.state.savedQuestions.filter((s) => s.userId !== userId);
    this.state.queryHistory = this.state.queryHistory.filter((h) => h.userId !== userId);

    this.rebuildIndexes();
    this.persist();
    return true;
  }

  // --- Settings ---
  getUserSettings(userId: string): UserSettings {
    const existing = this.state.userSettings.find((s) => s.userId === userId);
    if (existing) return existing;
    const def: UserSettings = {
      userId,
      practiceModeEnabled: false,
      theme: "dark",
      leaderboardVisible: false,
    };
    this.state.userSettings.push(def);
    this.persist();
    return def;
  }

  updateUserSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
    let settings = this.state.userSettings.find((s) => s.userId === userId);
    if (!settings) {
      settings = {
        userId,
        practiceModeEnabled: false,
        theme: "dark",
        leaderboardVisible: false,
        ...updates,
      };
      this.state.userSettings.push(settings);
    } else {
      Object.assign(settings, updates);
    }
    this.persist();
    return settings;
  }

  // --- Question State ---
  getUserQuestionState(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): UserQuestionState {
    const key = `${userId}:${dialect}:${questionId}`;
    const existing = this.questionStateIndex.get(key);
    if (existing) return existing;

    const def: UserQuestionState = {
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
    this.state.userQuestionState.push(def);
    this.questionStateIndex.set(key, def);
    this.persist();
    return def;
  }

  recordHintUsed(
    userId: string,
    questionId: string,
    level: number,
    dialect: Dialect = "postgresql"
  ): UserQuestionState {
    const state = this.getUserQuestionState(userId, questionId, dialect);
    if (level > state.hintsUsed) {
      state.hintsUsed = level;
      state.updatedAt = new Date().toISOString();
      this.persist();
    }
    return state;
  }

  recordSolutionViewed(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): UserQuestionState {
    const state = this.getUserQuestionState(userId, questionId, dialect);
    state.solutionViewed = true;
    state.updatedAt = new Date().toISOString();
    this.persist();
    return state;
  }

  // --- Submissions, Attempts, XP ---
  recordSubmission(params: {
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
  }): { attempt: UserAttempt; xpEarned: number } {
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
      createdAt: new Date().toISOString(),
    };
    this.state.userAttempts.push(attempt);

    // Record in query history
    this.state.queryHistory.push({
      id: `qh-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId,
      dialect,
      questionId,
      queryText,
      status: verdict === "correct" ? "success" : "error",
      createdAt: new Date().toISOString(),
    });

    let xpEarned = 0;
    const qState = this.getUserQuestionState(userId, questionId, dialect);

    // Monotonic and idempotent updates
    qState.attemptCount = (qState.attemptCount || 0) + 1;
    qState.lastSubmittedQuery = queryText;
    qState.lastSubmittedAt = new Date().toISOString();
    qState.updatedAt = new Date().toISOString();

    if (verdict === "correct") {
      const wasAlreadySolved = qState.isSolved;
      qState.isSolved = true;
      qState.status = "solved";
      if (!qState.firstSolvedAt) {
        qState.firstSolvedAt = new Date().toISOString();
      }

      if (!wasAlreadySolved) {
        if (qState.solutionViewed) {
          xpEarned = 0;
        } else {
          const penaltyMultiplier = Math.max(0.4, 1.0 - qState.hintsUsed * 0.2);
          xpEarned = Math.round(baseXp * penaltyMultiplier);
        }

        qState.xpAwarded = xpEarned;

        if (xpEarned > 0) {
          this.state.xpEvents.push({
            id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            userId,
            dialect,
            sourceType: "question_solve",
            sourceId: questionId,
            amount: xpEarned,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } else {
      // MONOTONIC: If already solved in the past, never downgrade to attempted!
      if (!qState.isSolved) {
        qState.status = "attempted";
      }
    }

    this.persist();
    return { attempt, xpEarned };
  }

  // --- Draft Management ---
  saveDraft(userId: string, questionId: string, dialect: Dialect, draftText: string): UserDraft {
    const key = `${userId}:${dialect}:${questionId}`;
    let draft = this.draftIndex.get(key);
    if (draft) {
      draft.draftText = draftText;
      draft.updatedAt = new Date().toISOString();
    } else {
      draft = {
        userId,
        dialect,
        questionId,
        draftText,
        updatedAt: new Date().toISOString(),
      };
      this.state.userDrafts.push(draft);
      this.draftIndex.set(key, draft);
    }
    this.persist();
    return draft;
  }

  getDraft(userId: string, questionId: string, dialect: Dialect): string | undefined {
    const key = `${userId}:${dialect}:${questionId}`;
    return this.draftIndex.get(key)?.draftText;
  }

  clearDraft(userId: string, questionId: string, dialect: Dialect): void {
    const key = `${userId}:${dialect}:${questionId}`;
    const idx = this.state.userDrafts.findIndex(
      (d) => d.userId === userId && d.dialect === dialect && d.questionId === questionId
    );
    if (idx >= 0) {
      this.state.userDrafts.splice(idx, 1);
      this.draftIndex.delete(key);
      this.persist();
    }
  }

  mergeGuestProgress(
    userId: string,
    guestSolvedQuestionIds: string[],
    guestDrafts?: { questionId: string; dialect: Dialect; draftText: string }[],
    dialect: Dialect = "postgresql"
  ): void {
    for (const qId of guestSolvedQuestionIds) {
      const qState = this.getUserQuestionState(userId, qId, dialect);
      if (!qState.isSolved) {
        qState.isSolved = true;
        qState.status = "solved";
        if (!qState.firstSolvedAt) {
          qState.firstSolvedAt = new Date().toISOString();
        }
        qState.updatedAt = new Date().toISOString();
      }
    }
    if (guestDrafts) {
      for (const gd of guestDrafts) {
        if (!this.getDraft(userId, gd.questionId, gd.dialect || dialect)) {
          this.saveDraft(userId, gd.questionId, gd.dialect || dialect, gd.draftText);
        }
      }
    }
    this.persist();
  }

  // --- XP & Progression Metrics ---
  getUserXp(userId: string, dialect?: Dialect): number {
    return this.state.xpEvents
      .filter((e) => e.userId === userId && (!dialect || e.dialect === dialect))
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getUserSolvedQuestions(userId: string, dialect: Dialect = "postgresql"): string[] {
    return this.state.userQuestionState
      .filter((s) => s.userId === userId && s.dialect === dialect && s.isSolved)
      .map((s) => s.questionId);
  }

  getUserAccuracy(userId: string, dialect?: Dialect): number {
    const attempts = this.state.userAttempts.filter(
      (a) => a.userId === userId && (!dialect || a.dialect === dialect)
    );
    if (attempts.length === 0) return 0;
    const correct = attempts.filter((a) => a.verdict === "correct").length;
    return Math.round((correct / attempts.length) * 100);
  }

  // --- Bookmarks / Saved Questions ---
  toggleBookmark(
    userId: string,
    questionId: string,
    dialect: Dialect = "postgresql"
  ): boolean {
    const idx = this.state.savedQuestions.findIndex(
      (b) => b.userId === userId && b.questionId === questionId && b.dialect === dialect
    );
    if (idx >= 0) {
      this.state.savedQuestions.splice(idx, 1);
      this.persist();
      return false;
    } else {
      this.state.savedQuestions.push({
        userId,
        dialect,
        questionId,
        createdAt: new Date().toISOString(),
      });
      this.persist();
      return true;
    }
  }

  getUserBookmarks(userId: string, dialect?: Dialect): string[] {
    return this.state.savedQuestions
      .filter((b) => b.userId === userId && (!dialect || b.dialect === dialect))
      .map((b) => b.questionId);
  }

  // --- Query History ---
  getUserHistory(userId: string, limit = 50, dialect?: Dialect): QueryHistoryItem[] {
    return this.state.queryHistory
      .filter((h) => h.userId === userId && (!dialect || h.dialect === dialect))
      .slice(-limit)
      .reverse();
  }

  // Reset for tests
  resetForTesting() {
    this.state = {
      users: [],
      userSettings: [],
      userQuestionState: [],
      userAttempts: [],
      xpEvents: [],
      savedQuestions: [],
      queryHistory: [],
      userDrafts: [],
    };
    this.rebuildIndexes();
    this.persistSync();
  }
}

export const appStore = new AppStore();
