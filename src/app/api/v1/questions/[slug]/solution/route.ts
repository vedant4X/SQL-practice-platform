import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const question = getQuestionBySlug(slug);
  if (!question) {
    return errorResponse("QUESTION_NOT_FOUND", "Question not found", 404);
  }

  const session = await getSessionFromRequest(req);
  if (session) {
    await appStore.recordSolutionViewed(session.userId, question.id);
  }

  return successResponse({
    solutionQuery: question.solution_query,
    solutionExplanation: question.solution_explanation,
    alternativeSolutions: question.alternative_solutions || [],
    commonMistakes: question.common_mistakes || [],
    interviewTip: question.interview_tip || null,
    xpForfeited: true,
  });
}
