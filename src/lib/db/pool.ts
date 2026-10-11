import { Pool, QueryResult, QueryResultRow } from "pg";
import { config } from "./config";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = config.databaseUrl;
  const isProduction = config.isProduction;
  const requiresSsl = connectionString.includes("sslmode=require") || isProduction;

  const pool = new Pool({
    connectionString,
    max: 5,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  });

  pool.on("error", (err) => {
    console.error("[PostgreSQL Pool Error]", err);
  });

  return pool;
}

export function getPool(): Pool {
  if (!globalThis.__pgPool) {
    globalThis.__pgPool = createPool();
  }
  return globalThis.__pgPool;
}

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  const pool = getPool();
  return pool.query<R>(text, params);
}

export async function closePool(): Promise<void> {
  if (globalThis.__pgPool) {
    await globalThis.__pgPool.end();
    globalThis.__pgPool = undefined;
  }
}
