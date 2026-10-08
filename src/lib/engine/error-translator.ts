export interface TranslatedError {
  code: string;
  sqlState?: string;
  message: string;
  hint?: string;
  position?: number;
  userFacingMessage: string;
}

const COMMON_SQL_TYPOS: Record<string, string> = {
  FORM: "FROM",
  WHER: "WHERE",
  WERE: "WHERE",
  SELETC: "SELECT",
  SELEC: "SELECT",
  GROUPE: "GROUP",
  GROPU: "GROUP",
  ODER: "ORDER",
  HAVNG: "HAVING",
  DISTINCTT: "DISTINCT",
  LIMT: "LIMIT",
  JION: "JOIN",
  INNERR: "INNER",
};

/**
 * Translates PostgreSQL errors into clear, friendly, and actionable explanations.
 */
export function translatePostgresError(
  error: any,
  queryText?: string,
  availableTables?: string[]
): TranslatedError {
  const rawMessage: string = error?.message || String(error);
  const sqlState: string | undefined = error?.code || error?.sqlState;
  const positionStr = error?.position;
  const position = positionStr ? parseInt(positionStr, 10) : undefined;

  let hint: string | undefined = error?.hint;
  let userFacingMessage = rawMessage;

  // Typo detection in syntax errors
  if (sqlState === "42601" || rawMessage.includes("syntax error")) {
    userFacingMessage = "There is a syntax error in your SQL query.";
    if (queryText) {
      for (const [typo, correct] of Object.entries(COMMON_SQL_TYPOS)) {
        const regex = new RegExp(`\\b${typo}\\b`, "i");
        if (regex.test(queryText)) {
          hint = `Did you mean '${correct}' instead of '${typo}'?`;
          break;
        }
      }
    }
    if (!hint) {
      hint = "Check for missing keywords, misplaced commas, or unclosed parentheses.";
    }
  } else if (sqlState === "42703" || rawMessage.includes("column does not exist")) {
    const colMatch = rawMessage.match(/column "([^"]+)" does not exist/i);
    const colName = colMatch ? colMatch[1] : "specified";
    userFacingMessage = `Column '${colName}' does not exist in the selected tables.`;
    hint = "Check the spelling of the column name in the database explorer panel on the left.";
  } else if (sqlState === "42P01" || rawMessage.includes("relation does not exist")) {
    const tableMatch = rawMessage.match(/relation "([^"]+)" does not exist/i);
    const tableName = tableMatch ? tableMatch[1] : "specified";
    userFacingMessage = `Table '${tableName}' does not exist in this database.`;
    if (availableTables && availableTables.length > 0) {
      hint = `Available tables in this dataset: ${availableTables.join(", ")}`;
    } else {
      hint = "Verify table names in the database schema panel.";
    }
  } else if (sqlState === "42803" || rawMessage.includes("must appear in the GROUP BY clause")) {
    const colMatch = rawMessage.match(/column "([^"]+)" must appear in the GROUP BY/i);
    const colName = colMatch ? colMatch[1] : "this column";
    userFacingMessage = `Column '${colName}' must appear in the GROUP BY clause or be used in an aggregate function (such as COUNT, SUM, AVG, MIN, MAX).`;
    hint = "Every non-aggregated column in your SELECT list must be listed in GROUP BY.";
  } else if (sqlState === "42883" || rawMessage.includes("function does not exist")) {
    const fnMatch = rawMessage.match(/function ([^\s(]+)\(/i);
    const fnName = fnMatch ? fnMatch[1] : "specified";
    userFacingMessage = `Function '${fnName}' does not exist or has invalid argument types.`;
    hint = "PostgreSQL function names include UPPER, LOWER, ROUND, DATE_TRUNC, EXTRACT, etc.";
  } else if (sqlState === "57014" || rawMessage.includes("canceling statement due to statement timeout")) {
    userFacingMessage = "Query execution timed out after 5.0 seconds.";
    hint = "Ensure your JOIN conditions are correct and check for unintentional Cartesian products (CROSS JOIN).";
  } else if (sqlState === "22012" || rawMessage.includes("division by zero")) {
    userFacingMessage = "Division by zero encountered in calculation.";
    hint = "Use NULLIF(divisor, 0) or CASE to prevent division by zero.";
  } else if (sqlState === "22007" || rawMessage.includes("invalid input syntax for type date")) {
    userFacingMessage = "Invalid date or timestamp format.";
    hint = "Format dates as 'YYYY-MM-DD' or use TO_DATE / DATE_TRUNC.";
  }

  // Strip internal filesystem paths or database host details
  const sanitizedMessage = userFacingMessage
    .replace(/at\s+\/.*(?:\.js|\.ts):\d+:\d+/g, "")
    .replace(/connection\s+to\s+server.*failed/gi, "Database connection unavailable")
    .trim();

  return {
    code: sqlState || "SQL_EXECUTION_ERROR",
    sqlState,
    message: sanitizedMessage,
    hint,
    position,
    userFacingMessage: sanitizedMessage,
  };
}
