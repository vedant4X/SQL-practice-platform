import fs from "fs";
import path from "path";
import { QuestionMetadataSchema } from "../src/lib/curriculum/schema";
import { executeInMySqlSandbox } from "../src/lib/engine/mysql/mysql-sandbox-runner";

const MYSQL_DIR = path.resolve(process.cwd(), "content", "questions", "mysql");

async function main() {
  const files = fs.readdirSync(MYSQL_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Starting MySQL question verification for ${files.length} files against live MySQL 8.4 engine...\n`);

  let totalQuestions = 0;
  let passedQuestions = 0;
  const failures: Array<{ id: string; file: string; variant: string; query: string; error: string }> = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(MYSQL_DIR, file), "utf-8");
    const questions = JSON.parse(raw);

    for (const q of questions) {
      totalQuestions++;

      // 1. Zod schema validation
      const parseRes = QuestionMetadataSchema.safeParse(q);
      if (!parseRes.success) {
        failures.push({
          id: q.id || "unknown",
          file,
          variant: "schema",
          query: q.solution_query || "",
          error: JSON.stringify(parseRes.error.format()),
        });
        continue;
      }

      // 2. Real MySQL execution verification on 'sample' variant
      let questionFailed = false;
      for (const variant of ["sample"] as const) {
        try {
          const res = await executeInMySqlSandbox(q.database_id, q.solution_query, variant);
          if (!res.success) {
            questionFailed = true;
            failures.push({
              id: q.id,
              file,
              variant,
              query: q.solution_query,
              error: res.error?.userFacingMessage || res.error?.message || "Unknown error",
            });
            break;
          }
        } catch (err: any) {
          questionFailed = true;
          failures.push({
            id: q.id,
            file,
            variant,
            query: q.solution_query,
            error: err.message || String(err),
          });
          break;
        }
      }

      if (!questionFailed) {
        passedQuestions++;
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`MySQL Verification Results:`);
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Passed: ${passedQuestions}`);
  console.log(`Failed: ${failures.length}`);
  console.log(`Success Rate: ${((passedQuestions / totalQuestions) * 100).toFixed(1)}%`);
  console.log(`======================================================\n`);

  if (failures.length > 0) {
    console.error(`Failures detail (first 20):`);
    for (const f of failures.slice(0, 20)) {
      console.error(`- [${f.id}] in ${f.file} (${f.variant}):`);
      console.error(`  Query: ${f.query}`);
      console.error(`  Error: ${f.error}\n`);
    }
    process.exit(1);
  } else {
    console.log("All MySQL questions passed verification on real MySQL 8.4 engine!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error during verification:", err);
  process.exit(1);
});
