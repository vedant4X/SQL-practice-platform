import { QuestionType, ValidationResult } from "../types";

const MAX_QUERY_LENGTH = 10000;

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; code: string; message: string }> = [
  {
    pattern: /\bload\s+data\b/i,
    code: "DISALLOWED_OPERATION",
    message: "LOAD DATA is disabled for security reasons.",
  },
  {
    pattern: /\binto\s+(?:outfile|dumpfile)\b/i,
    code: "DISALLOWED_OPERATION",
    message: "File export (INTO OUTFILE / DUMPFILE) is forbidden.",
  },
  {
    pattern: /\bload_file\s*\(/i,
    code: "DISALLOWED_OPERATION",
    message: "LOAD_FILE() filesystem function is disabled.",
  },
  {
    pattern: /\bbenchmark\s*\(/i,
    code: "DISALLOWED_OPERATION",
    message: "BENCHMARK() function is not permitted in sandbox.",
  },
  {
    pattern: /\b(?:grant|revoke)\b/i,
    code: "PRIVILEGE_VIOLATION",
    message: "GRANT and REVOKE statements are forbidden.",
  },
  {
    pattern: /\b(?:create|alter|drop)\s+user\b/i,
    code: "PRIVILEGE_VIOLATION",
    message: "User management statements are forbidden.",
  },
  {
    pattern: /\bset\s+(?:global|persist)\b/i,
    code: "PRIVILEGE_VIOLATION",
    message: "Modifying global or persistent server variables is forbidden.",
  },
  {
    pattern: /\b(?:install|uninstall)\s+plugin\b/i,
    code: "PRIVILEGE_VIOLATION",
    message: "Plugin operations are forbidden.",
  },
  {
    pattern: /\b(?:source|\\[.])/i,
    code: "DISALLOWED_OPERATION",
    message: "SOURCE / \\. script inclusion is forbidden.",
  },
  {
    pattern: /\bhandler\b/i,
    code: "DISALLOWED_OPERATION",
    message: "HANDLER statements are not allowed in practice questions.",
  },
  {
    pattern: /\block\s+tables\b/i,
    code: "DISALLOWED_OPERATION",
    message: "LOCK TABLES is not permitted.",
  },
  {
    pattern: /\b(?:shutdown|kill|flush|reset)\b/i,
    code: "PRIVILEGE_VIOLATION",
    message: "Administrative commands (SHUTDOWN, KILL, FLUSH, RESET) are forbidden.",
  },
  {
    pattern: /\bcreate\s+function\s+.*soname\b/i,
    code: "PRIVILEGE_VIOLATION",
    message: "UDF library creation is forbidden.",
  },
  {
    pattern: /\buse\s+[a-z0-9_`]+/i,
    code: "DISALLOWED_OPERATION",
    message: "USE statement is disabled. Query assigned dataset directly.",
  },
  {
    pattern: /\b(?:mysql|performance_schema|sys)\s*\./i,
    code: "RESTRICTED_CATALOG_ACCESS",
    message: "Access to system catalogs (mysql, performance_schema, sys) is strictly blocked.",
  },
];

/**
 * Validates MySQL queries before execution inside the sandbox
 */
export function validateMySqlQuery(
  query: string,
  questionType: QuestionType = "select"
): ValidationResult {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      valid: false,
      code: "EMPTY_QUERY",
      error: "Query cannot be empty.",
    };
  }

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      code: "QUERY_TOO_LONG",
      error: `Query exceeds maximum allowed length of ${MAX_QUERY_LENGTH} characters.`,
    };
  }

  // Strip SQL comments before checking structure
  const uncommented = trimmed
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  // Multi-statement injection detection for practice questions
  // Semicolons followed by non-whitespace statements are rejected
  const statements = uncommented
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (statements.length > 1) {
    return {
      valid: false,
      code: "MULTI_STATEMENT_REJECTED",
      error: "Multiple statements are not permitted in practice questions. Run a single SQL statement.",
    };
  }

  const singleStmt = statements[0] || uncommented;

  // Forbidden patterns check
  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.pattern.test(singleStmt)) {
      return {
        valid: false,
        code: rule.code,
        error: rule.message,
      };
    }
  }

  // If question type is 'select', query must begin with SELECT, WITH, or EXPLAIN
  if (questionType === "select") {
    const isAllowedStart = /^(?:select|with|explain)\b/i.test(singleStmt);
    if (!isAllowedStart) {
      return {
        valid: false,
        code: "INVALID_STATEMENT_TYPE",
        error: "This practice question requires a read-only SELECT query (or WITH / EXPLAIN).",
      };
    }
  }

  return { valid: true };
}
