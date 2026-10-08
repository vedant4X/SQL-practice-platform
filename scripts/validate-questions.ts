import fs from "fs";
import path from "path";
import { QuestionMetadataSchema } from "../src/lib/curriculum/schema";
import { executeInSandbox } from "../src/lib/engine/sandbox-runner";
import { executeInMySqlSandbox } from "../src/lib/engine/mysql/mysql-sandbox-runner";
import { Dialect } from "../src/lib/engine/types";

const CONTENT_DIR = path.resolve(process.cwd(), "content", "questions");

interface ValidationIssue {
  dialect: Dialect;
  file: string;
  id: string;
  type: "SCHEMA" | "DUPLICATE" | "LINT" | "EXECUTION";
  message: string;
}

const issues: ValidationIssue[] = [];

// Dialect lint patterns
const MYSQL_DISALLOWED_PATTERNS = [
  { pattern: /::(?:int|numeric|text|date)/i, rule: "Postgres type cast '::' not allowed in MySQL" },
  { pattern: /\bILIKE\b/i, rule: "ILIKE is PostgreSQL-specific (use LIKE in MySQL)" },
  { pattern: /\bRETURNING\b/i, rule: "RETURNING clause is PostgreSQL-specific" },
  { pattern: /\bFILTER\s*\(\s*WHERE/i, rule: "FILTER (WHERE ...) is not supported in MySQL" },
];

const PG_DISALLOWED_PATTERNS = [
  { pattern: /`[a-zA-Z0-9_]+`/i, rule: "Backtick quoting is MySQL-specific (use double quotes in PostgreSQL)" },
  { pattern: /\bGROUP_CONCAT\b/i, rule: "GROUP_CONCAT is MySQL-specific (use STRING_AGG in PostgreSQL)" },
  { pattern: /\bIFNULL\b/i, rule: "IFNULL is MySQL-specific (use COALESCE in PostgreSQL)" },
];

let totalQuestionsCount = 0;

async function validateDialect(dialect: Dialect) {
  const dir = path.join(CONTENT_DIR, dialect);
  if (!fs.existsSync(dir)) {
    issues.push({
      dialect,
      file: "",
      id: "",
      type: "SCHEMA",
      message: `Directory not found: ${dir}`,
    });
    return;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  console.log(`\nValidating ${dialect.toUpperCase()} questions (${files.length} files)...`);

  const titlesSet = new Set<string>();
  const normalizedSolutionsSet = new Map<string, string>();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    let questions: any[];
    try {
      questions = JSON.parse(raw);
    } catch (parseErr: any) {
      issues.push({
        dialect,
        file,
        id: "",
        type: "SCHEMA",
        message: `JSON parse error: ${parseErr.message}`,
      });
      continue;
    }
    totalQuestionsCount += questions.length;

    for (const q of questions) {
      const qId = q.id || "unknown";

      // 1. Zod Schema
      const schemaCheck = QuestionMetadataSchema.safeParse(q);
      if (!schemaCheck.success) {
        issues.push({
          dialect,
          file,
          id: qId,
          type: "SCHEMA",
          message: JSON.stringify(schemaCheck.error.format()),
        });
        continue;
      }

      // 2. Duplicate Detection within dialect
      const titleLower = q.title.trim().toLowerCase();
      if (titlesSet.has(titleLower)) {
        issues.push({
          dialect,
          file,
          id: qId,
          type: "DUPLICATE",
          message: `Duplicate question title: "${q.title}"`,
        });
      }
      titlesSet.add(titleLower);

      const normalizedSql = q.solution_query
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .replace(/;$/, "");

      if (normalizedSolutionsSet.has(normalizedSql)) {
        issues.push({
          dialect,
          file,
          id: qId,
          type: "DUPLICATE",
          message: `Duplicate solution query identical to ${normalizedSolutionsSet.get(normalizedSql)}`,
        });
      }
      normalizedSolutionsSet.set(normalizedSql, qId);

      // 3. Dialect Lint
      if (dialect === "mysql") {
        for (const lint of MYSQL_DISALLOWED_PATTERNS) {
          if (lint.pattern.test(q.solution_query)) {
            issues.push({
              dialect,
              file,
              id: qId,
              type: "LINT",
              message: lint.rule,
            });
          }
        }
      } else {
        for (const lint of PG_DISALLOWED_PATTERNS) {
          if (lint.pattern.test(q.solution_query)) {
            issues.push({
              dialect,
              file,
              id: qId,
              type: "LINT",
              message: lint.rule,
            });
          }
        }
      }

      // 4. Engine Execution Validation on sample test case
      try {
        let result: any;
        if (dialect === "mysql") {
          result = await executeInMySqlSandbox(q.database_id, q.solution_query, "sample");
        } else {
          result = await executeInSandbox(q.database_id, q.solution_query, "sample");
        }

        if (!result.success) {
          issues.push({
            dialect,
            file,
            id: qId,
            type: "EXECUTION",
            message: `Engine execution failed: ${result.error?.userFacingMessage || result.error?.message}`,
          });
        } else if (result.rowCount === 0 && !q.tags.includes("empty-result")) {
          // Warning for degenerate result unless explicitly tagged
          console.warn(`  [Warning] ${dialect}:${qId} returned 0 rows in sample dataset.`);
        }
      } catch (execErr: any) {
        issues.push({
          dialect,
          file,
          id: qId,
          type: "EXECUTION",
          message: `Engine crash: ${execErr.message}`,
        });
      }
    }
  }
}

async function main() {
  console.log("=== SQL Platform Dual-Dialect Questions CI Validation ===");

  await validateDialect("postgresql");
  await validateDialect("mysql");

  console.log("\n=========================================================");
  console.log(`Validation Summary: ${issues.length} issues found`);
  console.log("=========================================================");

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(
        `[${issue.type}] ${issue.dialect.toUpperCase()} ${issue.file}:${issue.id} -> ${issue.message}`
      );
    }
    process.exit(1);
  } else {
    console.log(`✓ All ${totalQuestionsCount} questions in PostgreSQL and MySQL passed full CI validation!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
