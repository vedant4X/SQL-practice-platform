import { describe, expect, it } from "vitest";
import { TOPICS } from "../../src/lib/curriculum/topics";
import { getAllQuestions, getQuestionsByTopic } from "../../src/lib/curriculum/questions";
import { executeInMySqlSandbox } from "../../src/lib/engine/mysql/mysql-sandbox-runner";

describe("MySQL Question Bank Content & Coverage Validation Suite", () => {
  it("enforces dual-dialect topic coverage rule: all 51 topics have exactly 32 published MySQL questions", () => {
    expect(TOPICS.length).toBe(51);

    for (const topic of TOPICS) {
      const questions = getQuestionsByTopic(topic.id, "mysql");
      expect(
        questions.length,
        `Topic '${topic.id}' (${topic.title}) must have 32 MySQL questions, found ${questions.length}`
      ).toBe(32);
    }
  });

  it("verifies total MySQL question bank achieves full curriculum target (1,632 questions)", () => {
    const mysqlQuestions = getAllQuestions("mysql");
    expect(mysqlQuestions.length).toBe(1632);
  });

  it("validates metadata completeness across all MySQL questions", () => {
    const mysqlQuestions = getAllQuestions("mysql");
    const slugSet = new Set<string>();
    const idSet = new Set<string>();

    for (const q of mysqlQuestions) {
      // Dialect must be explicitly mysql
      expect(q.dialect).toBe("mysql");

      // Unique IDs and slugs within dialect
      expect(idSet.has(q.id), `Duplicate MySQL question ID: ${q.id}`).toBe(false);
      idSet.add(q.id);

      expect(slugSet.has(q.slug), `Duplicate MySQL question slug: ${q.slug}`).toBe(false);
      slugSet.add(q.slug);

      // Metadata checks
      expect(q.title.trim().length).toBeGreaterThan(5);
      expect(q.description_markdown.trim().length).toBeGreaterThan(10);
      expect(q.solution_query.trim().length).toBeGreaterThan(5);
      expect(q.solution_explanation.trim().length).toBeGreaterThan(10);

      // 3 Progressive hints rule
      expect(
        q.hints.length,
        `Question ${q.id} must have at least 3 progressive hints`
      ).toBeGreaterThanOrEqual(3);

      // Expected columns
      expect(q.expected_columns.length).toBeGreaterThan(0);

      // Test cases: >= 3 test cases (1 visible + >= 2 hidden)
      expect(q.test_cases.length).toBeGreaterThanOrEqual(3);
      const visible = q.test_cases.filter((tc) => !tc.is_hidden);
      const hidden = q.test_cases.filter((tc) => tc.is_hidden);
      expect(visible.length).toBeGreaterThanOrEqual(1);
      expect(hidden.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("executes representative MySQL solution queries against real MySQL 8.4 engine", async () => {
    const mysqlQuestions = getAllQuestions("mysql");
    // Spot check questions across Level 1, 2, 3, 4, 7, 8, 10
    const sampleIds = [
      "q-my-sel-01",
      "q-my-dist-01",
      "q-my-cag-01",
      "q-my-out-03",
      "q-my-adh-03",
      "q-my-wrk-01",
      "q-my-sc-bnk-01",
      "q-my-sc-fdl-03",
    ];

    for (const id of sampleIds) {
      const q = mysqlQuestions.find((item) => item.id === id);
      expect(q, `Question ${id} should exist`).toBeDefined();

      const result = await executeInMySqlSandbox(q!.database_id, q!.solution_query, "sample");
      expect(
        result.success,
        `Solution execution failed on real MySQL for question ${id}: ${result.error?.userFacingMessage || result.error?.message}`
      ).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.columns.length).toBeGreaterThan(0);
    }
  });
});
