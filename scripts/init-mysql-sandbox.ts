import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

async function initMySqlSandbox() {
  const host = process.env.MYSQL_SANDBOX_HOST || "127.0.0.1";
  const port = parseInt(process.env.MYSQL_SANDBOX_PORT || "3307", 10);
  const user = process.env.MYSQL_SANDBOX_ADMIN_USER || "root";
  const password = process.env.MYSQL_SANDBOX_ADMIN_PASSWORD || "root";

  console.log(`[MySQL Init] Connecting to MySQL at ${host}:${port} as ${user}...`);

  const initSqlPath = path.resolve(process.cwd(), "docker", "init-mysql-sandbox.sql");
  if (!fs.existsSync(initSqlPath)) {
    throw new Error(`Initialization SQL file not found at: ${initSqlPath}`);
  }

  const sql = fs.readFileSync(initSqlPath, "utf-8");

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    console.log("[MySQL Init] Applying sandbox permissions from docker/init-mysql-sandbox.sql...");
    await connection.query(sql);
    console.log("[MySQL Init] Successfully initialized MySQL sandbox users and permissions.");
  } finally {
    await connection.end();
  }
}

initMySqlSandbox().catch((err) => {
  console.error("[MySQL Init Error]", err.message);
  process.exit(1);
});
