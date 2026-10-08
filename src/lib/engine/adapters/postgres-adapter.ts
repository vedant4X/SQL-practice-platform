import { DialectAdapter, ExecutionRequest, QueryExecutionResult, QuestionType, TableSchema, ValidationResult, ErrorDetail } from "../types";
import { executeInSandbox, createIsolatedSandbox } from "../sandbox-runner";
import { validateQuery } from "../statement-validator";
import { translatePostgresError } from "../error-translator";
import { normalizeValue } from "../result-comparator";
import { getOrCreatePlaygroundDb, resetPlaygroundDb } from "../playground-db";

const schemaCache = new Map<string, TableSchema[]>();

export class PostgresAdapter implements DialectAdapter {
  readonly id = "postgresql" as const;
  readonly displayName = "PostgreSQL 16";
  readonly monacoLanguage = "pgsql";
  readonly formatterLanguage = "postgresql" as const;

  validateStatement(sql: string, questionType?: QuestionType): ValidationResult {
    return validateQuery(sql, questionType);
  }

  async execute(request: ExecutionRequest): Promise<QueryExecutionResult> {
    return executeInSandbox(
      request.databaseId,
      request.query,
      request.variant || "sample",
      request.options
    );
  }

  translateError(rawError: unknown, schemaInfo?: unknown): ErrorDetail {
    const availableTables = Array.isArray(schemaInfo) ? (schemaInfo as string[]) : undefined;
    return translatePostgresError(rawError, undefined, availableTables);
  }

  normalizeValue(value: unknown, columnType?: string): unknown {
    return normalizeValue(value);
  }

  async introspectSchema(databaseId: string): Promise<TableSchema[]> {
    if (schemaCache.has(databaseId)) {
      return schemaCache.get(databaseId)!;
    }

    let db = null;
    try {
      db = await createIsolatedSandbox(databaseId, "sample");

      const tablesRes = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      const tableNames = (tablesRes.rows as any[]).map((r) => r.table_name);

      const tablesData: TableSchema[] = [];

      for (const tableName of tableNames) {
        const colsRes = await db.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `);

        const previewRes = await db.query(`SELECT * FROM "${tableName}" LIMIT 10;`);

        tablesData.push({
          tableName,
          columns: colsRes.rows.map((c: any) => ({
            name: c.column_name,
            type: c.data_type,
            nullable: c.is_nullable === "YES",
            isPrimaryKey:
              c.column_name.endsWith("_id") &&
              c.column_name.toLowerCase().includes(tableName.toLowerCase().slice(0, -1)),
          })),
          rowCount: (previewRes.rows || []).length,
          sampleRows: (previewRes.rows || []) as Record<string, unknown>[],
        });
      }

      schemaCache.set(databaseId, tablesData);
      return tablesData;
    } finally {
      if (db) {
        try {
          await db.close();
        } catch {}
      }
    }
  }

  async provisionPlaygroundSchema(sessionId: string): Promise<void> {
    await getOrCreatePlaygroundDb(sessionId);
  }

  async resetPlayground(sessionId: string): Promise<void> {
    resetPlaygroundDb(sessionId);
  }

  async explain(sql: string): Promise<unknown> {
    const res = await executeInSandbox("employeedb", sql, "sample", {
      includeExplain: true,
      questionType: "select",
    });
    return res.explainPlan;
  }
}
