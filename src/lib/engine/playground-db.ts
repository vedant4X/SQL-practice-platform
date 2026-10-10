import { PGlite } from "@electric-sql/pglite";

const playgroundInstances = new Map<string, PGlite>();

export async function getOrCreatePlaygroundDb(sessionId: string): Promise<PGlite> {
  if (playgroundInstances.has(sessionId)) {
    return playgroundInstances.get(sessionId)!;
  }
  const db = new PGlite();

  // Initialize with full standard schemas
  await db.exec(`
    -- 1. General Demo Notes
    CREATE TABLE IF NOT EXISTS demo_notes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO demo_notes (id, title, content) VALUES
    (1, 'Welcome Note', 'Explore SQL freely in your playground sandbox.'),
    (2, 'Pro Tip', 'You can CREATE TABLE, INSERT, UPDATE, and SELECT here!')
    ON CONFLICT (id) DO NOTHING;

    -- 2. E-Commerce Schema
    CREATE TABLE IF NOT EXISTS customers (
      customer_id SERIAL PRIMARY KEY,
      customer_name VARCHAR(100) NOT NULL,
      loyalty_tier VARCHAR(20) NOT NULL,
      signup_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO customers (customer_id, customer_name, loyalty_tier, signup_timestamp) VALUES
    (1, 'Aether Dynamics LLC', 'PLATINUM', '2025-01-15 10:00:00'),
    (2, 'Nexus Labs Corp', 'PLATINUM', '2025-02-20 11:30:00'),
    (3, 'Hyperion Systems', 'GOLD', '2025-03-05 14:15:00'),
    (4, 'Vortex Trading', 'GOLD', '2025-04-12 09:45:00'),
    (5, 'CyberPulse Analytics', 'SILVER', '2025-05-18 16:20:00')
    ON CONFLICT (customer_id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS orders (
      order_id SERIAL PRIMARY KEY,
      customer_id INT REFERENCES customers(customer_id),
      total_amount DECIMAL(10,2) NOT NULL,
      order_status VARCHAR(30) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO orders (order_id, customer_id, total_amount, order_status, created_at) VALUES
    (101, 1, 12500.00, 'delivered', '2025-06-01 12:00:00'),
    (102, 1, 5950.00, 'delivered', '2025-06-15 15:30:00'),
    (103, 2, 8400.50, 'delivered', '2025-06-10 11:00:00'),
    (104, 2, 4580.00, 'delivered', '2025-06-25 14:20:00'),
    (105, 3, 11200.00, 'delivered', '2025-07-02 09:15:00'),
    (106, 4, 8740.25, 'delivered', '2025-07-08 16:45:00'),
    (107, 5, 6890.00, 'delivered', '2025-07-14 13:10:00'),
    (108, 3, 450.00, 'pending', '2025-07-20 10:00:00')
    ON CONFLICT (order_id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS order_items (
      item_id SERIAL PRIMARY KEY,
      order_id INT REFERENCES orders(order_id),
      sku VARCHAR(50) NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL
    );
    INSERT INTO order_items (item_id, order_id, sku, quantity, unit_price) VALUES
    (1, 101, 'SKU-SRV-900', 5, 2500.00),
    (2, 102, 'SKU-DBX-400', 10, 595.00),
    (3, 103, 'SKU-CLD-100', 8, 1050.06),
    (4, 105, 'SKU-ENT-500', 4, 2800.00)
    ON CONFLICT (item_id) DO NOTHING;

    -- 3. Analytics Warehouse Schema
    CREATE TABLE IF NOT EXISTS telemetry_events (
      event_id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      event_name VARCHAR(100) NOT NULL,
      duration_ms DECIMAL(8,3) NOT NULL,
      occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO telemetry_events (event_id, user_id, event_name, duration_ms, occurred_at) VALUES
    (1, 101, 'checkout_commit', 12.430, '2026-10-10 16:05:00'),
    (2, 102, 'query_pipeline_eval', 4.880, '2026-10-10 16:15:00'),
    (3, 103, 'websocket_handshake', 1.150, '2026-10-10 16:20:00'),
    (4, 101, 'checkout_commit', 15.210, '2026-10-10 16:40:00'),
    (5, 104, 'query_pipeline_eval', 3.920, '2026-10-10 17:05:00')
    ON CONFLICT (event_id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS user_sessions (
      session_id VARCHAR(50) PRIMARY KEY,
      user_id INT NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      device_type VARCHAR(30) NOT NULL
    );
    INSERT INTO user_sessions (session_id, user_id, ip_address, device_type) VALUES
    ('sess_9021a', 101, '192.168.1.10', 'desktop_linux'),
    ('sess_9022b', 102, '192.168.1.15', 'desktop_macos'),
    ('sess_9023c', 103, '10.0.4.88', 'mobile_ios')
    ON CONFLICT (session_id) DO NOTHING;

    -- 4. Fintech Core Schema
    CREATE TABLE IF NOT EXISTS accounts (
      account_id SERIAL PRIMARY KEY,
      account_number VARCHAR(50) NOT NULL UNIQUE,
      currency VARCHAR(10) NOT NULL,
      stated_balance DECIMAL(15,2) NOT NULL
    );
    INSERT INTO accounts (account_id, account_number, currency, stated_balance) VALUES
    (1, 'ACC-8839-EUR', 'EUR', 420100.50),
    (2, 'ACC-1049-USD', 'USD', 1250800.00),
    (3, 'ACC-3391-GBP', 'GBP', 95200.00)
    ON CONFLICT (account_id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS ledger_transactions (
      tx_id SERIAL PRIMARY KEY,
      account_id INT REFERENCES accounts(account_id),
      direction VARCHAR(10) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO ledger_transactions (tx_id, account_id, direction, amount, created_at) VALUES
    (1, 1, 'CREDIT', 450000.00, '2026-10-01 08:00:00'),
    (2, 1, 'DEBIT', 29899.50, '2026-10-05 12:30:00'),
    (3, 2, 'CREDIT', 1300000.00, '2026-10-02 09:15:00'),
    (4, 2, 'DEBIT', 49200.00, '2026-10-06 14:00:00'),
    (5, 3, 'CREDIT', 95200.00, '2026-10-03 10:00:00')
    ON CONFLICT (tx_id) DO NOTHING;
  `);

  playgroundInstances.set(sessionId, db);
  return db;
}

export function resetPlaygroundDb(sessionId: string): void {
  playgroundInstances.delete(sessionId);
}
