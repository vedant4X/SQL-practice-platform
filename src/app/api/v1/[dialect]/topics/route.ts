import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { TOPICS } from "@/lib/curriculum/topics";
import { getQuestionsByTopic } from "@/lib/curriculum/questions";
import { appStore } from "@/lib/db/store";
import { successResponse } from "@/lib/api/response";
import { parseDialect } from "@/lib/api/dialect";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dialect: string }> }
) {
  const { dialect: rawDialect } = await params;
  const parsed = parseDialect(rawDialect);
  if ("error" in parsed) return parsed.error;
  const { dialect } = parsed;

  const session = await getSessionFromRequest(req);
  const solvedSet = session
    ? new Set(await appStore.getUserSolvedQuestions(session.userId, dialect))
    : new Set<string>();

  const topicsWithMeta = TOPICS.map((topic) => {
    const questions = getQuestionsByTopic(topic.id, dialect);
    const solvedCount = questions.filter((q) => solvedSet.has(q.id)).length;
    const firstUnsolved = questions.find((q) => !solvedSet.has(q.id)) || questions[0];

    return {
      id: topic.id,
      level: topic.level,
      title: topic.title,
      slug: topic.slug,
      description: topic.description,
      icon: topic.icon,
      orderIndex: topic.orderIndex,
      subtopics: topic.subtopics,
      questionCount: questions.length,
      solvedCount,
      isMastered: questions.length > 0 && solvedCount / questions.length >= 0.8,
      firstQuestionSlug: firstUnsolved ? firstUnsolved.slug : null,
    };
  });

  return successResponse({ dialect, topics: topicsWithMeta });
}
