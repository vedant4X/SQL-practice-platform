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
  const currentUsed = session ? (await appStore.getUserQuestionState(session.userId, question.id)).hintsUsed : 0;
  const nextLevel = Math.min(3, currentUsed + 1);

  if (session) {
    await appStore.recordHintUsed(session.userId, question.id, nextLevel);
  }

  return successResponse({
    unlockedHintLevel: nextLevel,
    hintText: question.hints[nextLevel - 1],
    totalHints: question.hints.length,
    penaltyPercentage: nextLevel * 20,
  });
}
