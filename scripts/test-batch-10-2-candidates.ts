import { SOCIAL_MEDIA_QUESTIONS } from "./batch-10-2-social-media";
import { AIRLINE_QUESTIONS } from "./batch-10-2-airline";
import { HOTEL_QUESTIONS } from "./batch-10-2-hotel";
import { LIBRARY_QUESTIONS } from "./batch-10-2-library";
import { executeInSandbox } from "../src/lib/engine/sandbox-runner";
import { executeInMySqlSandbox } from "../src/lib/engine/mysql/mysql-sandbox-runner";

async function run() {
  const allBatches = [
    { name: "scenario-social-media", list: SOCIAL_MEDIA_QUESTIONS },
    { name: "scenario-airline", list: AIRLINE_QUESTIONS },
    { name: "scenario-hotel", list: HOTEL_QUESTIONS },
    { name: "scenario-library", list: LIBRARY_QUESTIONS },
  ];

  let totalTested = 0;
  let failures = 0;

  for (const batch of allBatches) {
    console.log(`\n=== Testing Batch: ${batch.name} (${batch.list.length} questions) ===`);
    for (const q of batch.list) {
      totalTested++;
      // 1. Test PostgreSQL
      try {
        const pgRes = await executeInSandbox(q.databaseId, q.solutionQueryPg);
        if (!pgRes.success) {
          console.error(`❌ [PG FAIL] ${batch.name} Q${q.num} (${q.slug}): ${pgRes.error?.message}`);
          failures++;
          continue;
        }
        // 2. Test MySQL
        const myRes = await executeInMySqlSandbox(q.databaseId, q.solutionQueryMy);
        if (!myRes.success) {
          console.error(`❌ [MYSQL FAIL] ${batch.name} Q${q.num} (${q.slug}): ${myRes.error?.message}`);
          failures++;
          continue;
        }

        // Compare columns length
        if (pgRes.columns.length !== myRes.columns.length) {
          console.warn(`⚠️ [COL MISMATCH] ${batch.name} Q${q.num}: PG ${pgRes.columns.length} cols vs MySQL ${myRes.columns.length} cols`);
        }

        console.log(`✓ Q${q.num.toString().padStart(2, "0")} (${q.slug}): PG rows=${pgRes.rows.length}, MY rows=${myRes.rows.length}, cols=${pgRes.columns.length}`);
      } catch (err: any) {
        console.error(`💥 [EXCEPTION] ${batch.name} Q${q.num}: ${err.message}`);
        failures++;
      }
    }
  }

  console.log(`\n===========================================`);
  console.log(`Batch 10.2 Finished: ${totalTested} tested, ${failures} failures.`);
  console.log(`===========================================`);

  if (failures > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
