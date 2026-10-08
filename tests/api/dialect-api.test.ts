import { describe, expect, it } from "vitest";
import { parseDialect } from "../../src/lib/api/dialect";
import { getDialectAdapter, isValidDialect } from "../../src/lib/engine/adapters";
import { getAllQuestions, getQuestionsByTopic } from "../../src/lib/curriculum/questions";

describe("Dual-Dialect API & Adapter Architecture Test Suite", () => {
  it("validates dialect identifier and rejects unknown dialects", () => {
    expect(isValidDialect("postgresql")).toBe(true);
    expect(isValidDialect("mysql")).toBe(true);
    expect(isValidDialect("sqlite")).toBe(false);
    expect(isValidDialect("oracle")).toBe(false);
    expect(isValidDialect("")).toBe(false);

    const validRes = parseDialect("postgresql");
    expect("dialect" in validRes && validRes.dialect).toBe("postgresql");

    const invalidRes = parseDialect("unknown-engine");
    expect("error" in invalidRes).toBe(true);
  });

  it("provides dialect adapters with dialect-specific identifiers and monaco languages", () => {
    const pgAdapter = getDialectAdapter("postgresql");
    expect(pgAdapter.id).toBe("postgresql");
    expect(pgAdapter.displayName).toBe("PostgreSQL 16");
    expect(pgAdapter.monacoLanguage).toBe("pgsql");
    expect(pgAdapter.formatterLanguage).toBe("postgresql");

    const mysqlAdapter = getDialectAdapter("mysql");
    expect(mysqlAdapter.id).toBe("mysql");
    expect(mysqlAdapter.displayName).toBe("MySQL 8.4");
    expect(mysqlAdapter.monacoLanguage).toBe("mysql");
    expect(mysqlAdapter.formatterLanguage).toBe("mysql");
  });

  it("executes authentic MySQL queries through MySqlAdapter in Phase 2", async () => {
    const mysqlAdapter = getDialectAdapter("mysql");
    const result = await mysqlAdapter.execute({
      databaseId: "employeedb",
      query: "SELECT 1 AS alive;",
      variant: "sample",
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1);
    expect(Number(result.rows[0].alive)).toBe(1);
  });

  it("executes authentic PostgreSQL queries through PostgresAdapter", async () => {
    const pgAdapter = getDialectAdapter("postgresql");
    const result = await pgAdapter.execute({
      databaseId: "employeedb",
      query: "SELECT dept_name FROM departments ORDER BY dept_id ASC LIMIT 2;",
      variant: "sample",
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(2);
    expect(result.columns).toContain("dept_name");
  });

  it("verifies question registry isolates dialects correctly", () => {
    const pgAll = getAllQuestions("postgresql");
    const mysqlAll = getAllQuestions("mysql");

    expect(pgAll.length).toBe(1632);
    expect(mysqlAll.length).toBe(1632);
    expect(pgAll.every((q) => q.dialect === "postgresql")).toBe(true);
    expect(mysqlAll.every((q) => q.dialect === "mysql")).toBe(true);

    const pgSelectQuestions = getQuestionsByTopic("select-basics", "postgresql");
    const mysqlSelectQuestions = getQuestionsByTopic("select-basics", "mysql");

    expect(pgSelectQuestions.length).toBe(32);
    expect(mysqlSelectQuestions.length).toBe(32);
    expect(pgSelectQuestions[0].dialect).toBe("postgresql");
    expect(mysqlSelectQuestions[0].dialect).toBe("mysql");
  });
});
