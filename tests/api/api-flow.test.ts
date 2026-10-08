import { describe, expect, it, beforeEach } from "vitest";
import { appStore } from "../../src/lib/db/store";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";
import { createSessionToken, verifySessionToken } from "../../src/lib/auth/session";
import { evaluateSubmission } from "../../src/lib/engine/evaluator";
import { getQuestionBySlug } from "../../src/lib/curriculum/questions";
import { getUserProgressStats } from "../../src/lib/progress/service";

describe("API & Domain Services Integration Test Suite", () => {
  beforeEach(() => {
    appStore.resetForTesting();
  });

  it("handles user registration and password hashing verification", async () => {
    const rawPass = "SuperSecretPassword123!";
    const hashed = await hashPassword(rawPass);

    expect(hashed).toContain(":");
    const isValid = await verifyPassword(rawPass, hashed);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword("WrongPassword!", hashed);
    expect(isWrong).toBe(false);

    const user = appStore.createUser({
      id: "usr-test-1",
      email: "engineer@company.com",
      passwordHash: hashed,
      name: "Alice Engineer",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(appStore.getUserById("usr-test-1")?.email).toBe("engineer@company.com");
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
    const user = appStore.createUser({
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
    const { attempt, xpEarned } = appStore.recordSubmission({
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
    expect(appStore.getUserXp(user.id)).toBe(question!.xp);

    // Submitting again on same solved question awards 0 additional XP
    const repeatResult = appStore.recordSubmission({
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
    expect(appStore.getUserXp(user.id)).toBe(question!.xp);
  });

  it("applies progressive hint XP penalty accurately", async () => {
    const user = appStore.createUser({
      id: "usr-hint-1",
      email: "hints@sql.io",
      passwordHash: "hash",
      name: "Hint Tester",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const question = getQuestionBySlug("select-employee-roster");
    expect(question).toBeDefined();

    // User uses 2 hints
    appStore.recordHintUsed(user.id, question!.id, 2);

    // Solves question: base XP is 10. With 2 hints (40% penalty) -> 6 XP
    const { xpEarned } = appStore.recordSubmission({
      userId: user.id,
      questionId: question!.id,
      queryText: question!.solution_query,
      verdict: "correct",
      executionTimeMs: 15,
      passedCount: 3,
      totalCount: 3,
      baseXp: question!.xp,
    });

    expect(xpEarned).toBe(6);
    expect(appStore.getUserXp(user.id)).toBe(6);
  });

  it("forfeits XP when solution is viewed", async () => {
    const user = appStore.createUser({
      id: "usr-sol-1",
      email: "solution@sql.io",
      passwordHash: "hash",
      name: "Solution Tester",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const question = getQuestionBySlug("unique-job-titles");
    expect(question).toBeDefined();

    // Forfeits XP
    appStore.recordSolutionViewed(user.id, question!.id);

    const { xpEarned } = appStore.recordSubmission({
      userId: user.id,
      questionId: question!.id,
      queryText: question!.solution_query,
      verdict: "correct",
      executionTimeMs: 15,
      passedCount: 3,
      totalCount: 3,
      baseXp: question!.xp,
    });

    expect(xpEarned).toBe(0);
    expect(appStore.getUserXp(user.id)).toBe(0);
  });

  it("calculates user progression, levels, accuracy, and recommendations", () => {
    const user = appStore.createUser({
      id: "usr-progress-1",
      email: "prog@sql.io",
      passwordHash: "hash",
      name: "Progression Tester",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const statsInitial = getUserProgressStats(user.id);
    expect(statsInitial.level).toBe(1);
    expect(statsInitial.totalXp).toBe(0);
    expect(statsInitial.solvedCount).toBe(0);
    expect(statsInitial.recommendedQuestion).toBeDefined();

    // Solve one question
    const q = getQuestionBySlug("view-all-departments")!;
    appStore.recordSubmission({
      userId: user.id,
      questionId: q.id,
      queryText: q.solution_query,
      verdict: "correct",
      executionTimeMs: 20,
      passedCount: 3,
      totalCount: 3,
      baseXp: 50,
    });

    const statsUpdated = getUserProgressStats(user.id);
    expect(statsUpdated.totalXp).toBe(50);
    expect(statsUpdated.level).toBe(2);
    expect(statsUpdated.solvedCount).toBe(1);
  });
});
