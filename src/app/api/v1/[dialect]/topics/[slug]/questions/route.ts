import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { TOPICS } from "@/lib/curriculum/topics";
import { getQuestionsByTopic } from "@/lib/curriculum/questions";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dialect: string; slug: string }> }
) {
  const { dialect: rawDialect, slug } = await params;
  const parsed = parseDialect(rawDialect);
  if ("error" in parsed) return parsed.error;
  const { dialect } = parsed;

  const topic = TOPICS.find((t) => t.slug === slug || t.id === slug);
  if (!topic) {
    return errorResponse("TOPIC_NOT_FOUND", "Topic not found", 404);
  }

  const session = await getSessionFromRequest(req);
  const solvedSet = session
    ? new Set(appStore.getUserSolvedQuestions(session.userId, dialect))
    : new Set<string>();
  const bookmarksSet = session
    ? new Set(appStore.getUserBookmarks(session.userId, dialect))
    : new Set<string>();

  const questions = getQuestionsByTopic(topic.id, dialect).map((q, idx) => ({
    order: idx + 1,
    id: q.id,
    slug: q.slug,
    title: q.title,
    difficulty: q.difficulty,
    estimatedMinutes: q.estimated_minutes,
    xp: q.xp,
    tags: q.tags,
    databaseId: q.database_id,
    dialect: q.dialect,
    isSolved: solvedSet.has(q.id),
    isBookmarked: bookmarksSet.has(q.id),
  }));

  return successResponse({
    dialect,
    topic: {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      level: topic.level,
      description: topic.description,
    },
    questions,
  });
}
