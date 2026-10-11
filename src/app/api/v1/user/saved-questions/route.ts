import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { appStore } from "@/lib/db/store";
import { ALL_QUESTIONS } from "@/lib/curriculum/questions";
import { errorResponse, successResponse } from "@/lib/api/response";

const BookmarkSchema = z.object({
  questionId: z.string(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const bookmarkedIds = new Set(await appStore.getUserBookmarks(session.userId));
  const savedQuestions = ALL_QUESTIONS.filter((q) => bookmarkedIds.has(q.id)).map((q) => ({
    id: q.id,
    slug: q.slug,
    title: q.title,
    difficulty: q.difficulty,
    topicId: q.topic_id,
    xp: q.xp,
  }));

  return successResponse({ savedQuestions });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const body = await req.json();
  const parsed = BookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "questionId is required", 400);
  }

  const isBookmarked = await appStore.toggleBookmark(session.userId, parsed.data.questionId);
  return successResponse({ isBookmarked });
}
