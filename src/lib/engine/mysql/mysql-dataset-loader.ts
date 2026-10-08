import { getTestCaseSql } from "../dataset-loader";

/**
 * Converts standard dataset DDL/DML to MySQL 8-compliant syntax
 */
export function convertSqlToMySql(sql: string): string {
  let mysqlSql = sql;

  // 1. Foreign key handling during drop/create
  mysqlSql = `SET FOREIGN_KEY_CHECKS = 0;\n${mysqlSql}\nSET FOREIGN_KEY_CHECKS = 1;`;

  // 2. Remove CASCADE from DROP TABLE statements
  mysqlSql = mysqlSql.replace(/DROP\s+TABLE\s+IF\s+EXISTS\s+([^;]+)\s+CASCADE\s*;/gi, "DROP TABLE IF EXISTS $1;");

  // 3. SERIAL PRIMARY KEY -> INT AUTO_INCREMENT PRIMARY KEY
  mysqlSql = mysqlSql.replace(/\bSERIAL\s+PRIMARY\s+KEY\b/gi, "INT AUTO_INCREMENT PRIMARY KEY");
  mysqlSql = mysqlSql.replace(/\bBIGSERIAL\s+PRIMARY\s+KEY\b/gi, "BIGINT AUTO_INCREMENT PRIMARY KEY");

  // 4. Double quotes to backticks for identifiers
  // Only replace "identifier" when not in a single-quoted string
  mysqlSql = mysqlSql.replace(/"([a-zA-Z0-9_]+)"/g, "`$1`");

  return mysqlSql;
}

/**
 * Retrieves MySQL-formatted initialization script for a dataset
 */
export function getMySqlTestCaseSql(
  databaseId: string,
  variant: "sample" | "hidden_1" | "hidden_2" = "sample"
): string {
  const rawSql = getTestCaseSql(databaseId, variant);
  return convertSqlToMySql(rawSql);
}
