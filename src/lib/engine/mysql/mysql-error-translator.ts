import { ErrorDetail } from "../types";

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
 * Translates MySQL error codes and messages into clear, friendly educational guidance
 */
export function translateMySqlError(
  error: any,
  queryText?: string,
  availableTables?: string[]
): ErrorDetail {
  const errno: number | undefined = error?.errno || error?.code;
  const sqlState: string | undefined = error?.sqlState;
  const rawMessage: string = error?.message || String(error);

  let userFacingMessage = rawMessage;
  let hint: string | undefined = undefined;

  switch (errno) {
    case 1064: { // ER_PARSE_ERROR
      userFacingMessage = "There is a syntax error in your MySQL query.";
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
        hint = "Check for misplaced commas, unclosed quotes, or misspelled SQL keywords.";
      }
      break;
    }

    case 1054: { // ER_BAD_FIELD_ERROR
      const colMatch = rawMessage.match(/Unknown column '([^']+)'/i);
      const col = colMatch ? colMatch[1] : "specified";
      userFacingMessage = `Unknown column '${col}' in field list or WHERE clause.`;
      hint = "Check column spelling or ensure you qualified the column with its table alias.";
      break;
    }

    case 1146: { // ER_NO_SUCH_TABLE
      const tblMatch = rawMessage.match(/Table '([^']+)' doesn't exist/i);
      const fullTbl = tblMatch ? tblMatch[1] : "specified";
      const tbl = fullTbl.includes(".") ? fullTbl.split(".").pop()! : fullTbl;
      userFacingMessage = `Table '${tbl}' does not exist in this database.`;
      if (availableTables && availableTables.length > 0) {
        hint = `Available tables in this dataset: ${availableTables.join(", ")}`;
      } else {
        hint = "Check the tables listed in the database schema panel.";
      }
      break;
    }

    case 1052: { // ER_NON_UNIQ_ERROR
      const colMatch = rawMessage.match(/Column '([^']+)' in [^ ]+ is ambiguous/i);
      const col = colMatch ? colMatch[1] : "specified";
      userFacingMessage = `Column '${col}' is ambiguous. It appears in multiple joined tables.`;
      hint = `Prefix the column with its table name or alias (e.g. 'e.${col}').`;
      break;
    }

    case 1055: { // ER_WRONG_FIELD_WITH_GROUP (ONLY_FULL_GROUP_BY)
      userFacingMessage = "Expression in SELECT violates MySQL ONLY_FULL_GROUP_BY rule.";
      hint = "In MySQL strict mode, every column in SELECT must either be listed in GROUP BY or enclosed in an aggregate function (e.g., SUM, COUNT, MAX).";
      break;
    }

    case 1048: { // ER_BAD_NULL_ERROR
      userFacingMessage = "Column cannot be null.";
      hint = "Check your INSERT or UPDATE statement for non-nullable columns.";
      break;
    }

    case 1062: { // ER_DUP_ENTRY
      userFacingMessage = "Duplicate entry violates a PRIMARY KEY or UNIQUE constraint.";
      hint = "Ensure all unique identifiers or key values are distinct.";
      break;
    }

    case 1451: // ER_ROW_IS_REFERENCED_2
    case 1452: { // ER_NO_REFERENCED_ROW_2
      userFacingMessage = "Foreign key constraint failure.";
      hint = "The referenced parent key does not exist, or child records prevent deletion.";
      break;
    }

    case 1305: { // ER_SP_DOES_NOT_EXIST
      const fnMatch = rawMessage.match(/FUNCTION ([^ ]+) does not exist/i);
      const fn = fnMatch ? fnMatch[1] : "specified";
      userFacingMessage = `Function '${fn}' does not exist in MySQL.`;
      hint = "Verify MySQL function names (e.g. IFNULL, CONCAT, DATE_FORMAT, TIMESTAMPDIFF).";
      break;
    }

    case 3024: // ER_QUERY_TIMEOUT
    case 1317: { // ER_QUERY_INTERRUPTED
      userFacingMessage = "Query execution timed out after 5.0 seconds.";
      hint = "Check for accidental CROSS JOINs or missing ON/WHERE conditions causing runaway executions.";
      break;
    }

    case 1142: // ER_TABLEACCESS_DENIED_ERROR
    case 1143: { // ER_COLUMNACCESS_DENIED_ERROR
      userFacingMessage = "Access denied for this operation or table.";
      hint = "The sandbox restricted user does not have permission for administrative commands or system databases.";
      break;
    }

    default: {
      if (rawMessage.includes("timeout") || rawMessage.includes("timed out")) {
        userFacingMessage = "Query execution timed out after 5.0 seconds.";
        hint = "Optimize JOIN conditions to prevent large intermediate cartesian products.";
      }
    }
  }

  // Sanitize hostnames, paths, and internal IPs
  const sanitizedMessage = userFacingMessage
    .replace(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/g, "localhost")
    .replace(/at\s+\/.*(?:\.js|\.ts):\d+:\d+/g, "")
    .replace(/Access denied for user '?[^'@]+'?@'?[^'\s]+'?/i, "Access denied")
    .trim();

  return {
    code: String(errno || sqlState || "MYSQL_ERROR"),
    sqlState,
    message: sanitizedMessage,
    hint,
    userFacingMessage: sanitizedMessage,
  };
}
