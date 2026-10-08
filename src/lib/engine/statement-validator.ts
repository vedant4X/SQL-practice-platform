import { QuestionType } from "./types";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

const MAX_QUERY_LENGTH = 10000;

// Prohibited dangerous routines and commands in practice queries
const DISALLOWED_PATTERNS = [
  { pattern: /\bCOPY\b/i, message: "The COPY command is disabled for security reasons." },
  { pattern: /\bpg_read_file\b/i, message: "File system access functions are disabled." },
  { pattern: /\bpg_write_file\b/i, message: "File system access functions are disabled." },
  { pattern: /\bpg_ls_dir\b/i, message: "Directory listing functions are disabled." },
  { pattern: /\bALTER\s+SYSTEM\b/i, message: "System configuration changes are disabled." },
  { pattern: /\bCREATE\s+(ROLE|USER)\b/i, message: "Role management is disabled." },
  { pattern: /\bDROP\s+(ROLE|USER)\b/i, message: "Role management is disabled." },
  { pattern: /\bSET\s+(ROLE|SESSION\s+AUTHORIZATION)\b/i, message: "Session authorization switching is disabled." },
  { pattern: /\bCREATE\s+EXTENSION\b/i, message: "Extension management is disabled." },
  { pattern: /\bdblink\b/i, message: "External database links are disabled." },
  { pattern: /\bpostgres_fdw\b/i, message: "Foreign data wrappers are disabled." },
  { pattern: /\bpg_terminate_backend\b/i, message: "Backend termination functions are disabled." },
];

/**
 * Strips comments and string literals to inspect query structure
 */
function stripCommentsAndLiterals(sql: string): string {
  // Strip multi-line comments /* ... */
  let cleaned = sql.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Strip single-line comments -- ...
  cleaned = cleaned.replace(/--.*$/gm, " ");
  // Replace string literals '...' with ''
  cleaned = cleaned.replace(/'(?:''|[^'])*'/g, "''");
  // Replace dollar-quoted strings $$...$$ with ''
  cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, "''");
  return cleaned.trim();
}

/**
 * Validates user SQL query before execution
 */
export function validateQuery(
  sql: string,
  questionType: QuestionType = "select"
): ValidationResult {
  if (!sql || sql.trim().length === 0) {
    return {
      valid: false,
      code: "EMPTY_QUERY",
      error: "Query cannot be empty. Please enter your SQL statement.",
    };
  }

  if (sql.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      code: "QUERY_TOO_LONG",
      error: `Query exceeds maximum allowed length of ${MAX_QUERY_LENGTH} characters.`,
    };
  }

  // Check disallowed patterns
  for (const { pattern, message } of DISALLOWED_PATTERNS) {
    if (pattern.test(sql)) {
      return {
        valid: false,
        code: "DISALLOWED_OPERATION",
        error: message,
      };
    }
  }

  const sanitized = stripCommentsAndLiterals(sql);

  // Check for multiple statements for select questions
  if (questionType === "select") {
    // Check if there are multiple statements separated by semicolons
    const statements = sanitized
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (statements.length > 1) {
      return {
        valid: false,
        code: "MULTI_STATEMENT_REJECTED",
        error:
          "Multiple statements are not permitted for this question. Please submit exactly one SELECT query.",
      };
    }

    const firstStatement = statements[0] || "";
    const isSelect = /^SELECT\b/i.test(firstStatement);
    const isCte = /^WITH\b[\s\S]*?\bSELECT\b/i.test(firstStatement);

    if (!isSelect && !isCte) {
      return {
        valid: false,
        code: "ONLY_SELECT_ALLOWED",
        error:
          "This question requires a query returning data. Your query must begin with SELECT or WITH ... SELECT.",
      };
    }
  }

  return { valid: true };
}
