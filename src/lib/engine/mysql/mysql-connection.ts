import mysql, { Pool, PoolOptions } from "mysql2/promise";

const MYSQL_HOST = process.env.MYSQL_SANDBOX_HOST || "127.0.0.1";
const MYSQL_PORT = parseInt(process.env.MYSQL_SANDBOX_PORT || "3307", 10);
const ADMIN_USER = process.env.MYSQL_SANDBOX_ADMIN_USER || "root";
const ADMIN_PASSWORD = process.env.MYSQL_SANDBOX_ADMIN_PASSWORD || "";
const RO_USER = process.env.MYSQL_SANDBOX_RO_USER || "sandbox_ro";
const RO_PASSWORD = process.env.MYSQL_SANDBOX_RO_PASSWORD || "sandbox_ro_pass";
const RW_USER = process.env.MYSQL_SANDBOX_RW_USER || "sandbox_rw";
const RW_PASSWORD = process.env.MYSQL_SANDBOX_RW_PASSWORD || "sandbox_rw_pass";

// SSL: enable when MYSQL_SANDBOX_SSL=true or auto-detect hosted providers
const MYSQL_SSL = process.env.MYSQL_SANDBOX_SSL === "true" ||
  process.env.MYSQL_SANDBOX_SSL === "1";

let adminPool: Pool | null = null;
let roPool: Pool | null = null;
let rwPool: Pool | null = null;

const baseOptions: Partial<PoolOptions> = {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: false,
  ...(MYSQL_SSL ? { ssl: { rejectUnauthorized: false } } : {}),
};

/**
 * Returns true if a MySQL sandbox is configured (host is set to something other than localhost defaults
 * when running in production, OR any host when running locally).
 */
export function isMySqlConfigured(): boolean {
  // In production, MySQL must be explicitly configured via MYSQL_SANDBOX_HOST
  if (process.env.NODE_ENV === "production") {
    return !!process.env.MYSQL_SANDBOX_HOST;
  }
  // In development, try to connect to whatever is configured
  return true;
}

export function getAdminPool(): Pool {
  if (!adminPool) {
    adminPool = mysql.createPool({
      ...baseOptions,
      user: ADMIN_USER,
      password: ADMIN_PASSWORD,
      multipleStatements: true,
    });
  }
  return adminPool;
}

export function getRoPool(): Pool {
  if (!roPool) {
    roPool = mysql.createPool({
      ...baseOptions,
      user: RO_USER,
      password: RO_PASSWORD,
      multipleStatements: false,
    });
  }
  return roPool;
}

export function getRwPool(): Pool {
  if (!rwPool) {
    rwPool = mysql.createPool({
      ...baseOptions,
      user: RW_USER,
      password: RW_PASSWORD,
      multipleStatements: true,
    });
  }
  return rwPool;
}

/**
 * Watchdog helper: issues KILL QUERY <threadId> using a separate administrative connection
 */
export async function killQuery(threadId: number): Promise<void> {
  const admin = getAdminPool();
  try {
    await admin.query(`KILL QUERY ${threadId}`);
  } catch (err: any) {
    // If the query already finished or thread was closed, ignore 1094 (Unknown thread id)
    if (err.errno !== 1094) {
      console.error(`Failed to kill query on thread ${threadId}:`, err);
    }
  }
}
