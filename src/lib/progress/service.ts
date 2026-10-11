import { appStore } from "../db/store";
import { TOPICS } from "../curriculum/topics";
import { getAllQuestions, getQuestionsByTopic } from "../curriculum/questions";
import { Dialect } from "../engine/types";

export interface UserStats {
  userId: string;
  dialect: Dialect;
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  solvedCount: number;
  totalQuestions: number;
  accuracyPercentage: number;
  streakDays: number;
  topicProgress: TopicProgress[];
  recommendedQuestion?: {
    questionId: string;
    slug: string;
    title: string;
    difficulty: string;
    topicTitle: string;
    reason: string;
  };
}

export interface TopicProgress {
  topicId: string;
  title: string;
  level: number;
  solvedCount: number;
  totalCount: number;
  progressPercentage: number;
  isMastered: boolean;
}

/**
 * Calculates current level based on total XP: level = floor(sqrt(totalXP / 50)) + 1
 */
export function calculateLevel(totalXp: number): { level: number; xpToNextLevel: number } {
  const level = Math.floor(Math.sqrt(totalXp / 50)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 50;
  const xpToNextLevel = Math.max(0, nextLevelXp - totalXp);
  return { level, xpToNextLevel };
}

/**
 * Computes full user dashboard progression statistics and explainable recommendations for a dialect
 */
export async function getUserProgressStats(
  userId: string,
  dialect: Dialect = "postgresql"
): Promise<UserStats> {
  const totalXp = await appStore.getUserXp(userId, dialect);
  const { level, xpToNextLevel } = calculateLevel(totalXp);
  const solvedQuestionIds = new Set(await appStore.getUserSolvedQuestions(userId, dialect));
  const accuracyPercentage = await appStore.getUserAccuracy(userId, dialect);
  const allDialectQuestions = getAllQuestions(dialect);

  // Topic mastery calculations
  const topicProgress: TopicProgress[] = TOPICS.map((topic) => {
    const questions = getQuestionsByTopic(topic.id, dialect);
    const solvedInTopic = questions.filter((q) => solvedQuestionIds.has(q.id)).length;
    const progressPercentage =
      questions.length > 0 ? Math.round((solvedInTopic / questions.length) * 100) : 0;
    const isMastered = progressPercentage >= 80 && questions.length > 0;

    return {
      topicId: topic.id,
      title: topic.title,
      level: topic.level,
      solvedCount: solvedInTopic,
      totalCount: questions.length,
      progressPercentage,
      isMastered,
    };
  });

  // Recommendation engine: explainable, rules-based
  let recommendedQuestion: UserStats["recommendedQuestion"] = undefined;

  // 1. Check for weak topic (attempts on topic with low accuracy)
  const weakTopic = topicProgress.find((tp) => tp.totalCount > 0 && tp.solvedCount < tp.totalCount);
  if (weakTopic) {
    const uncompleted = getQuestionsByTopic(weakTopic.topicId, dialect).find(
      (q) => !solvedQuestionIds.has(q.id)
    );
    if (uncompleted) {
      recommendedQuestion = {
        questionId: uncompleted.id,
        slug: uncompleted.slug,
        title: uncompleted.title,
        difficulty: uncompleted.difficulty,
        topicTitle: weakTopic.title,
        reason: `Recommended next step in ${weakTopic.title} (Level ${weakTopic.level})`,
      };
    }
  }

  if (!recommendedQuestion) {
    const firstUnsolved = allDialectQuestions.find((q) => !solvedQuestionIds.has(q.id));
    if (firstUnsolved) {
      const topic = TOPICS.find((t) => t.id === firstUnsolved.topic_id);
      recommendedQuestion = {
        questionId: firstUnsolved.id,
        slug: firstUnsolved.slug,
        title: firstUnsolved.title,
        difficulty: firstUnsolved.difficulty,
        topicTitle: topic ? topic.title : "Recommended",
        reason: "Next recommended question in the curriculum track",
      };
    }
  }

  const totalSolved = solvedQuestionIds.size;

  return {
    userId,
    dialect,
    totalXp,
    level,
    xpToNextLevel,
    solvedCount: totalSolved,
    totalQuestions: allDialectQuestions.length,
    accuracyPercentage,
    streakDays: totalSolved > 0 ? 1 : 0,
    topicProgress,
    recommendedQuestion,
  };
}
