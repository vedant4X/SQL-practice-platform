import fs from "fs";
import path from "path";
import { buildQuestions } from "./batch-builder-helper";
import { scalarSubqueriesDefs } from "./batch-5-1-scalar-subqueries";
import { inExistsDefs } from "./batch-5-1-in-exists";
import { correlatedSubqueriesDefs } from "./batch-5-1-correlated-subqueries";
import { subqueriesInFromDefs } from "./batch-5-1-subqueries-in-from";
import { QuestionMetadata } from "../src/lib/engine/types";

const PG_DIR = path.resolve(process.cwd(), "content", "questions", "postgresql");
const MY_DIR = path.resolve(process.cwd(), "content", "questions", "mysql");

const BATCH_TOPICS = [
  { topicId: "scalar-subqueries", defs: scalarSubqueriesDefs },
  { topicId: "in-exists", defs: inExistsDefs },
  { topicId: "correlated-subqueries", defs: correlatedSubqueriesDefs },
  { topicId: "subqueries-in-from", defs: subqueriesInFromDefs },
];

function applyBatch() {
  console.log("Applying Batch 5.1 (Level 5 topics 24-27: Subqueries)...");

  for (const { topicId, defs } of BATCH_TOPICS) {
    const pgPath = path.join(PG_DIR, `${topicId}.json`);
    const myPath = path.join(MY_DIR, `${topicId}.json`);

    const existingPg: QuestionMetadata[] = JSON.parse(fs.readFileSync(pgPath, "utf-8"));
    const existingMy: QuestionMetadata[] = JSON.parse(fs.readFileSync(myPath, "utf-8"));

    // Keep the first 3 canonical seed questions
    const basePg = existingPg.slice(0, 3);
    const baseMy = existingMy.slice(0, 3);

    const { pg: newPg, my: newMy } = buildQuestions(topicId, defs);

    const mergedPg = [...basePg, ...newPg];
    const mergedMy = [...baseMy, ...newMy];

    fs.writeFileSync(pgPath, JSON.stringify(mergedPg, null, 2), "utf-8");
    fs.writeFileSync(myPath, JSON.stringify(mergedMy, null, 2), "utf-8");

    console.log(`[${topicId}] Saved ${mergedPg.length} PostgreSQL questions and ${mergedMy.length} MySQL questions.`);
  }

  console.log("Batch 5.1 successfully written!");
}

applyBatch();
