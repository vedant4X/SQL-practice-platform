import fs from "fs";
import path from "path";
import { SOCIAL_MEDIA_QUESTIONS } from "./batch-10-2-social-media";
import { AIRLINE_QUESTIONS } from "./batch-10-2-airline";
import { HOTEL_QUESTIONS } from "./batch-10-2-hotel";
import { LIBRARY_QUESTIONS } from "./batch-10-2-library";
import { QuestionMetadata } from "../src/lib/engine/types";
import { QuestionDef } from "./batch-10-1-banking";

const PG_DIR = path.resolve(process.cwd(), "content", "questions", "postgresql");
const MY_DIR = path.resolve(process.cwd(), "content", "questions", "mysql");

const BATCH = [
  { topicId: "scenario-social-media", prefix: "sc-soc", list: SOCIAL_MEDIA_QUESTIONS },
  { topicId: "scenario-airline", prefix: "sc-air", list: AIRLINE_QUESTIONS },
  { topicId: "scenario-hotel", prefix: "sc-hotel", list: HOTEL_QUESTIONS },
  { topicId: "scenario-library", prefix: "sc-lib", list: LIBRARY_QUESTIONS },
];

function transform(d: QuestionDef, prefix: string, dialect: "postgresql" | "mysql"): QuestionMetadata {
  const numStr = String(d.num).padStart(2, "0");
  const isPg = dialect === "postgresql";
  const id = isPg ? `q-${prefix}-${numStr}` : `q-my-${prefix}-${numStr}`;
  const tcPrefix = isPg ? `tc-${prefix}-${numStr}` : `tc-my-${prefix}-${numStr}`;

  const expectedCols = d.expectedColumns.map((col) => {
    let type = col.type;
    if (!isPg && type === "numeric") {
      type = "decimal";
    }
    return { name: col.name, type };
  });

  return {
    id,
    slug: d.slug,
    title: d.title,
    description_markdown: d.descriptionMarkdown,
    topic_id: d.topicId,
    subtopic_id: d.subtopicId,
    difficulty: d.difficulty,
    dialect,
    database_id: d.databaseId,
    question_type: "select",
    tables_involved: d.tablesInvolved,
    expected_columns: expectedCols,
    order_matters: true,
    comparison_config: { compare_column_names: true },
    starter_query: "-- Write your solution query here\nSELECT ...",
    solution_query: isPg ? d.solutionQueryPg : d.solutionQueryMy,
    solution_explanation: d.solutionExplanation,
    alternative_solutions: [],
    common_mistakes: [],
    dialect_notes: "",
    hints: [d.hint1, d.hint2, d.hint3],
    tags: [d.databaseId, d.subtopicId],
    source: "original",
    estimated_minutes: d.difficulty === "easy" ? 4 : d.difficulty === "medium" ? 6 : 8,
    xp: d.difficulty === "easy" ? 10 : d.difficulty === "medium" ? 20 : 30,
    status: "published",
    version: 1,
    test_cases: [
      { id: `${tcPrefix}-1`, name: "Visible Sample", is_hidden: false, dataset_name: "sample" },
      { id: `${tcPrefix}-2`, name: "Hidden Test 1", is_hidden: true, dataset_name: "hidden_1" },
      { id: `${tcPrefix}-3`, name: "Hidden Test 2", is_hidden: true, dataset_name: "hidden_2" },
    ],
  };
}

function apply() {
  console.log("Applying Batch 10.2 (Topics 44-47: Social Media, Airline, Hotel, Library)...");

  for (const { topicId, prefix, list } of BATCH) {
    const pgPath = path.join(PG_DIR, `${topicId}.json`);
    const myPath = path.join(MY_DIR, `${topicId}.json`);

    const existingPg: QuestionMetadata[] = JSON.parse(fs.readFileSync(pgPath, "utf-8"));
    const existingMy: QuestionMetadata[] = JSON.parse(fs.readFileSync(myPath, "utf-8"));

    const basePg = existingPg.slice(0, 3);
    const baseMy = existingMy.slice(0, 3);

    const newPg = list.map((q) => transform(q, prefix, "postgresql"));
    const newMy = list.map((q) => transform(q, prefix, "mysql"));

    const mergedPg = [...basePg, ...newPg];
    const mergedMy = [...baseMy, ...newMy];

    fs.writeFileSync(pgPath, JSON.stringify(mergedPg, null, 2), "utf-8");
    fs.writeFileSync(myPath, JSON.stringify(mergedMy, null, 2), "utf-8");

    console.log(`[${topicId}] Saved ${mergedPg.length} PG questions and ${mergedMy.length} MySQL questions.`);
  }

  console.log("Batch 10.2 successfully applied!");
}

apply();
