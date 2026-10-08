import { PGlite } from "@electric-sql/pglite";

const playgroundInstances = new Map<string, PGlite>();

export async function getOrCreatePlaygroundDb(sessionId: string): Promise<PGlite> {
  if (playgroundInstances.has(sessionId)) {
    return playgroundInstances.get(sessionId)!;
  }
  const db = new PGlite();
  // Initialize with sample demo table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS demo_notes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO demo_notes (title, content) VALUES
    ('Welcome Note', 'Explore SQL freely in your playground sandbox.'),
    ('Pro Tip', 'You can CREATE TABLE, INSERT, UPDATE, and SELECT here!');
  `);
  playgroundInstances.set(sessionId, db);
  return db;
}

export function resetPlaygroundDb(sessionId: string): void {
  playgroundInstances.delete(sessionId);
}
