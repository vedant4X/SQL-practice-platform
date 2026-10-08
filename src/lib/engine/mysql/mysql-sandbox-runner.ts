import { getAdminPool, getRoPool, getRwPool, killQuery } from "./mysql-connection";
import { validateMySqlQuery } from "./mysql-statement-validator";
import { translateMySqlError } from "./mysql-error-translator";
import { getMySqlTestCaseSql } from "./mysql-dataset-loader";
import { QueryExecutionResult, QuestionType } from "../types";

const STATEMENT_TIMEOUT_MS = parseInt(process.env.STATEMENT_TIMEOUT_MS || "5000", 10);
const MAX_ROW_LIMIT = parseInt(process.env.MAX_ROW_LIMIT || "1000", 10);
const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1MB

const initializedSharedDbs = new Set<string>();

/**
 * Ensures shared read-only database is provisioned and loaded with dataset
 */
export async function ensureSharedMySqlDb(
  databaseId: string,
  variant: "sample" | "hidden_1" | "hidden_2" = "sample"
): Promise<string> {
  const dbName = `db_${databaseId}_${variant}`.toLowerCase();
  if (initializedSharedDbs.has(dbName)) {
    return dbName;
  }

  const admin = getAdminPool();
  const adminConn = await admin.getConnection();
  try {
    const lockKey = `lock_init_${dbName}`;
    await adminConn.query(`SELECT GET_LOCK(?, 15);`, [lockKey]);

    try {
      await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

      const [tableRows] = await adminConn.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = ?;`,
        [dbName]
      );
      const tableCount = Number((tableRows as any)[0]?.cnt || 0);

      // Only execute DDL/DML if tables have not already been provisioned
      if (tableCount === 0) {
        await adminConn.query(`USE \`${dbName}\`;`);
        const initSql = getMySqlTestCaseSql(databaseId, variant);
        await adminConn.query(initSql);
      }
    } finally {
      await adminConn.query(`SELECT RELEASE_LOCK(?);`, [lockKey]);
    }
  } finally {
    adminConn.release();
  }

  initializedSharedDbs.add(dbName);
  return dbName;
}

export interface MySqlSandboxOptions {
  timeoutMs?: number;
  maxRows?: number;
  includeExplain?: boolean;
  questionType?: QuestionType;
  availableTables?: string[];
}

/**
 * Executes a user MySQL query inside the secure sandbox
 */
export async function executeInMySqlSandbox(
  databaseId: string,
  query: string,
  variant: "sample" | "hidden_1" | "hidden_2" = "sample",
  options: MySqlSandboxOptions = {}
): Promise<QueryExecutionResult> {
  const timeoutMs = options.timeoutMs || STATEMENT_TIMEOUT_MS;
  const maxRows = options.maxRows || MAX_ROW_LIMIT;
  const questionType = options.questionType || "select";

  // 1. Static AST / Lexical validation layer
  const validation = validateMySqlQuery(query, questionType);
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

  const startTime = Date.now();
  let connection: any = null;
  let ephemeralDbName: string | null = null;
  let watchdogTimer: NodeJS.Timeout | null = null;

  try {
    let targetDbName = "";

    if (questionType === "select") {
      // 2a. Use shared read-only database
      targetDbName = await ensureSharedMySqlDb(databaseId, variant);
      const pool = getRoPool();
      connection = await pool.getConnection();
    } else {
      // 2b. DDL/DML: Fresh ephemeral database per run (sbx_<random>)
      const admin = getAdminPool();
      const adminConn = await admin.getConnection();
      ephemeralDbName = `sbx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`.toLowerCase();
      try {
        await adminConn.query(`CREATE DATABASE \`${ephemeralDbName}\`;`);
        await adminConn.query(`USE \`${ephemeralDbName}\`;`);
        const initSql = getMySqlTestCaseSql(databaseId, variant);
        await adminConn.query(initSql);
      } finally {
        adminConn.release();
      }

      targetDbName = ephemeralDbName;
      const pool = getRwPool();
      connection = await pool.getConnection();
    }

    await connection.query(`USE \`${targetDbName}\`;`);

    // Obtain thread ID for application-level KILL QUERY watchdog
    const [connIdRows] = await connection.query("SELECT CONNECTION_ID() AS id;");
    const threadId = (connIdRows as any)[0].id;

    // Optional EXPLAIN plan
    let explainPlan: unknown = undefined;
    if (options.includeExplain && questionType === "select") {
      try {
        const [explainRes] = await connection.query(`EXPLAIN FORMAT=JSON ${query}`);
        if (Array.isArray(explainRes) && explainRes.length > 0) {
          explainPlan = JSON.parse((explainRes[0] as any)["EXPLAIN"]);
        }
      } catch {}
    }

    // Set up watchdog timer to issue KILL QUERY after timeoutMs
    watchdogTimer = setTimeout(async () => {
      await killQuery(threadId);
    }, timeoutMs);

    // Execute query
    const [rawRows, fields] = await connection.query(query);

    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }

    const executionTimeMs = Math.max(1, Date.now() - startTime);

    if (executionTimeMs >= timeoutMs) {
      const timeoutErr = new Error("Query execution timed out after 5.0 seconds.");
      (timeoutErr as any).code = 3024;
      throw timeoutErr;
    }

    const rowsArray = Array.isArray(rawRows) ? (rawRows as Record<string, unknown>[]) : [];
    const totalRows = rowsArray.length;
    const hasMore = totalRows > maxRows;
    const truncatedRows = hasMore ? rowsArray.slice(0, maxRows) : rowsArray;

    let columns: string[] = [];
    if (fields && fields.length > 0) {
      columns = fields.map((f: any) => f.name);
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
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }

    const executionTimeMs = Math.max(1, Date.now() - startTime);
    const translated = translateMySqlError(error, query, options.availableTables);

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
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
    }
    if (connection) {
      connection.release();
    }
    // Clean up ephemeral database if created
    if (ephemeralDbName) {
      const admin = getAdminPool();
      try {
        await admin.query(`DROP DATABASE IF EXISTS \`${ephemeralDbName}\`;`);
      } catch (dropErr) {
        console.error(`Failed to drop ephemeral database ${ephemeralDbName}:`, dropErr);
      }
    }
  }
}
