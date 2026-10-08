import { NextRequest } from "next/server";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { getDialectAdapter } from "@/lib/engine/adapters";
import { errorResponse, successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dialect: string; slug: string }> }
) {
  const { dialect: rawDialect, slug } = await params;
  const parsedDialect = parseDialect(rawDialect);
  if ("error" in parsedDialect) return parsedDialect.error;
  const { dialect } = parsedDialect;

  const question = getQuestionBySlug(slug, dialect);
  if (!question) {
    return errorResponse("QUESTION_NOT_FOUND", `Question '${slug}' not found for dialect '${dialect}'`, 404);
  }

  try {
    const adapter = getDialectAdapter(dialect);
    const tables = await adapter.introspectSchema(question.database_id);

    const tablesData = tables.map((t) => ({
      name: t.tableName,
      isRelevant: question.tables_involved.includes(t.tableName),
      columns: t.columns.map((c) => ({
        name: c.name,
        dataType: c.type,
        isNullable: c.nullable,
        isPk: c.isPrimaryKey,
      })),
      previewRows: t.sampleRows || [],
    }));

    return successResponse({
      databaseId: question.database_id,
      tables: tablesData,
    });
  } catch (err: any) {
    return errorResponse("SCHEMA_ERROR", err.message || "Failed to introspect schema", 500);
  }
}
