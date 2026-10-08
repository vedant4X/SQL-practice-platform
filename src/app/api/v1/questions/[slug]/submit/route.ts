import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { evaluateSubmission } from "@/lib/engine/evaluator";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

const SubmitSchema = z.object({
  query: z.string().optional(),
  sql: z.string().optional(),
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
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message, 400);
    }

    const query = parsed.data.sql || parsed.data.query || "";

    // Evaluate against all test cases (visible + hidden)
    const evaluation = await evaluateSubmission(question, query);

    let xpEarned = 0;
    let totalXp = 0;

    const session = await getSessionFromRequest(req);
    if (session) {
      const submissionResult = appStore.recordSubmission({
        userId: session.userId,
        questionId: question.id,
        queryText: query,
        verdict: evaluation.verdict,
        executionTimeMs: evaluation.overallExecutionTimeMs,
        passedCount: evaluation.passedCount,
        totalCount: evaluation.totalCount,
        baseXp: question.xp,
        errorMessage: evaluation.error,
      });

      xpEarned = submissionResult.xpEarned;
      totalXp = appStore.getUserXp(session.userId);
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
