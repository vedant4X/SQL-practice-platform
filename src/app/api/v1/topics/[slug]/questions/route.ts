import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { TOPICS } from "@/lib/curriculum/topics";
import { getQuestionsByTopic } from "@/lib/curriculum/questions";
import { appStore } from "@/lib/db/store";
import { errorResponse, successResponse } from "@/lib/api/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const topic = TOPICS.find((t) => t.slug === slug || t.id === slug);
  if (!topic) {
    return errorResponse("TOPIC_NOT_FOUND", "Topic not found", 404);
  }

  const session = await getSessionFromRequest(req);
  const solvedSet = session
    ? new Set(appStore.getUserSolvedQuestions(session.userId))
    : new Set<string>();
  const bookmarksSet = session
    ? new Set(appStore.getUserBookmarks(session.userId))
    : new Set<string>();

  const questions = getQuestionsByTopic(topic.id).map((q) => ({
    id: q.id,
    slug: q.slug,
    title: q.title,
    difficulty: q.difficulty,
    estimatedMinutes: q.estimated_minutes,
    xp: q.xp,
    tags: q.tags,
    databaseId: q.database_id,
    isSolved: solvedSet.has(q.id),
    isBookmarked: bookmarksSet.has(q.id),
  }));

  return successResponse({
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
