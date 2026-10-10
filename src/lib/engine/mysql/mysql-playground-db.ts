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
    
    // Create tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS demo_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        customer_id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        loyalty_tier VARCHAR(20) NOT NULL,
        signup_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        total_amount DECIMAL(10,2) NOT NULL,
        order_status VARCHAR(30) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cust (customer_id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        sku VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        INDEX idx_ord (order_id)
      );

      CREATE TABLE IF NOT EXISTS telemetry_events (
        event_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_name VARCHAR(100) NOT NULL,
        duration_ms DECIMAL(8,3) NOT NULL,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id VARCHAR(50) PRIMARY KEY,
        user_id INT NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        device_type VARCHAR(30) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS accounts (
        account_id INT AUTO_INCREMENT PRIMARY KEY,
        account_number VARCHAR(50) NOT NULL UNIQUE,
        currency VARCHAR(10) NOT NULL,
        stated_balance DECIMAL(15,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ledger_transactions (
        tx_id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT,
        direction VARCHAR(10) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_acc (account_id)
      );
    `);

    const [rows] = await conn.query("SELECT COUNT(*) AS total FROM demo_notes;");
    if ((rows as any)[0].total === 0) {
      await conn.query(`
        INSERT IGNORE INTO demo_notes (id, title, content) VALUES
        (1, 'Welcome to MySQL 8.4 Playground', 'Explore SQL freely in your dedicated per-user sandbox.'),
        (2, 'DDL & DML Support', 'You can CREATE TABLE, ALTER TABLE, INSERT, and UPDATE here!');

        INSERT IGNORE INTO customers (customer_id, customer_name, loyalty_tier, signup_timestamp) VALUES
        (1, 'Aether Dynamics LLC', 'PLATINUM', '2025-01-15 10:00:00'),
        (2, 'Nexus Labs Corp', 'PLATINUM', '2025-02-20 11:30:00'),
        (3, 'Hyperion Systems', 'GOLD', '2025-03-05 14:15:00'),
        (4, 'Vortex Trading', 'GOLD', '2025-04-12 09:45:00'),
        (5, 'CyberPulse Analytics', 'SILVER', '2025-05-18 16:20:00');

        INSERT IGNORE INTO orders (order_id, customer_id, total_amount, order_status, created_at) VALUES
        (101, 1, 12500.00, 'delivered', '2025-06-01 12:00:00'),
        (102, 1, 5950.00, 'delivered', '2025-06-15 15:30:00'),
        (103, 2, 8400.50, 'delivered', '2025-06-10 11:00:00'),
        (104, 2, 4580.00, 'delivered', '2025-06-25 14:20:00'),
        (105, 3, 11200.00, 'delivered', '2025-07-02 09:15:00'),
        (106, 4, 8740.25, 'delivered', '2025-07-08 16:45:00'),
        (107, 5, 6890.00, 'delivered', '2025-07-14 13:10:00'),
        (108, 3, 450.00, 'pending', '2025-07-20 10:00:00');

        INSERT IGNORE INTO order_items (item_id, order_id, sku, quantity, unit_price) VALUES
        (1, 101, 'SKU-SRV-900', 5, 2500.00),
        (2, 102, 'SKU-DBX-400', 10, 595.00),
        (3, 103, 'SKU-CLD-100', 8, 1050.06),
        (4, 105, 'SKU-ENT-500', 4, 2800.00);

        INSERT IGNORE INTO telemetry_events (event_id, user_id, event_name, duration_ms, occurred_at) VALUES
        (1, 101, 'checkout_commit', 12.430, '2026-10-10 16:05:00'),
        (2, 102, 'query_pipeline_eval', 4.880, '2026-10-10 16:15:00'),
        (3, 103, 'websocket_handshake', 1.150, '2026-10-10 16:20:00'),
        (4, 101, 'checkout_commit', 15.210, '2026-10-10 16:40:00'),
        (5, 104, 'query_pipeline_eval', 3.920, '2026-10-10 17:05:00');

        INSERT IGNORE INTO user_sessions (session_id, user_id, ip_address, device_type) VALUES
        ('sess_9021a', 101, '192.168.1.10', 'desktop_linux'),
        ('sess_9022b', 102, '192.168.1.15', 'desktop_macos'),
        ('sess_9023c', 103, '10.0.4.88', 'mobile_ios');

        INSERT IGNORE INTO accounts (account_id, account_number, currency, stated_balance) VALUES
        (1, 'ACC-8839-EUR', 'EUR', 420100.50),
        (2, 'ACC-1049-USD', 'USD', 1250800.00),
        (3, 'ACC-3391-GBP', 'GBP', 95200.00);

        INSERT IGNORE INTO ledger_transactions (tx_id, account_id, direction, amount, created_at) VALUES
        (1, 1, 'CREDIT', 450000.00, '2026-10-01 08:00:00'),
        (2, 1, 'DEBIT', 29899.50, '2026-10-05 12:30:00'),
        (3, 2, 'CREDIT', 1300000.00, '2026-10-02 09:15:00'),
        (4, 2, 'DEBIT', 49200.00, '2026-10-06 14:00:00'),
        (5, 3, 'CREDIT', 95200.00, '2026-10-03 10:00:00');
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
