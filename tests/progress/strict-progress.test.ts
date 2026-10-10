import { describe, expect, it, beforeEach } from "vitest";
import { appStore } from "../../src/lib/db/store";
import { getTopicNavigation } from "../../src/lib/curriculum/navigation";
import { getQuestionsByTopic } from "../../src/lib/curriculum/questions";
import { TOPICS } from "../../src/lib/curriculum/topics";

describe("Strict Zero-Loss Progress & Navigation Test Suite", () => {
  beforeEach(() => {
    appStore.resetForTesting();
  });

  describe("B1. Topic Navigation within curriculum boundaries", () => {
    it("determines topic navigation accurately for the first question of a topic", () => {
      const topic1 = TOPICS[0];
      const questions = getQuestionsByTopic(topic1.id, "postgresql");
      expect(questions.length).toBeGreaterThan(0);

      const firstQuestion = questions[0];
      const nav = getTopicNavigation(firstQuestion.slug, "postgresql");

      expect(nav.isFirstInTopic).toBe(true);
      expect(nav.prevSlug).toBeNull();
      expect(nav.prevTitle).toBeNull();
      if (questions.length > 1) {
        expect(nav.nextSlug).toBe(questions[1].slug);
        expect(nav.nextTitle).toBe(questions[1].title);
        expect(nav.isLastInTopic).toBe(false);
      }
    });

    it("moves sequentially within the topic for middle questions", () => {
      const topic1 = TOPICS[0];
      const questions = getQuestionsByTopic(topic1.id, "postgresql");
      if (questions.length >= 3) {
        const midQuestion = questions[1];
        const nav = getTopicNavigation(midQuestion.slug, "postgresql");

        expect(nav.isFirstInTopic).toBe(false);
        expect(nav.prevSlug).toBe(questions[0].slug);
        expect(nav.nextSlug).toBe(questions[2].slug);
        expect(nav.isLastInTopic).toBe(false);
      }
    });

    it("handles last question in topic with isLastInTopic flag and next topic metadata", () => {
      const topic1 = TOPICS[0];
      const questions = getQuestionsByTopic(topic1.id, "postgresql");
      const lastQuestion = questions[questions.length - 1];

      const nav = getTopicNavigation(lastQuestion.slug, "postgresql");

      expect(nav.isLastInTopic).toBe(true);
      expect(nav.nextSlug).toBeNull();
      if (TOPICS.length > 1) {
        expect(nav.nextTopicSlug).toBe(TOPICS[1].slug);
        expect(nav.nextTopicTitle).toBe(TOPICS[1].title);
      }
    });

    it("preserves dialect isolation for MySQL navigation", () => {
      const topic1 = TOPICS[0];
      const mysqlQuestions = getQuestionsByTopic(topic1.id, "mysql");
      expect(mysqlQuestions.length).toBeGreaterThan(0);

      const firstMysql = mysqlQuestions[0];
      const nav = getTopicNavigation(firstMysql.slug, "mysql");

      expect(nav.isFirstInTopic).toBe(true);
      expect(nav.prevSlug).toBeNull();
    });
  });

  describe("B3. Strict Monotonic Progress Tracking", () => {
    it("guarantees monotonic state: once solved, subsequent failed resubmission stays solved", () => {
      const userId = "usr-monotonic-1";
      const questionId = "q-select-01";

      // 1. Initial state is not_started
      const initial = appStore.getUserQuestionState(userId, questionId, "postgresql");
      expect(initial.isSolved).toBe(false);
      expect(initial.status).toBe("not_started");
      expect(initial.attemptCount).toBe(0);

      // 2. Submit correct solution
      const firstSubmission = appStore.recordSubmission({
        userId,
        questionId,
        dialect: "postgresql",
        queryText: "SELECT * FROM employees;",
        verdict: "correct",
        executionTimeMs: 12,
        passedCount: 3,
        totalCount: 3,
        baseXp: 100,
      });

      expect(firstSubmission.xpEarned).toBe(100);
      const afterSolve = appStore.getUserQuestionState(userId, questionId, "postgresql");
      expect(afterSolve.isSolved).toBe(true);
      expect(afterSolve.status).toBe("solved");
      expect(afterSolve.attemptCount).toBe(1);
      expect(afterSolve.firstSolvedAt).toBeDefined();

      // 3. User later resubmits with an incorrect or syntax error query
      const failedSubmission = appStore.recordSubmission({
        userId,
        questionId,
        dialect: "postgresql",
        queryText: "SELECT invalid_syntax FROM employees;",
        verdict: "error",
        executionTimeMs: 5,
        passedCount: 0,
        totalCount: 3,
        baseXp: 100,
        errorMessage: "syntax error at or near 'invalid_syntax'",
      });

      expect(failedSubmission.xpEarned).toBe(0); // No double XP

      // Invariant: MUST REMAIN SOLVED! Never downgraded to attempted or unsolved
      const afterFail = appStore.getUserQuestionState(userId, questionId, "postgresql");
      expect(afterFail.isSolved).toBe(true);
      expect(afterFail.status).toBe("solved");
      expect(afterFail.attemptCount).toBe(2);
      expect(afterFail.lastSubmittedQuery).toBe("SELECT invalid_syntax FROM employees;");
    });

    it("saves and retrieves editor drafts across sessions", () => {
      const userId = "usr-draft-1";
      const questionId = "q-filter-02";
      const draftContent = "SELECT employee_id, department FROM employees WHERE salary > 75000;";

      // Save draft
      const saved = appStore.saveDraft(userId, questionId, "postgresql", draftContent);
      expect(saved.draftText).toBe(draftContent);

      // Retrieve draft in separate lookup
      const retrieved = appStore.getDraft(userId, questionId, "postgresql");
      expect(retrieved).toBe(draftContent);

      // Update draft
      const updatedContent = "SELECT employee_id, department FROM employees WHERE salary > 90000 ORDER BY salary DESC;";
      appStore.saveDraft(userId, questionId, "postgresql", updatedContent);
      const retrievedUpdated = appStore.getDraft(userId, questionId, "postgresql");
      expect(retrievedUpdated).toBe(updatedContent);

      // Clear draft
      appStore.clearDraft(userId, questionId, "postgresql");
      expect(appStore.getDraft(userId, questionId, "postgresql")).toBeUndefined();
    });

    it("merges guest progress on sign-in without overwriting existing solved status", () => {
      const userId = "usr-merge-1";
      const guestSolved = ["q-select-01", "q-select-02", "q-where-01"];

      // User already solved q-select-01 previously
      appStore.recordSubmission({
        userId,
        questionId: "q-select-01",
        dialect: "postgresql",
        queryText: "SELECT 1;",
        verdict: "correct",
        executionTimeMs: 10,
        passedCount: 3,
        totalCount: 3,
        baseXp: 50,
      });

      // Merge guest progress
      appStore.mergeGuestProgress(userId, guestSolved, undefined, "postgresql");

      const solvedList = appStore.getUserSolvedQuestions(userId, "postgresql");
      expect(solvedList).toContain("q-select-01");
      expect(solvedList).toContain("q-select-02");
      expect(solvedList).toContain("q-where-01");
      expect(solvedList.length).toBe(3);

      const q1State = appStore.getUserQuestionState(userId, "q-select-01", "postgresql");
      expect(q1State.isSolved).toBe(true);
      expect(q1State.status).toBe("solved");
    });
  });
});
