import { describe, expect, it } from "vitest";
import { TOPICS } from "../../src/lib/curriculum/topics";
import { ALL_QUESTIONS, getQuestionsByTopic } from "../../src/lib/curriculum/questions";
import { executeInSandbox } from "../../src/lib/engine/sandbox-runner";

describe("Question Bank Content & Coverage Validation Suite", () => {
  it("enforces full topic coverage rule: all 51 topics have exactly 32 published questions", () => {
    expect(TOPICS.length).toBe(51);

    for (const topic of TOPICS) {
      const questions = getQuestionsByTopic(topic.id);
      expect(
        questions.length,
        `Topic '${topic.id}' (${topic.title}) must have 32 questions, found ${questions.length}`
      ).toBe(32);
    }
  });

  it("verifies total PostgreSQL question bank achieves full curriculum target (1,632 questions)", () => {
    expect(ALL_QUESTIONS.length).toBe(1632);
  });

  it("validates metadata completeness across all questions", () => {
    const slugSet = new Set<string>();
    const idSet = new Set<string>();

    for (const q of ALL_QUESTIONS) {
      // Unique IDs and slugs
      expect(idSet.has(q.id), `Duplicate question ID: ${q.id}`).toBe(false);
      idSet.add(q.id);

      expect(slugSet.has(q.slug), `Duplicate question slug: ${q.slug}`).toBe(false);
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

  it("executes sample solution queries against real Postgres 16 engine", async () => {
    // Spot-check questions across Level 1, 2, 4, 8, 10
    const sampleIds = [
      "q-sel-01",
      "q-dist-01",
      "q-whe-01",
      "q-agg-02",
      "q-inj-01",
      "q-wrk-01",
      "q-sc-bnk-01",
      "q-sc-fdl-01",
    ];

    for (const id of sampleIds) {
      const q = ALL_QUESTIONS.find((item) => item.id === id);
      expect(q).toBeDefined();

      const result = await executeInSandbox(q!.database_id, q!.solution_query, "sample");
      expect(
        result.success,
        `Solution execution failed for question ${id}: ${result.error?.message}`
      ).toBe(true);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.columns.length).toBeGreaterThan(0);
    }
  });
});
