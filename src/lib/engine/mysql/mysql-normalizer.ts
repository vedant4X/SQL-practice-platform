const DEFAULT_FLOAT_TOLERANCE = 1e-6;

/**
 * Normalizes MySQL result values for deterministic comparison with expected solutions
 */
export function normalizeMySqlValue(
  val: unknown,
  columnType?: string,
  floatTolerance = DEFAULT_FLOAT_TOLERANCE
): string {
  if (val === null || val === undefined) {
    return "__SQL_NULL__";
  }

  // Handle boolean / TINYINT(1) mapping
  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }

  // If column type is tinyint(1), normalize 1/0 to true/false
  if (columnType && columnType.toLowerCase().includes("tinyint(1)")) {
    if (val === 1 || val === "1") return "true";
    if (val === 0 || val === "0") return "false";
  }

  // Handle numbers
  if (typeof val === "number") {
    const rounded = Math.round(val / floatTolerance) * floatTolerance;
    return Number(rounded.toFixed(6)).toString();
  }

  // Handle Date
  if (val instanceof Date) {
    return val.toISOString();
  }

  const str = String(val).trim();

  // Handle numeric strings (DECIMAL / BIGINT)
  const parsedNum = Number(str);
  if (!isNaN(parsedNum) && str !== "" && !str.includes(":") && !str.includes("-")) {
    const rounded = Math.round(parsedNum / floatTolerance) * floatTolerance;
    return Number(rounded.toFixed(6)).toString();
  }

  // Handle ISO-like dates or timestamp strings "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str)) {
    return str.replace(" ", "T");
  }

  return str;
}
