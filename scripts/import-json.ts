import fs from "fs";
import path from "path";
import { Client } from "pg";

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
            if (key && !(key in process.env)) {
              process.env[key] = val;
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }
}

loadEnv();

async function importJson() {
  const isDryRun = process.argv.includes("--dry-run");
  if (isDryRun) {
    console.log("=== DRY RUN MODE: No changes will be committed to the database ===");
  }

  const jsonFilePath = path.resolve(process.cwd(), "data", "app-db.json");
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`[Error] JSON data file not found at: ${jsonFilePath}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonFilePath, "utf-8");
  const data = JSON.parse(rawJson);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[Error] DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const requiresSsl = databaseUrl.includes("sslmode=require") || isProduction;

  const client = new Client({
    connectionString: databaseUrl,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database for JSON import.");

    await client.query("BEGIN;");

    const report: Record<string, { total: number; inserted: number; skipped: number }> = {};

    // 1. Users (NEVER insert passwordPlain)
    const users = (data.users || []).map((u: any) => {
      let email = u.email;
      if (email === "admin@sqljudge.com") {
        email = "admin@quro.com";
      }
      return {
        id: u.id,
        email: email.toLowerCase().trim(),
        passwordHash: u.passwordHash,
        name: u.name,
        role: u.role || "user",
        timezone: u.timezone || "UTC",
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString(),
      };
    });

    report["users"] = { total: users.length, inserted: 0, skipped: 0 };
    for (const u of users) {
      const res = await client.query(
        `INSERT INTO users (id, email, password_hash, name, role, timezone, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING;`,
        [u.id, u.email, u.passwordHash, u.name, u.role, u.timezone, true, u.createdAt, u.updatedAt]
      );
      if (res.rowCount && res.rowCount > 0) {
        report["users"].inserted++;
      } else {
        report["users"].skipped++;
      }
    }

    // 2. User Settings
    const userSettings = data.userSettings || [];
    report["user_settings"] = { total: userSettings.length, inserted: 0, skipped: 0 };
    for (const s of userSettings) {
      const res = await client.query(
        `INSERT INTO user_settings (user_id, practice_mode_enabled, theme, leaderboard_visible)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING;`,
        [s.userId, s.practiceModeEnabled ?? false, s.theme ?? "dark", s.leaderboardVisible ?? false]
      );
      if (res.rowCount && res.rowCount > 0) {
        report["user_settings"].inserted++;
      } else {
        report["user_settings"].skipped++;
      }
    }

    // 3. User Question State
    const userQuestionState = data.userQuestionState || [];
    report["user_question_state"] = { total: userQuestionState.length, inserted: 0, skipped: 0 };
    for (const q of userQuestionState) {
      const dialect = q.dialect || "postgresql";
      const status = q.status || (q.isSolved ? "solved" : "not_started");
      const attemptCount = q.attemptCount ?? (q.isSolved ? 1 : 0);
      const res = await client.query(
        `INSERT INTO user_question_state (
           user_id, dialect, question_id, is_solved, status, attempt_count,
           hints_used, solution_viewed, first_solved_at, last_submitted_query,
           last_submitted_at, updated_at, xp_awarded
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT DO NOTHING;`,
        [
          q.userId,
          dialect,
          q.questionId,
          q.isSolved ?? false,
          status,
          attemptCount,
          q.hintsUsed ?? 0,
          q.solutionViewed ?? false,
          q.firstSolvedAt || null,
          q.lastSubmittedQuery || null,
          q.lastSubmittedAt || null,
          q.updatedAt || new Date().toISOString(),
          q.xpAwarded ?? 0,
        ]
      );
      if (res.rowCount && res.rowCount > 0) {
        report["user_question_state"].inserted++;
      } else {
        report["user_question_state"].skipped++;
      }
    }

    // 4. User Attempts
    const userAttempts = data.userAttempts || [];
    report["user_attempts"] = { total: userAttempts.length, inserted: 0, skipped: 0 };
    for (const a of userAttempts) {
      const res = await client.query(
        `INSERT INTO user_attempts (
           id, user_id, dialect, question_id, query_text, verdict,
           execution_time_ms, passed_count, total_count, error_message, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING;`,
        [
          a.id,
          a.userId,
          a.dialect || "postgresql",
          a.questionId,
          a.queryText,
          a.verdict,
          a.executionTimeMs ?? 0,
          a.passedCount ?? 0,
          a.totalCount ?? 0,
          a.errorMessage || null,
          a.createdAt || new Date().toISOString(),
        ]
      );
      if (res.rowCount && res.rowCount > 0) {
        report["user_attempts"].inserted++;
      } else {
        report["user_attempts"].skipped++;
      }
    }

    // 5. XP Events
    const xpEvents = data.xpEvents || [];
    report["xp_events"] = { total: xpEvents.length, inserted: 0, skipped: 0 };
    for (const x of xpEvents) {
      const res = await client.query(
        `INSERT INTO xp_events (
           id, user_id, dialect, source_type, source_id, amount, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING;`,
        [
          x.id,
          x.userId,
          x.dialect || "postgresql",
          x.sourceType,
          x.sourceId,
          x.amount,
          x.createdAt || new Date().toISOString(),
        ]
      );
      if (res.rowCount && res.rowCount > 0) {
        report["xp_events"].inserted++;
      } else {
        report["xp_events"].skipped++;
      }
    }

    // 6. Saved Questions
    const savedQuestions = data.savedQuestions || [];
    report["saved_questions"] = { total: savedQuestions.length, inserted: 0, skipped: 0 };
    for (const s of savedQuestions) {
      const res = await client.query(
        `INSERT INTO saved_questions (user_id, dialect, question_id, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING;`,
        [s.userId, s.dialect || "postgresql", s.questionId, s.createdAt || new Date().toISOString()]
      );
      if (res.rowCount && res.rowCount > 0) {
        report["saved_questions"].inserted++;
      } else {
        report["saved_questions"].skipped++;
      }
    }

    // 7. Query History
    const queryHistory = data.queryHistory || [];
    report["query_history"] = { total: queryHistory.length, inserted: 0, skipped: 0 };
    for (const h of queryHistory) {
      const res = await client.query(
        `INSERT INTO query_history (
           id, user_id, dialect, question_id, query_text, status, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING;`,
        [
          h.id,
          h.userId,
          h.dialect || "postgresql",
          h.questionId || null,
          h.queryText,
          h.status,
          h.createdAt || new Date().toISOString(),
        ]
      );
      if (res.rowCount && res.rowCount > 0) {
        report["query_history"].inserted++;
      } else {
        report["query_history"].skipped++;
      }
    }

    // 8. User Drafts
    const userDrafts = data.userDrafts || [];
    report["user_drafts"] = { total: userDrafts.length, inserted: 0, skipped: 0 };
    for (const d of userDrafts) {
      const res = await client.query(
        `INSERT INTO user_drafts (user_id, dialect, question_id, draft_text, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING;`,
        [d.userId, d.dialect || "postgresql", d.questionId, d.draftText, d.updatedAt || new Date().toISOString()]
      );
      if (res.rowCount && res.rowCount > 0) {
        report["user_drafts"].inserted++;
      } else {
        report["user_drafts"].skipped++;
      }
    }

    if (isDryRun) {
      await client.query("ROLLBACK;");
      console.log("\n[Dry Run Summary] Database rolled back. Import results preview:");
    } else {
      await client.query("COMMIT;");
      console.log("\n[Import Summary] Successfully imported JSON data:");
    }

    console.table(
      Object.entries(report).map(([table, counts]) => ({
        Table: table,
        Total: counts.total,
        Imported: counts.inserted,
        Skipped: counts.skipped,
      }))
    );
  } catch (error) {
    await client.query("ROLLBACK;");
    console.error("Import failed with error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

importJson();
