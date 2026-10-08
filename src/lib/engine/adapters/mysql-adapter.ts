import { DialectAdapter, ExecutionRequest, QueryExecutionResult, QuestionType, TableSchema, ValidationResult, ErrorDetail } from "../types";
import { executeInMySqlSandbox, ensureSharedMySqlDb } from "../mysql/mysql-sandbox-runner";
import { validateMySqlQuery } from "../mysql/mysql-statement-validator";
import { translateMySqlError } from "../mysql/mysql-error-translator";
import { normalizeMySqlValue } from "../mysql/mysql-normalizer";
import { ensurePlaygroundDb, resetPlaygroundDb } from "../mysql/mysql-playground-db";
import { getRoPool } from "../mysql/mysql-connection";

const mysqlSchemaCache = new Map<string, TableSchema[]>();

export class MySqlAdapter implements DialectAdapter {
  readonly id = "mysql" as const;
  readonly displayName = "MySQL 8.4";
  readonly monacoLanguage = "mysql";
  readonly formatterLanguage = "mysql" as const;

  validateStatement(sql: string, questionType?: QuestionType): ValidationResult {
    return validateMySqlQuery(sql, questionType);
  }

  async execute(request: ExecutionRequest): Promise<QueryExecutionResult> {
    return executeInMySqlSandbox(
      request.databaseId,
      request.query,
      request.variant || "sample",
      request.options
    );
  }

  translateError(rawError: unknown, schemaInfo?: unknown): ErrorDetail {
    const availableTables = Array.isArray(schemaInfo) ? (schemaInfo as string[]) : undefined;
    return translateMySqlError(rawError, undefined, availableTables);
  }

  normalizeValue(value: unknown, columnType?: string): unknown {
    return normalizeMySqlValue(value, columnType);
  }

  async introspectSchema(databaseId: string): Promise<TableSchema[]> {
    if (mysqlSchemaCache.has(databaseId)) {
      return mysqlSchemaCache.get(databaseId)!;
    }

    const dbName = await ensureSharedMySqlDb(databaseId, "sample");
    const pool = getRoPool();
    const conn = await pool.getConnection();

    try {
      await conn.query(`USE \`${dbName}\`;`);

      const [tablesRows] = await conn.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ? 
        ORDER BY table_name;
      `, [dbName]);

      const tableNames = (tablesRows as any[]).map((r) => r.TABLE_NAME || r.table_name);
      const tablesData: TableSchema[] = [];

      for (const tableName of tableNames) {
        const [colsRows] = await conn.query(`
          SELECT column_name, data_type, is_nullable, column_key
          FROM information_schema.columns
          WHERE table_schema = ? AND table_name = ?
          ORDER BY ordinal_position;
        `, [dbName, tableName]);

        const [previewRows] = await conn.query(`SELECT * FROM \`${tableName}\` LIMIT 10;`);

        tablesData.push({
          tableName,
          columns: (colsRows as any[]).map((c) => ({
            name: c.COLUMN_NAME || c.column_name,
            type: c.DATA_TYPE || c.data_type,
            nullable: (c.IS_NULLABLE || c.is_nullable) === "YES",
            isPrimaryKey: (c.COLUMN_KEY || c.column_key) === "PRI",
          })),
          rowCount: (previewRows as any[]).length,
          sampleRows: (previewRows as any[]) as Record<string, unknown>[],
        });
      }

      mysqlSchemaCache.set(databaseId, tablesData);
      return tablesData;
    } finally {
      conn.release();
    }
  }

  async provisionPlaygroundSchema(sessionId: string): Promise<void> {
    await ensurePlaygroundDb(sessionId);
  }

  async resetPlayground(sessionId: string): Promise<void> {
    await resetPlaygroundDb(sessionId);
  }

  async explain(sql: string): Promise<unknown> {
    const res = await executeInMySqlSandbox("employeedb", sql, "sample", {
      includeExplain: true,
      questionType: "select",
    });
    return res.explainPlan;
  }
}
