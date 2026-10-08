import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/cookies";
import { getQuestionBySlug } from "@/lib/curriculum/questions";
import { TOPICS } from "@/lib/curriculum/topics";
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

  const question = getQuestionBySlug(slug, dialect);
  if (!question) {
    return errorResponse("QUESTION_NOT_FOUND", `Question '${slug}' not found for dialect '${dialect}'`, 404);
  }

  const session = await getSessionFromRequest(req);
  const qState = session ? appStore.getUserQuestionState(session.userId, question.id, dialect) : null;
  const isBookmarked = session
    ? appStore.getUserBookmarks(session.userId, dialect).includes(question.id)
    : false;

  const topic = TOPICS.find((t) => t.id === question.topic_id);

  const hintsRevealedCount = qState?.hintsUsed || 0;
  const availableHints = question.hints.slice(0, hintsRevealedCount);

  return successResponse({
    question: {
      id: question.id,
      slug: question.slug,
      title: question.title,
      descriptionMarkdown: question.description_markdown,
      topicId: question.topic_id,
      topicTitle: topic ? topic.title : "Curriculum",
      topicSlug: topic ? topic.slug : "",
      difficulty: question.difficulty,
      dialect: question.dialect,
      databaseId: question.database_id,
      tablesInvolved: question.tables_involved,
      expectedColumns: question.expected_columns,
      orderMatters: question.order_matters,
      starterQuery: question.starter_query,
      xp: question.xp,
      tags: question.tags,
      testCaseCount: question.test_cases.length,
      isSolved: qState?.isSolved || false,
      isBookmarked,
      hintsUsed: hintsRevealedCount,
      totalHints: question.hints.length,
      availableHints,
      solutionViewed: qState?.solutionViewed || false,
      solutionQuery: qState?.solutionViewed ? question.solution_query : null,
      solutionExplanation: qState?.solutionViewed ? question.solution_explanation : null,
      commonMistakes: qState?.solutionViewed ? question.common_mistakes : null,
      interviewTip: qState?.solutionViewed ? question.interview_tip : null,
      dialectNotes: question.dialect_notes,
    },
  });
}
