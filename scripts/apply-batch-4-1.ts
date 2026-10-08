import fs from "fs";
import path from "path";
import { buildQuestions } from "./batch-builder-helper";
import { innerJoinDefs } from "./batch-4-1-inner-join";
import { leftRightOuterJoinDefs } from "./batch-4-1-left-right-outer-join";
import { crossSelfJoinDefs } from "./batch-4-1-cross-self-join";
import { multiTableJoinsDefs } from "./batch-4-1-multi-table-joins";
import { antiJoinsDefs } from "./batch-4-1-anti-joins";
import { QuestionMetadata } from "../src/lib/engine/types";

const PG_DIR = path.resolve(process.cwd(), "content", "questions", "postgresql");
const MY_DIR = path.resolve(process.cwd(), "content", "questions", "mysql");

const BATCH_TOPICS = [
  { topicId: "inner-join", defs: innerJoinDefs },
  { topicId: "left-right-outer-join", defs: leftRightOuterJoinDefs },
  { topicId: "cross-self-join", defs: crossSelfJoinDefs },
  { topicId: "multi-table-joins", defs: multiTableJoinsDefs },
  { topicId: "anti-joins", defs: antiJoinsDefs },
];

function applyBatch() {
  console.log("Applying Batch 4.1 (Level 4 topics 19-23: Joins)...");

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

  console.log("Batch 4.1 successfully written!");
}

applyBatch();
