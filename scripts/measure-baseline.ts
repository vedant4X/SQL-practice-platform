import { PGlite } from "@electric-sql/pglite";
import { getTestCaseSql } from "../src/lib/engine/dataset-loader";
import { evaluateSubmission } from "../src/lib/engine/evaluator";
import { ALL_QUESTIONS } from "../src/lib/curriculum/questions";

async function measure() {
  console.log("=== PERFORMANCE BASELINE MEASUREMENTS ===");

  // 1. Measure cold PGlite creation
  const t0 = performance.now();
  const db1 = new PGlite();
  const t1 = performance.now();
  console.log(`Cold PGlite instantiation: ${(t1 - t0).toFixed(2)} ms`);

  // 2. Measure dataset loading into fresh PGlite
  const sql = getTestCaseSql("employeedb", "sample");
  const t2 = performance.now();
  await db1.exec(sql);
  const t3 = performance.now();
  console.log(`employeedb schema+data loading into fresh PGlite: ${(t3 - t2).toFixed(2)} ms`);

  // 3. Second PGlite instance + dataset load
  const t4 = performance.now();
  const db2 = new PGlite();
  await db2.exec(sql);
  const t5 = performance.now();
  console.log(`Second PGlite instantiation + employeedb load: ${(t5 - t4).toFixed(2)} ms`);

  // 4. Measure simple query execution on warm db
  const t6 = performance.now();
  await db1.query("SELECT * FROM employees WHERE salary > 50000;");
  const t7 = performance.now();
  console.log(`Simple SELECT on loaded db: ${(t7 - t6).toFixed(2)} ms`);

  // 5. Measure evaluateSubmission
  const sampleQ = ALL_QUESTIONS[0];
  console.log(`Testing evaluateSubmission for question: ${sampleQ.slug}`);
  const t8 = performance.now();
  const evalResult = await evaluateSubmission(sampleQ, sampleQ.solution_query);
  const t9 = performance.now();
  console.log(`evaluateSubmission total time (cold/unoptimized): ${(t9 - t8).toFixed(2)} ms (Verdict: ${evalResult.verdict})`);

  // 6. Second evaluateSubmission
  const t10 = performance.now();
  const evalResult2 = await evaluateSubmission(sampleQ, sampleQ.solution_query);
  const t11 = performance.now();
  console.log(`evaluateSubmission second run: ${(t11 - t10).toFixed(2)} ms`);
}

measure().catch(console.error);
