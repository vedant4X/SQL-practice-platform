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

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[Migration Error] DATABASE_URL environment variable is not defined.");
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
    console.log("Connected to PostgreSQL database for migration.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const res = await client.query<{ name: string }>(
      "SELECT name FROM _migrations ORDER BY id ASC;"
    );
    const appliedMigrations = new Set(res.rows.map((r) => r.name));

    const migrationsDir = path.resolve(__dirname, "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found at:", migrationsDir);
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No SQL migration files found.");
      return;
    }

    let appliedCount = 0;
    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`[Skip] Migration already applied: ${file}`);
        continue;
      }

      console.log(`[Applying] ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");

      await client.query("BEGIN;");
      try {
        await client.query(sqlContent);
        await client.query("INSERT INTO _migrations (name, applied_at) VALUES ($1, NOW());", [
          file,
        ]);
        await client.query("COMMIT;");
        console.log(`[Success] Applied migration: ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query("ROLLBACK;");
        console.error(`[Failure] Error applying migration ${file}:`, err);
        throw err;
      }
    }

    console.log(`Migration finished. Applied ${appliedCount} migration(s).`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
