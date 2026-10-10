import { PGlite } from "@electric-sql/pglite";
import { getTestCaseSql } from "./dataset-loader";
import { translatePostgresError } from "./error-translator";
import { validateQuery } from "./statement-validator";
import { QueryExecutionResult, QuestionType } from "./types";

const STATEMENT_TIMEOUT_MS = parseInt(process.env.STATEMENT_TIMEOUT_MS || "10000", 10);
const MAX_ROW_LIMIT = parseInt(process.env.MAX_ROW_LIMIT || "1000", 10);
const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1MB
const MAX_POOL_SIZE_PER_KEY = 3;

interface PoolEntry {
  db: PGlite;
  inUse: boolean;
  createdAt: number;
}

const warmPool = new Map<string, PoolEntry[]>();

/**
 * Creates an ephemeral, isolated PostgreSQL 16 instance initialized with the specified dataset
 */
export async function createIsolatedSandbox(
  databaseId: string,
  variant: "sample" | "hidden_1" | "hidden_2" = "sample"
): Promise<PGlite> {
  const db = new PGlite();
  const initSql = getTestCaseSql(databaseId, variant);
  await db.exec(initSql);
  return db;
}

/**
 * Acquires a warm sandbox instance for read-only SELECT queries
 */
async function acquireWarmSandbox(
  databaseId: string,
  variant: "sample" | "hidden_1" | "hidden_2"
): Promise<{ db: PGlite; release: (isHealthy: boolean) => Promise<void> }> {
  const key = `${databaseId}:${variant}`;
  let entries = warmPool.get(key);
  if (!entries) {
    entries = [];
    warmPool.set(key, entries);
  }

  // Find idle instance
  const idleEntry = entries.find((e) => !e.inUse);
  if (idleEntry) {
    idleEntry.inUse = true;
    return {
      db: idleEntry.db,
      release: async (isHealthy: boolean) => {
        if (!isHealthy) {
          const idx = entries!.indexOf(idleEntry);
          if (idx !== -1) entries!.splice(idx, 1);
          try {
            await idleEntry.db.close();
          } catch {}
        } else {
          idleEntry.inUse = false;
        }
      },
    };
  }

  // Create new instance
  const db = await createIsolatedSandbox(databaseId, variant);
  const entry: PoolEntry = { db, inUse: true, createdAt: Date.now() };

  if (entries.length < MAX_POOL_SIZE_PER_KEY) {
    entries.push(entry);
  }

  return {
    db,
    release: async (isHealthy: boolean) => {
      if (!isHealthy || !entries!.includes(entry)) {
        const idx = entries!.indexOf(entry);
        if (idx !== -1) entries!.splice(idx, 1);
        try {
          await db.close();
        } catch {}
      } else {
        entry.inUse = false;
      }
    },
  };
}

export interface SandboxExecutionOptions {
  timeoutMs?: number;
  maxRows?: number;
  includeExplain?: boolean;
  questionType?: QuestionType;
  availableTables?: string[];
}

/**
 * Executes a user SQL query inside a secure sandbox
 */
export async function executeInSandbox(
  databaseId: string,
  query: string,
  variant: "sample" | "hidden_1" | "hidden_2" = "sample",
  options: SandboxExecutionOptions = {}
): Promise<QueryExecutionResult> {
  const timeoutMs = options.timeoutMs || STATEMENT_TIMEOUT_MS;
  const maxRows = options.maxRows || MAX_ROW_LIMIT;
  const questionType = options.questionType || "select";

  // 1. Static validation layer
  const validation = validateQuery(query, questionType);
  if (!validation.valid) {
    return {
      success: false,
      columns: [],
      rows: [],
      rowCount: 0,
      totalRows: 0,
      executionTimeMs: 0,
      hasMore: false,
      error: {
        code: validation.code || "VALIDATION_ERROR",
        message: validation.error || "Query validation failed.",
        userFacingMessage: validation.error || "Query validation failed.",
      },
    };
  }

  let db: PGlite | null = null;
  let releaseWarmDb: ((isHealthy: boolean) => Promise<void>) | null = null;
  let isHealthy = false;
  const startTime = Date.now();

  try {
    // 2. Initialize / Acquire PostgreSQL 16 engine
    if (questionType === "select") {
      const lease = await acquireWarmSandbox(databaseId, variant);
      db = lease.db;
      releaseWarmDb = lease.release;
    } else {
      db = await createIsolatedSandbox(databaseId, variant);
    }

    // 3. Execute with strict timeout enforcement
    const queryPromise = (async () => {
      let explainPlan: unknown = undefined;
      if (options.includeExplain && questionType === "select") {
        try {
          const explainRes = await db!.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
          if (explainRes.rows && explainRes.rows.length > 0) {
            explainPlan = (explainRes.rows[0] as any)["QUERY PLAN"];
          }
        } catch {
          // Non-fatal if explain fails
        }
      }

      let rawResult: any;
      if (questionType === "select") {
        await db!.exec("BEGIN;");
        try {
          rawResult = await db!.query(query);
        } finally {
          await db!.exec("ROLLBACK;");
        }
      } else {
        await db!.exec(query);
        rawResult = { rows: [], fields: [] };
      }

      return { rawResult, explainPlan };
    })();

    const timeoutPromise = new Promise<{ rawResult: any; explainPlan: undefined }>((_, reject) => {
      const timer = setTimeout(() => {
        const err = new Error("canceling statement due to statement timeout");
        (err as any).code = "57014";
        reject(err);
      }, timeoutMs);
      queryPromise.finally(() => clearTimeout(timer));
    });

    const { rawResult, explainPlan } = await Promise.race([queryPromise, timeoutPromise]);
    const executionTimeMs = Math.max(1, Date.now() - startTime);

    if (executionTimeMs >= timeoutMs) {
      const timeoutErr = new Error("canceling statement due to statement timeout");
      (timeoutErr as any).code = "57014";
      throw timeoutErr;
    }

    isHealthy = true;

    const rawRows = (rawResult.rows || []) as Record<string, unknown>[];
    const totalRows = rawRows.length;
    const hasMore = totalRows > maxRows;
    const truncatedRows = hasMore ? rawRows.slice(0, maxRows) : rawRows;

    let columns: string[] = [];
    if (rawResult.fields && rawResult.fields.length > 0) {
      columns = rawResult.fields.map((f: any) => f.name);
    } else if (truncatedRows.length > 0) {
      columns = Object.keys(truncatedRows[0]);
    }

    const payloadStr = JSON.stringify(truncatedRows);
    if (payloadStr.length > MAX_PAYLOAD_BYTES) {
      return {
        success: false,
        columns: [],
        rows: [],
        rowCount: 0,
        totalRows,
        executionTimeMs,
        hasMore: false,
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Result payload exceeds maximum allowed size (1 MB).",
          userFacingMessage: "Result set is too large to display. Try using LIMIT or adding more specific filters.",
        },
      };
    }

    return {
      success: true,
      columns,
      rows: truncatedRows,
      rowCount: truncatedRows.length,
      totalRows,
      executionTimeMs,
      hasMore,
      explainPlan,
    };
  } catch (error: any) {
    isHealthy = false;
    const executionTimeMs = Math.max(1, Date.now() - startTime);
    const translated = translatePostgresError(error, query, options.availableTables);

    return {
      success: false,
      columns: [],
      rows: [],
      rowCount: 0,
      totalRows: 0,
      executionTimeMs,
      hasMore: false,
      error: translated,
    };
  } finally {
    if (releaseWarmDb) {
      await releaseWarmDb(isHealthy);
    } else if (db) {
      try {
        await db.close();
      } catch {}
    }
  }
}
