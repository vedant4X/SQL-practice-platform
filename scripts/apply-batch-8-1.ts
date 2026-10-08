import fs from "fs";
import path from "path";
import { buildQuestions } from "./batch-builder-helper";
import { windowRankingDefs } from "./batch-8-1-window-ranking";
import { windowOffsetDefs } from "./batch-8-1-window-offset";
import { windowAggregatesDefs } from "./batch-8-1-window-aggregates";
import { QuestionMetadata } from "../src/lib/engine/types";

const PG_DIR = path.resolve(process.cwd(), "content", "questions", "postgresql");
const MY_DIR = path.resolve(process.cwd(), "content", "questions", "mysql");

const BATCH_TOPICS = [
  { topicId: "window-ranking", defs: windowRankingDefs },
  { topicId: "window-offset", defs: windowOffsetDefs },
  { topicId: "window-aggregates", defs: windowAggregatesDefs },
];

function applyBatch() {
  console.log("Applying Batch 8.1 (Level 8 topics 34-36: Window Functions)...");

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

  console.log("Batch 8.1 successfully written!");
}

applyBatch();
