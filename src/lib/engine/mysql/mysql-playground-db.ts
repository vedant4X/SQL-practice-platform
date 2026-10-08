import { getAdminPool, getRwPool } from "./mysql-connection";
import { translateMySqlError } from "./mysql-error-translator";
import { QueryExecutionResult } from "../types";

/**
 * Sanitizes user identifier to form a legal MySQL database identifier
 */
function getPlaygroundDbName(userId: string): string {
  const cleanId = userId.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
  return `play_${cleanId}`.toLowerCase();
}

/**
 * Ensures user's playground database exists and has demo tables
 */
export async function ensurePlaygroundDb(userId: string): Promise<string> {
  const dbName = getPlaygroundDbName(userId);
  const admin = getAdminPool();

  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

  // Initialize demo schema if needed
  const rwPool = getRwPool();
  const conn = await rwPool.getConnection();
  try {
    await conn.query(`USE \`${dbName}\`;`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS demo_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    const [rows] = await conn.query("SELECT COUNT(*) AS total FROM demo_notes;");
    if ((rows as any)[0].total === 0) {
      await conn.query(`
        INSERT INTO demo_notes (title, content) VALUES
        ('Welcome to MySQL 8.4 Playground', 'Explore SQL freely in your dedicated per-user sandbox.'),
        ('DDL & DML Support', 'You can CREATE TABLE, ALTER TABLE, INSERT, and UPDATE here!');
      `);
    }
  } finally {
    conn.release();
  }

  return dbName;
}

/**
 * Executes queries in the user's persistent MySQL playground database
 */
export async function executeInPlayground(
  userId: string,
  sql: string
): Promise<QueryExecutionResult> {
  const dbName = await ensurePlaygroundDb(userId);
  const pool = getRwPool();
  const conn = await pool.getConnection();
  const startTime = Date.now();

  try {
    await conn.query(`USE \`${dbName}\`;`);
    const [rawRows, fields] = await conn.query(sql);
    const executionTimeMs = Math.max(1, Date.now() - startTime);

    const rowsArray = Array.isArray(rawRows) ? (rawRows as Record<string, unknown>[]) : [];
    let columns: string[] = [];
    if (fields && fields.length > 0) {
      columns = (fields as any[]).map((f: any) => f.name);
    } else if (rowsArray.length > 0) {
      columns = Object.keys(rowsArray[0]);
    }

    return {
      success: true,
      columns,
      rows: rowsArray.slice(0, 500),
      rowCount: rowsArray.length,
      totalRows: rowsArray.length,
      executionTimeMs,
      hasMore: rowsArray.length > 500,
    };
  } catch (err: any) {
    const executionTimeMs = Math.max(1, Date.now() - startTime);
    return {
      success: false,
      columns: [],
      rows: [],
      rowCount: 0,
      totalRows: 0,
      executionTimeMs,
      hasMore: false,
      error: translateMySqlError(err, sql),
    };
  } finally {
    conn.release();
  }
}

/**
 * Resets user's playground database
 */
export async function resetPlaygroundDb(userId: string): Promise<void> {
  const dbName = getPlaygroundDbName(userId);
  const admin = getAdminPool();
  await admin.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
  await ensurePlaygroundDb(userId);
}
