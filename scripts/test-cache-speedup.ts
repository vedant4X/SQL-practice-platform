import { PGlite } from "@electric-sql/pglite";
import { getTestCaseSql } from "../src/lib/engine/dataset-loader";
import { ALL_QUESTIONS } from "../src/lib/curriculum/questions";

// Simple in-memory pool of warm instances
const instancePool = new Map<string, PGlite>();

async function getWarmInstance(databaseId: string, variant: string): Promise<PGlite> {
  const key = `${databaseId}:${variant}`;
  if (!instancePool.has(key)) {
    const db = new PGlite();
    const sql = getTestCaseSql(databaseId, variant as any);
    await db.exec(sql);
    instancePool.set(key, db);
  }
  return instancePool.get(key)!;
}

async function testOptimized() {
  console.log("=== TESTING WARM INSTANCE + CACHED SOLUTION ===");
  const sampleQ = ALL_QUESTIONS[0];

  // Preload instances for this question's database
  await getWarmInstance(sampleQ.database_id, "sample");
  await getWarmInstance(sampleQ.database_id, "hidden_1");
  await getWarmInstance(sampleQ.database_id, "hidden_2");

  // Precompute / cache solution output
  const cachedSolutions = new Map<string, any>();
  for (const variant of ["sample", "hidden_1", "hidden_2"] as const) {
    const db = await getWarmInstance(sampleQ.database_id, variant);
    await db.exec("BEGIN;");
    const res = await db.query(sampleQ.solution_query);
    await db.exec("ROLLBACK;");
    cachedSolutions.set(variant, res);
  }

  // Now simulate a user submission against the 3 datasets using warm instances + cached solution
  const t0 = performance.now();
  for (const variant of ["sample", "hidden_1", "hidden_2"] as const) {
    const db = await getWarmInstance(sampleQ.database_id, variant);
    await db.exec("BEGIN;");
    const userRes = await db.query(sampleQ.solution_query);
    await db.exec("ROLLBACK;");
    const expected = cachedSolutions.get(variant);
    // Compare
    if (userRes.rows.length !== expected.rows.length) {
      throw new Error("Mismatch!");
    }
  }
  const t1 = performance.now();
  console.log(`Optimized 3-test submission evaluation time: ${(t1 - t0).toFixed(2)} ms`);
}

testOptimized().catch(console.error);
