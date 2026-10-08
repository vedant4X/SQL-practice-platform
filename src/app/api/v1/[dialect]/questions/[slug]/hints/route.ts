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
  const currentUsed = session
    ? appStore.getUserQuestionState(session.userId, question.id, dialect).hintsUsed
    : 0;
  const nextLevel = Math.min(3, currentUsed + 1);

  if (session) {
    appStore.recordHintUsed(session.userId, question.id, nextLevel, dialect);
  }

  return successResponse({
    unlockedHintLevel: nextLevel,
    hintText: question.hints[nextLevel - 1],
    totalHints: question.hints.length,
    penaltyPercentage: nextLevel * 20,
  });
}
