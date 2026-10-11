import { describe, expect, it, beforeEach } from "vitest";
import { appStore } from "../../src/lib/db/store";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import { createSessionToken, verifySessionToken } from "../../src/lib/auth/session";
import { evaluateSubmission } from "../../src/lib/engine/evaluator";
import { getQuestionBySlug } from "../../src/lib/curriculum/questions";
import { getUserProgressStats } from "../../src/lib/progress/service";

describe("API & Domain Services Integration Test Suite", () => {
  beforeEach(async () => {
    await appStore.resetForTesting();
  });

  it("handles user registration and password hashing verification", async () => {
    const rawPass = "SuperSecretPassword123!";
    const hashed = await hashPassword(rawPass);

    expect(hashed).toContain(":");
    const isValid = await verifyPassword(rawPass, hashed);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword("WrongPassword!", hashed);
    expect(isWrong).toBe(false);

    const user = await appStore.createUser({
      id: "usr-test-1",
      email: "engineer@company.com",
      passwordHash: hashed,
      name: "Alice Engineer",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const fetched = await appStore.getUserById("usr-test-1");
    expect(fetched?.email).toBe("engineer@company.com");
  });

  it("signs and verifies session tokens via jose", async () => {
    const payload = {
      userId: "usr-session-123",
      email: "test@sql.io",
      role: "user" as const,
      name: "Test User",
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("usr-session-123");
    expect(verified?.email).toBe("test@sql.io");
  });

  it("submits correct SQL, passes all 3 test cases, records attempt, and awards XP", async () => {
    const user = await appStore.createUser({
      id: "usr-judge-1",
      email: "judge@sql.io",
      passwordHash: "hash",
      name: "Judge Tester",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const question = getQuestionBySlug("view-all-departments");
    expect(question).toBeDefined();

    // Submit correct query
    const evalResult = await evaluateSubmission(question!, "SELECT dept_id, dept_name, location, budget FROM departments;");
    expect(evalResult.verdict).toBe("correct");
    expect(evalResult.passedCount).toBe(3);

    // Record submission in store
    const { attempt, xpEarned } = await appStore.recordSubmission({
      userId: user.id,
      questionId: question!.id,
      queryText: "SELECT dept_id, dept_name, location, budget FROM departments;",
      verdict: "correct",
      executionTimeMs: evalResult.overallExecutionTimeMs,
      passedCount: evalResult.passedCount,
      totalCount: evalResult.totalCount,
      baseXp: question!.xp,
    });

    expect(attempt.verdict).toBe("correct");
    expect(xpEarned).toBe(question!.xp);
    expect(await appStore.getUserXp(user.id)).toBe(question!.xp);

    // Submitting again on same solved question awards 0 additional XP
    const repeatResult = await appStore.recordSubmission({
      userId: user.id,
      questionId: question!.id,
      queryText: "SELECT * FROM departments;",
      verdict: "correct",
      executionTimeMs: 10,
      passedCount: 3,
      totalCount: 3,
      baseXp: question!.xp,
    });

    expect(repeatResult.xpEarned).toBe(0);
    expect(await appStore.getUserXp(user.id)).toBe(question!.xp);
  });

  it("applies progressive hint XP penalty accurately", async () => {
    const user = await appStore.createUser({
      id: "usr-hint-1",
      email: "hints@sql.io",
      passwordHash: "hash",
      name: "Hint Tester",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const question = getQuestionBySlug("view-all-departments")!;

    // Request hint 1 (-20%)
    await appStore.recordHintUsed(user.id, question.id, 1);
    let state = await appStore.getUserQuestionState(user.id, question.id);
    expect(state.hintsUsed).toBe(1);

    // Request hint 2 (-40%)
    await appStore.recordHintUsed(user.id, question.id, 2);
    state = await appStore.getUserQuestionState(user.id, question.id);
    expect(state.hintsUsed).toBe(2);

    // Solve with 2 hints used: 100 * (1 - 2 * 0.2) = 60 XP
    const submission = await appStore.recordSubmission({
      userId: user.id,
      questionId: question.id,
      queryText: "SELECT dept_id, dept_name, location, budget FROM departments;",
      verdict: "correct",
      executionTimeMs: 15,
      passedCount: 3,
      totalCount: 3,
      baseXp: 100,
    });

    expect(submission.xpEarned).toBe(60);
    expect(await appStore.getUserXp(user.id)).toBe(60);
  });

  it("forfeits 100% XP if solution was viewed before solving", async () => {
    const user = await appStore.createUser({
      id: "usr-solution-1",
      email: "solution@sql.io",
      passwordHash: "hash",
      name: "Solution Tester",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const question = getQuestionBySlug("view-all-departments")!;

    // View solution
    await appStore.recordSolutionViewed(user.id, question.id);
    const state = await appStore.getUserQuestionState(user.id, question.id);
    expect(state.solutionViewed).toBe(true);

    // Solve question after viewing solution
    const submission = await appStore.recordSubmission({
      userId: user.id,
      questionId: question.id,
      queryText: "SELECT dept_id, dept_name, location, budget FROM departments;",
      verdict: "correct",
      executionTimeMs: 15,
      passedCount: 3,
      totalCount: 3,
      baseXp: 100,
    });

    expect(submission.xpEarned).toBe(0);
    expect(await appStore.getUserXp(user.id)).toBe(0);
    expect((await appStore.getUserQuestionState(user.id, question.id)).isSolved).toBe(true);
  });

  it("maintains monotonic question status: solved status cannot be downgraded", async () => {
    const user = await appStore.createUser({
      id: "usr-monotonic-1",
      email: "monotonic@sql.io",
      passwordHash: "hash",
      name: "Monotonic Tester",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const question = getQuestionBySlug("view-all-departments")!;

    // First solve correctly
    await appStore.recordSubmission({
      userId: user.id,
      questionId: question.id,
      queryText: "SELECT dept_id, dept_name, location, budget FROM departments;",
      verdict: "correct",
      executionTimeMs: 15,
      passedCount: 3,
      totalCount: 3,
      baseXp: 100,
    });

    expect((await appStore.getUserQuestionState(user.id, question.id)).status).toBe("solved");

    // Later submit an incorrect query
    await appStore.recordSubmission({
      userId: user.id,
      questionId: question.id,
      queryText: "SELECT * FROM non_existent_table;",
      verdict: "error",
      executionTimeMs: 5,
      passedCount: 0,
      totalCount: 3,
      baseXp: 100,
    });

    // Invariant: status must still be solved
    expect((await appStore.getUserQuestionState(user.id, question.id)).status).toBe("solved");
    expect((await appStore.getUserQuestionState(user.id, question.id)).isSolved).toBe(true);
  });

  it("calculates dashboard progress statistics accurately", async () => {
    const user = await appStore.createUser({
      id: "usr-dashboard-1",
      email: "dash@sql.io",
      passwordHash: "hash",
      name: "Dashboard Tester",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const statsInitial = await getUserProgressStats(user.id);
    expect(statsInitial.level).toBe(1);
    expect(statsInitial.totalXp).toBe(0);
    expect(statsInitial.solvedCount).toBe(0);
    expect(statsInitial.recommendedQuestion).toBeDefined();

    // Solve 1 question
    const question = getQuestionBySlug("view-all-departments")!;
    await appStore.recordSubmission({
      userId: user.id,
      questionId: question.id,
      queryText: "SELECT dept_id, dept_name, location, budget FROM departments;",
      verdict: "correct",
      executionTimeMs: 15,
      passedCount: 3,
      totalCount: 3,
      baseXp: 100,
    });

    const statsAfter = await getUserProgressStats(user.id);
    expect(statsAfter.totalXp).toBe(100);
    expect(statsAfter.level).toBe(2); // floor(sqrt(100 / 50)) + 1 = floor(1.414) + 1 = 2
    expect(statsAfter.solvedCount).toBe(1);
  });
});
