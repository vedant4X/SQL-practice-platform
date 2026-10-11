import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { evaluateSubmission } from "@/lib/engine/evaluator";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

const SubmitSchema = z.object({
  query: z.string().optional(),
  sql: z.string().optional(),
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
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const query = parsed.data.sql || parsed.data.query || "";

    // Evaluate against all test cases (visible + hidden) on real dialect engine
    const evaluation = await evaluateSubmission(question, query);

    let xpEarned = 0;
    let totalXp = 0;

    const session = await getSessionFromRequest(req);
    if (session) {
      const submissionResult = await appStore.recordSubmission({
        userId: session.userId,
        questionId: question.id,
        dialect,
        queryText: query,
        verdict: evaluation.verdict,
        executionTimeMs: evaluation.overallExecutionTimeMs,
        passedCount: evaluation.passedCount,
        totalCount: evaluation.totalCount,
        baseXp: question.xp,
        errorMessage: evaluation.error,
      });

      xpEarned = submissionResult.xpEarned;
      totalXp = await appStore.getUserXp(session.userId, dialect);
    }

    return successResponse({
      verdict: evaluation.verdict,
      passedCount: evaluation.passedCount,
      totalCount: evaluation.totalCount,
      overallExecutionTimeMs: evaluation.overallExecutionTimeMs,
      testCaseResults: evaluation.testCaseResults,
      xpEarned,
      totalXp,
      error: evaluation.error,
    });
  } catch (err: any) {
    return errorResponse("SUBMISSION_ERROR", err.message || "Submission failed", 500);
  }
}
