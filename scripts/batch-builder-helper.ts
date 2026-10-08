import fs from "fs";
import path from "path";
import { QuestionMetadata, ComparisonConfig } from "../src/lib/engine/types";

export interface QuestionDef {
  num: number;
  slug: string;
  title: string;
  topicId: string;
  subtopicId: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  databaseId: string;
  tablesInvolved: string[];
  expectedColumns: Array<{ name: string; type: string }>;
  orderMatters: boolean;
  comparisonConfig?: ComparisonConfig;
  desc: string;
  starterPg: string;
  starterMy: string;
  solutionPg: string;
  solutionMy: string;
  explanation: string;
  commonMistakes: string[];
  interviewTip?: string;
  dialectNotes?: string;
  hints: string[];
  tags: string[];
}

export const TOPIC_PREFIX_MAP: Record<string, string> = {
  "advanced-ctes-hierarchies": "adh",
  "aggregates": "agg",
  "aliases": "ali",
  "anti-joins": "ant",
  "between-in": "btn",
  "conditional-aggregation": "cag",
  "conditionals": "cnd",
  "correlated-subqueries": "cor",
  "cross-self-join": "csj",
  "ctes": "cte",
  "date-time": "dat",
  "distinct": "dist",
  "gaps-and-islands": "gai",
  "group-by": "grp",
  "having": "hav",
  "in-exists": "ine",
  "inner-join": "inj",
  "intersect-except": "inex",
  "left-right-outer-join": "out",
  "like-wildcards": "lik",
  "limit-offset": "lim",
  "multi-column-group-by": "mcg",
  "multi-table-joins": "mtj",
  "null-handling": "nul",
  "numeric-functions": "num",
  "order-by": "ord",
  "query-optimization": "opt",
  "recursive-ctes": "rct",
  "scalar-subqueries": "sub",
  "scenario-airline": "sc-air",
  "scenario-banking": "sc-bnk",
  "scenario-finance": "sc-fin",
  "scenario-food-delivery": "sc-fdl",
  "scenario-hospital": "sc-hsp",
  "scenario-hotel": "sc-htl",
  "scenario-hr": "sc-hr",
  "scenario-inventory": "sc-inv",
  "scenario-library": "sc-lib",
  "scenario-movie-streaming": "sc-mov",
  "scenario-sales": "sc-sls",
  "scenario-social-media": "sc-soc",
  "select-basics": "sel",
  "string-functions": "str",
  "subqueries-in-from": "sqf",
  "temporary-tables": "tmp",
  "union-union-all": "uni",
  "views": "vew",
  "where-filtering": "whe",
  "window-aggregates": "wag",
  "window-offset": "wof",
  "window-ranking": "wrk",
};

function normalizeHints(hints: string[], solution: string, tables: string[]): string[] {
  const res = [...hints];
  if (res.length === 1) {
    res.push(`Formulate the query targeting the ${tables.join(", ")} table.`);
    res.push(`The expected query is: ${solution}`);
  } else if (res.length === 2) {
    res.push(`The expected query is: ${solution}`);
  }
  return res;
}

export function buildQuestions(topicId: string, defs: QuestionDef[], customPrefix?: string): { pg: QuestionMetadata[]; my: QuestionMetadata[] } {
  const pgQuestions: QuestionMetadata[] = [];
  const myQuestions: QuestionMetadata[] = [];
  const prefix = customPrefix || TOPIC_PREFIX_MAP[topicId] || topicId.slice(0, 3);

  for (const d of defs) {
    const xp = d.difficulty === "easy" ? 100 : d.difficulty === "medium" ? 200 : d.difficulty === "hard" ? 300 : 400;
    const est = d.difficulty === "easy" ? 3 : d.difficulty === "medium" ? 5 : d.difficulty === "hard" ? 7 : 10;
    const numStr = String(d.num).padStart(2, "0");

    const pgHints = normalizeHints(d.hints, d.solutionPg, d.tablesInvolved);
    const myHints = normalizeHints(d.hints, d.solutionMy, d.tablesInvolved);

    // PostgreSQL Question
    const pgQ: QuestionMetadata = {
      id: `q-${prefix}-${numStr}`,
      slug: d.slug,
      title: d.title,
      description_markdown: d.desc,
      topic_id: d.topicId,
      subtopic_id: d.subtopicId,
      difficulty: d.difficulty,
      dialect: "postgresql",
      database_id: d.databaseId,
      question_type: "select",
      tables_involved: d.tablesInvolved,
      expected_columns: d.expectedColumns,
      order_matters: d.orderMatters,
      comparison_config: d.comparisonConfig,
      starter_query: d.starterPg,
      solution_query: d.solutionPg,
      solution_explanation: d.explanation,
      alternative_solutions: [],
      common_mistakes: d.commonMistakes,
      interview_tip: d.interviewTip,
      dialect_notes: d.dialectNotes,
      hints: pgHints,
      tags: d.tags,
      source: "original",
      estimated_minutes: est,
      xp,
      status: "published",
      version: 1,
      test_cases: [
        { id: `tc-${prefix}-${numStr}-1`, name: "Visible Sample", is_hidden: false, dataset_name: "sample" },
        { id: `tc-${prefix}-${numStr}-2`, name: "Hidden Test 1", is_hidden: true, dataset_name: "hidden_1" },
        { id: `tc-${prefix}-${numStr}-3`, name: "Hidden Test 2", is_hidden: true, dataset_name: "hidden_2" },
      ],
    };

    // MySQL Question
    const myCols = d.expectedColumns.map((c) => {
      let type = c.type;
      if (type === "numeric") type = "decimal";
      return { ...c, type };
    });

    const myQ: QuestionMetadata = {
      id: `q-my-${prefix}-${numStr}`,
      slug: d.slug,
      title: d.title,
      description_markdown: d.desc,
      topic_id: d.topicId,
      subtopic_id: d.subtopicId,
      difficulty: d.difficulty,
      dialect: "mysql",
      database_id: d.databaseId,
      question_type: "select",
      tables_involved: d.tablesInvolved,
      expected_columns: myCols,
      order_matters: d.orderMatters,
      comparison_config: d.comparisonConfig,
      starter_query: d.starterMy,
      solution_query: d.solutionMy,
      solution_explanation: d.explanation,
      alternative_solutions: [],
      common_mistakes: d.commonMistakes,
      interview_tip: d.interviewTip,
      dialect_notes: d.dialectNotes,
      hints: myHints,
      tags: d.tags,
      source: "original",
      estimated_minutes: est,
      xp,
      status: "published",
      version: 1,
      test_cases: [
        { id: `tc-my-${prefix}-${numStr}-1`, name: "Visible Sample", is_hidden: false, dataset_name: "sample" },
        { id: `tc-my-${prefix}-${numStr}-2`, name: "Hidden Test 1", is_hidden: true, dataset_name: "hidden_1" },
        { id: `tc-my-${prefix}-${numStr}-3`, name: "Hidden Test 2", is_hidden: true, dataset_name: "hidden_2" },
      ],
    };

    pgQuestions.push(pgQ);
    myQuestions.push(myQ);
  }

  return { pg: pgQuestions, my: myQuestions };
}
