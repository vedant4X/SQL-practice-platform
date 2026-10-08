import { ComparisonConfig } from "./types";

export interface ComparisonResult {
  passed: boolean;
  feedback?: string;
  columnCountMatch: boolean;
  rowCountMatch: boolean;
  orderMatch?: boolean;
}

const DEFAULT_FLOAT_TOLERANCE = 1e-6;

/**
 * Normalizes values for comparison (floats within tolerance, NULL equality, dates)
 */
export function normalizeValue(val: unknown, floatTolerance = DEFAULT_FLOAT_TOLERANCE): string {
  if (val === null || val === undefined) {
    return "__SQL_NULL__";
  }

  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }

  if (typeof val === "number") {
    // Round to precision to avoid floating point discrepancies
    const rounded = Math.round(val / floatTolerance) * floatTolerance;
    return Number(rounded.toFixed(6)).toString();
  }

  if (val instanceof Date) {
    return val.toISOString();
  }

  const str = String(val).trim();
  // Check if string can be parsed as a float
  const parsedNum = Number(str);
  if (!isNaN(parsedNum) && str !== "") {
    const rounded = Math.round(parsedNum / floatTolerance) * floatTolerance;
    return Number(rounded.toFixed(6)).toString();
  }

  return str;
}

/**
 * Serializes a row into a deterministic canonical string key
 */
function serializeRow(row: Record<string, unknown>, keys: string[], floatTolerance: number): string {
  return keys
    .map((k) => normalizeValue(row[k], floatTolerance))
    .join(" | ");
}

/**
 * Compares user execution results with reference solution results
 */
export function compareResults(
  userRows: Record<string, unknown>[],
  userColumns: string[],
  expectedRows: Record<string, unknown>[],
  expectedColumns: string[],
  config: ComparisonConfig = {}
): ComparisonResult {
  const orderMatters = config.order_matters ?? false;
  const compareColumnNames = config.compare_column_names ?? false;
  const floatTolerance = config.float_tolerance ?? DEFAULT_FLOAT_TOLERANCE;

  // 1. Column count verification
  if (userColumns.length !== expectedColumns.length) {
    return {
      passed: false,
      columnCountMatch: false,
      rowCountMatch: userRows.length === expectedRows.length,
      feedback: `Column count mismatch: expected ${expectedColumns.length} column(s), but your query returned ${userColumns.length} column(s).`,
    };
  }

  // 2. Optional Column name verification (case-insensitive)
  if (compareColumnNames) {
    for (let i = 0; i < expectedColumns.length; i++) {
      if (userColumns[i].toLowerCase() !== expectedColumns[i].toLowerCase()) {
        return {
          passed: false,
          columnCountMatch: false,
          rowCountMatch: userRows.length === expectedRows.length,
          feedback: `Column alias mismatch at position ${i + 1}: expected '${expectedColumns[i]}', found '${userColumns[i]}'.`,
        };
      }
    }
  }

  // 3. Row count verification
  if (userRows.length !== expectedRows.length) {
    return {
      passed: false,
      columnCountMatch: true,
      rowCountMatch: false,
      feedback: `Row count mismatch: expected ${expectedRows.length} row(s), but your query returned ${userRows.length} row(s).`,
    };
  }

  // Handle empty result sets
  if (userRows.length === 0 && expectedRows.length === 0) {
    return {
      passed: true,
      columnCountMatch: true,
      rowCountMatch: true,
      orderMatch: true,
    };
  }

  // 4. Row contents comparison
  // Map row objects using column indices rather than column names in case user used different aliases
  const userSerialized = userRows.map((r) =>
    userColumns.map((col) => normalizeValue(r[col], floatTolerance)).join(" | ")
  );
  const expectedSerialized = expectedRows.map((r) =>
    expectedColumns.map((col) => normalizeValue(r[col], floatTolerance)).join(" | ")
  );

  // If order matters, compare row by row directly
  if (orderMatters) {
    for (let i = 0; i < expectedSerialized.length; i++) {
      if (userSerialized[i] !== expectedSerialized[i]) {
        // Check if rows exist in a different order
        const userSet = new Set(userSerialized);
        const allPresent = expectedSerialized.every((exp) => userSet.has(exp));

        if (allPresent) {
          return {
            passed: false,
            columnCountMatch: true,
            rowCountMatch: true,
            orderMatch: false,
            feedback: "Order mismatch: The result contains the correct rows, but they are not in the required sort order.",
          };
        }

        return {
          passed: false,
          columnCountMatch: true,
          rowCountMatch: true,
          orderMatch: false,
          feedback: `Value mismatch at row ${i + 1}: returned values do not match the expected result.`,
        };
      }
    }

    return {
      passed: true,
      columnCountMatch: true,
      rowCountMatch: true,
      orderMatch: true,
    };
  }

  // Multiset comparison (unordered with duplicates preserved)
  const expectedCounts = new Map<string, number>();
  for (const rowKey of expectedSerialized) {
    expectedCounts.set(rowKey, (expectedCounts.get(rowKey) || 0) + 1);
  }

  const userCounts = new Map<string, number>();
  for (const rowKey of userSerialized) {
    userCounts.set(rowKey, (userCounts.get(rowKey) || 0) + 1);
  }

  if (expectedCounts.size !== userCounts.size) {
    return {
      passed: false,
      columnCountMatch: true,
      rowCountMatch: true,
      feedback: `Row values mismatch: expected distinct row patterns do not match your query's output.`,
    };
  }

  for (const [key, count] of expectedCounts.entries()) {
    if (userCounts.get(key) !== count) {
      return {
        passed: false,
        columnCountMatch: true,
        rowCountMatch: true,
        feedback: `Value mismatch: returned rows do not match expected records or frequency.`,
      };
    }
  }

  return {
    passed: true,
    columnCountMatch: true,
    rowCountMatch: true,
  };
}
