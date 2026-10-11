import { describe, expect, it } from "vitest";
import { appStore, migrateAppDbToDualDialect } from "../../src/lib/db/store";

describe("Data Model Dual-Dialect Migration Test Suite", () => {
  it("migrates legacy app-db records without dialect to postgresql", () => {
    const legacyState = {
      users: [
        {
          id: "usr-legacy-1",
          email: "legacy@sql.io",
          passwordHash: "hash",
          name: "Legacy User",
          role: "user",
          timezone: "UTC",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      userSettings: [
        {
          userId: "usr-legacy-1",
          practiceModeEnabled: false,
          theme: "dark",
          leaderboardVisible: false,
        },
      ],
      userQuestionState: [
        {
          userId: "usr-legacy-1",
          questionId: "q-sel-01",
          isSolved: true,
          hintsUsed: 1,
          solutionViewed: false,
          xpAwarded: 50,
          firstSolvedAt: "2026-01-01T00:00:00Z",
        },
      ],
      userAttempts: [
        {
          id: "att-legacy-1",
          userId: "usr-legacy-1",
          questionId: "q-sel-01",
          queryText: "SELECT * FROM departments;",
          verdict: "correct",
          executionTimeMs: 15,
          passedCount: 3,
          totalCount: 3,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
      xpEvents: [
        {
          id: "xp-legacy-1",
          userId: "usr-legacy-1",
          sourceType: "question_solve",
          sourceId: "q-sel-01",
          amount: 50,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
      savedQuestions: [
        {
          userId: "usr-legacy-1",
          questionId: "q-sel-01",
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
      queryHistory: [
        {
          id: "qh-legacy-1",
          userId: "usr-legacy-1",
          questionId: "q-sel-01",
          queryText: "SELECT * FROM departments;",
          status: "success",
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
    };

    const migrated = migrateAppDbToDualDialect(legacyState);

    expect(migrated.userQuestionState[0].dialect).toBe("postgresql");
    expect(migrated.userAttempts[0].dialect).toBe("postgresql");
    expect(migrated.xpEvents[0].dialect).toBe("postgresql");
    expect(migrated.savedQuestions[0].dialect).toBe("postgresql");
    expect(migrated.queryHistory[0].dialect).toBe("postgresql");
  });

  it("isolates progress, attempts, and XP between postgresql and mysql", async () => {
    await appStore.resetForTesting();

    const user = await appStore.createUser({
      id: "usr-dual-1",
      email: "dual@sql.io",
      passwordHash: "hash",
      name: "Dual Dialect Learner",
      role: "user",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Record submission for PostgreSQL
    await appStore.recordSubmission({
      userId: user.id,
      questionId: "q-sel-01",
      dialect: "postgresql",
      queryText: "SELECT 1;",
      verdict: "correct",
      executionTimeMs: 10,
      passedCount: 3,
      totalCount: 3,
      baseXp: 50,
    });

    // PostgreSQL question state is solved
    const pgState = await appStore.getUserQuestionState(user.id, "q-sel-01", "postgresql");
    expect(pgState.isSolved).toBe(true);
    expect(pgState.dialect).toBe("postgresql");

    // MySQL question state is NOT solved
    const mysqlState = await appStore.getUserQuestionState(user.id, "q-sel-01", "mysql");
    expect(mysqlState.isSolved).toBe(false);
    expect(mysqlState.dialect).toBe("mysql");

    // XP is dialect-scoped
    expect(await appStore.getUserXp(user.id, "postgresql")).toBe(50);
    expect(await appStore.getUserXp(user.id, "mysql")).toBe(0);

    // Global combined XP is 50
    expect(await appStore.getUserXp(user.id)).toBe(50);

    // Solved lists are isolated
    expect(await appStore.getUserSolvedQuestions(user.id, "postgresql")).toContain("q-sel-01");
    expect(await appStore.getUserSolvedQuestions(user.id, "mysql")).not.toContain("q-sel-01");
  });
});
