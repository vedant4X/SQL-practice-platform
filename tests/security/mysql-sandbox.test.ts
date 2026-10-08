import { describe, expect, it } from "vitest";
import { validateMySqlQuery } from "../../src/lib/engine/mysql/mysql-statement-validator";
import { translateMySqlError } from "../../src/lib/engine/mysql/mysql-error-translator";
import { executeInMySqlSandbox } from "../../src/lib/engine/mysql/mysql-sandbox-runner";

describe("MySQL 8.4 Sandbox Security & Engine Test Suite", () => {
  it("rejects multi-statement injection attempts", () => {
    const malicious = "SELECT * FROM employees; DROP TABLE departments;";
    const res = validateMySqlQuery(malicious, "select");
    expect(res.valid).toBe(false);
    expect(res.code).toBe("MULTI_STATEMENT_REJECTED");
  });

  it("blocks LOAD DATA INFILE execution", () => {
    const malicious = "LOAD DATA INFILE '/etc/passwd' INTO TABLE employees;";
    const res = validateMySqlQuery(malicious, "select");
    expect(res.valid).toBe(false);
    expect(res.code).toBe("DISALLOWED_OPERATION");
  });

  it("blocks INTO OUTFILE and INTO DUMPFILE", () => {
    const malicious = "SELECT * FROM employees INTO OUTFILE '/var/lib/mysql/dump.txt';";
    const res = validateMySqlQuery(malicious, "select");
    expect(res.valid).toBe(false);
    expect(res.code).toBe("DISALLOWED_OPERATION");
  });

  it("blocks LOAD_FILE() filesystem function", () => {
    const malicious = "SELECT LOAD_FILE('/etc/shadow');";
    const res = validateMySqlQuery(malicious, "select");
    expect(res.valid).toBe(false);
    expect(res.code).toBe("DISALLOWED_OPERATION");
  });

  it("blocks BENCHMARK() denial-of-service attempts", () => {
    const malicious = "SELECT BENCHMARK(1000000000, MD5('abc'));";
    const res = validateMySqlQuery(malicious, "select");
    expect(res.valid).toBe(false);
    expect(res.code).toBe("DISALLOWED_OPERATION");
  });

  it("blocks GRANT and user manipulation commands", () => {
    const malicious1 = "GRANT ALL ON *.* TO 'attacker'@'%';";
    const res1 = validateMySqlQuery(malicious1, "select");
    expect(res1.valid).toBe(false);
    expect(res1.code).toBe("PRIVILEGE_VIOLATION");

    const malicious2 = "CREATE USER 'attacker'@'%' IDENTIFIED BY 'pass';";
    const res2 = validateMySqlQuery(malicious2, "select");
    expect(res2.valid).toBe(false);
    expect(res2.code).toBe("PRIVILEGE_VIOLATION");
  });

  it("blocks SET GLOBAL and administrative control statements", () => {
    const malicious1 = "SET GLOBAL max_connections = 1000;";
    const res1 = validateMySqlQuery(malicious1, "select");
    expect(res1.valid).toBe(false);
    expect(res1.code).toBe("PRIVILEGE_VIOLATION");

    const malicious2 = "SHUTDOWN;";
    const res2 = validateMySqlQuery(malicious2, "select");
    expect(res2.valid).toBe(false);
    expect(res2.code).toBe("PRIVILEGE_VIOLATION");
  });

  it("blocks access to internal system catalogs mysql, performance_schema, sys", () => {
    const malicious1 = "SELECT * FROM mysql.user;";
    const res1 = validateMySqlQuery(malicious1, "select");
    expect(res1.valid).toBe(false);
    expect(res1.code).toBe("RESTRICTED_CATALOG_ACCESS");

    const malicious2 = "SELECT * FROM performance_schema.threads;";
    const res2 = validateMySqlQuery(malicious2, "select");
    expect(res2.valid).toBe(false);
    expect(res2.code).toBe("RESTRICTED_CATALOG_ACCESS");
  });

  it("rejects queries exceeding maximum length of 10,000 characters", () => {
    const longQuery = "SELECT " + "x".repeat(10050);
    const res = validateMySqlQuery(longQuery, "select");
    expect(res.valid).toBe(false);
    expect(res.code).toBe("QUERY_TOO_LONG");
  });

  it("translates MySQL syntax errors (1064) with typo suggestions", () => {
    const error = { errno: 1064, message: "You have an error in your SQL syntax near 'FORM'" };
    const translated = translateMySqlError(error, "SELECT dept_name FORM departments;");
    expect(translated.userFacingMessage).toContain("syntax error");
    expect(translated.hint).toContain("FROM");
  });

  it("translates unknown column errors (1054)", () => {
    const error = { errno: 1054, message: "Unknown column 'salary_fake' in 'field list'" };
    const translated = translateMySqlError(error, "SELECT salary_fake FROM employees;");
    expect(translated.userFacingMessage).toContain("salary_fake");
    expect(translated.hint).toContain("Check column spelling");
  });

  it("executes hand-written MySQL query against the real MySQL server", async () => {
    const res = await executeInMySqlSandbox("employeedb", "SELECT 40 + 2 AS answer;", "sample");
    expect(res.success).toBe(true);
    expect(res.rowCount).toBe(1);
    expect(Number(res.rows[0].answer)).toBe(42);
  });

  it("queries populated educational dataset on real MySQL server", async () => {
    const res = await executeInMySqlSandbox(
      "employeedb",
      "SELECT dept_name FROM departments ORDER BY dept_id ASC LIMIT 2;",
      "sample"
    );
    expect(res.success).toBe(true);
    expect(res.rowCount).toBe(2);
    expect(res.columns).toContain("dept_name");
  });

  it("enforces timeout on runaway queries (SLEEP) via KILL QUERY watchdog", async () => {
    const res = await executeInMySqlSandbox(
      "employeedb",
      "SELECT SLEEP(10);",
      "sample",
      { timeoutMs: 1500 }
    );
    expect(res.success).toBe(false);
    expect(res.error?.userFacingMessage).toContain("timed out");
  });

  it("enforces ephemeral database isolation for DDL/DML and cleans up", async () => {
    const res = await executeInMySqlSandbox(
      "employeedb",
      "CREATE TABLE ephemeral_test (id INT PRIMARY KEY);",
      "sample",
      { questionType: "ddl_dml" }
    );
    expect(res.success).toBe(true);
  });
});
