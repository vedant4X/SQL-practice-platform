import { NextRequest } from "next/server";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { PostgresAdapter } from "@/lib/engine/adapters/postgres-adapter";
import { errorResponse, successResponse } from "@/lib/api/response";

const postgresAdapter = new PostgresAdapter();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const question = getQuestionBySlug(slug);
  if (!question) {
    return errorResponse("QUESTION_NOT_FOUND", "Question not found", 404);
  }

  try {
    const tables = await postgresAdapter.introspectSchema(question.database_id);
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
