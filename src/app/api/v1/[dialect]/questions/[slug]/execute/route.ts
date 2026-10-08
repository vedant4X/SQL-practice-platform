import { NextRequest } from "next/server";
import { z } from "zod";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { getDialectAdapter } from "@/lib/engine/adapters";
import { errorResponse, successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

const ExecuteSchema = z.object({
  query: z.string().optional(),
  sql: z.string().optional(),
  includeExplain: z.boolean().optional(),
}).refine((d) => !!(d.query || d.sql), {
  message: "Query cannot be empty",
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dialect: string; slug: string }> }
) {
  try {
    const { dialect: rawDialect, slug } = await params;
    const parsedDialect = parseDialect(rawDialect);
    if ("error" in parsedDialect) return parsedDialect.error;
    const { dialect } = parsedDialect;

    const question = getQuestionBySlug(slug, dialect);
    if (!question) {
      return errorResponse("QUESTION_NOT_FOUND", `Question '${slug}' not found for dialect '${dialect}'`, 404);
    }

    const body = await req.json();
    const parsed = ExecuteSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const sqlToRun = parsed.data.sql || parsed.data.query || "";
    const { includeExplain } = parsed.data;

    const adapter = getDialectAdapter(dialect);
    const result = await adapter.execute({
      databaseId: question.database_id,
      query: sqlToRun,
      variant: "sample",
      options: {
        questionType: question.question_type || "select",
        includeExplain,
        availableTables: question.tables_involved,
      },
    });

    return successResponse({ result });
  } catch (err: any) {
    return errorResponse("EXECUTION_ERROR", err.message || "Execution failed", 500);
  }
}
