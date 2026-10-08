import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { executeInSandbox } from "@/lib/engine/sandbox-runner";
import { errorResponse, successResponse } from "@/lib/api/response";

const ExecuteSchema = z.object({
  query: z.string().optional(),
  sql: z.string().optional(),
  includeExplain: z.boolean().optional(),
}).refine((d) => !!(d.query || d.sql), {
  message: "Query cannot be empty",
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const question = getQuestionBySlug(slug);
    if (!question) {
      return errorResponse("QUESTION_NOT_FOUND", "Question not found", 404);
    }

    const body = await req.json();
    const parsed = ExecuteSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const sqlToRun = parsed.data.sql || parsed.data.query || "";
    const { includeExplain } = parsed.data;

    // Execute in sandbox against visible sample dataset
    const result = await executeInSandbox(
      question.database_id,
      sqlToRun,
      "sample",
      {
        questionType: question.question_type || "select",
        includeExplain,
        availableTables: question.tables_involved,
      }
    );

    return successResponse({ result });
  } catch (err: any) {
    return errorResponse("EXECUTION_ERROR", err.message || "Execution failed", 500);
  }
}
