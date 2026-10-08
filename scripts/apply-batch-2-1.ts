import fs from "fs";
import path from "path";
import { buildQuestions } from "./batch-builder-helper";
import { aggregatesDefs } from "./batch-2-1-aggregates";
import { stringFunctionsDefs } from "./batch-2-1-string-functions";
import { numericFunctionsDefs } from "./batch-2-1-numeric-functions";
import { dateTimeDefs } from "./batch-2-1-date-time";
import { conditionalsDefs } from "./batch-2-1-conditionals";
import { QuestionMetadata } from "../src/lib/engine/types";

const PG_DIR = path.resolve(process.cwd(), "content", "questions", "postgresql");
const MY_DIR = path.resolve(process.cwd(), "content", "questions", "mysql");

const BATCH_TOPICS = [
  { topicId: "aggregates", defs: aggregatesDefs },
  { topicId: "string-functions", defs: stringFunctionsDefs },
  { topicId: "numeric-functions", defs: numericFunctionsDefs },
  { topicId: "date-time", defs: dateTimeDefs },
  { topicId: "conditionals", defs: conditionalsDefs },
];

function applyBatch() {
  console.log("Applying Batch 2.1 (Level 2 topics 10-14: Functions)...");

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

  console.log("Batch 2.1 successfully written!");
}

applyBatch();
