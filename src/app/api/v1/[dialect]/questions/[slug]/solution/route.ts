import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

export async function POST(
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

  const session = await getSessionFromRequest(req);
  if (session) {
    appStore.recordSolutionViewed(session.userId, question.id, dialect);
  }

  return successResponse({
    solutionQuery: question.solution_query,
    solutionExplanation: question.solution_explanation,
    alternativeSolutions: question.alternative_solutions || [],
    commonMistakes: question.common_mistakes || [],
    interviewTip: question.interview_tip || null,
    dialectNotes: question.dialect_notes || null,
    xpForfeited: true,
  });
}
