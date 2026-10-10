import { Dialect } from "../engine/types";
import { appStore } from "../db/store";
import { getQuestionsByTopic, getQuestionBySlug } from "./questions";
import { TOPICS } from "./topics";

export interface TopicQuestionSummary {
  order: number;
  id: string;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  isSolved: boolean;
}

export interface TopicNavigationInfo {
  prevSlug: string | null;
  prevTitle: string | null;
  nextSlug: string | null;
  nextTitle: string | null;
  isFirstInTopic: boolean;
  isLastInTopic: boolean;
  topicSlug: string | null;
  topicTitle: string | null;
  nextTopicSlug: string | null;
  nextTopicTitle: string | null;
  currentIndex: number;
  totalInTopic: number;
  topicQuestions: TopicQuestionSummary[];
  solvedCount: number;
}

/**
 * Computes topic-scoped navigation for a given question slug and dialect.
 * "Next" and "Previous" strictly adhere to the ordering within the current topic.
 * If at the first question, isFirstInTopic = true.
 * If at the last question, isLastInTopic = true and nextTopic info is provided.
 */
export function getTopicNavigation(
  slug: string,
  dialect: Dialect = "postgresql",
  userId?: string
): TopicNavigationInfo {
  const currentQuestion = getQuestionBySlug(slug, dialect);
  if (!currentQuestion) {
    return {
      prevSlug: null,
      prevTitle: null,
      nextSlug: null,
      nextTitle: null,
      isFirstInTopic: false,
      isLastInTopic: false,
      topicSlug: null,
      topicTitle: null,
      nextTopicSlug: null,
      nextTopicTitle: null,
      currentIndex: -1,
      totalInTopic: 0,
      topicQuestions: [],
      solvedCount: 0,
    };
  }

  const topicId = currentQuestion.topic_id;
  const topic = TOPICS.find((t) => t.id === topicId);
  const topicQuestions = getQuestionsByTopic(topicId, dialect);

  const currentIndex = topicQuestions.findIndex((q) => q.slug === slug || q.id === currentQuestion.id);

  const prevQuestion = currentIndex > 0 ? topicQuestions[currentIndex - 1] : null;
  const nextQuestion =
    currentIndex >= 0 && currentIndex < topicQuestions.length - 1
      ? topicQuestions[currentIndex + 1]
      : null;

  const isFirstInTopic = currentIndex <= 0;
  const isLastInTopic = currentIndex >= 0 && currentIndex === topicQuestions.length - 1;

  // Find next topic if at the end of the current topic
  let nextTopicSlug: string | null = null;
  let nextTopicTitle: string | null = null;

  if (isLastInTopic && topic) {
    const currentTopicIdx = TOPICS.findIndex((t) => t.id === topic.id);
    if (currentTopicIdx >= 0 && currentTopicIdx < TOPICS.length - 1) {
      const nextTopic = TOPICS[currentTopicIdx + 1];
      nextTopicSlug = nextTopic.slug;
      nextTopicTitle = nextTopic.title;
    }
  }

  const mappedQuestions: TopicQuestionSummary[] = topicQuestions.map((q, idx) => {
    const isSolved = userId
      ? appStore.getUserQuestionState(userId, q.id, dialect)?.isSolved || false
      : false;
    return {
      order: idx + 1,
      id: q.id,
      slug: q.slug,
      title: q.title,
      difficulty: q.difficulty,
      isSolved,
    };
  });

  const solvedCount = mappedQuestions.filter((q) => q.isSolved).length;

  return {
    prevSlug: prevQuestion ? prevQuestion.slug : null,
    prevTitle: prevQuestion ? prevQuestion.title : null,
    nextSlug: nextQuestion ? nextQuestion.slug : null,
    nextTitle: nextQuestion ? nextQuestion.title : null,
    isFirstInTopic,
    isLastInTopic,
    topicSlug: topic ? topic.slug : null,
    topicTitle: topic ? topic.title : null,
    nextTopicSlug,
    nextTopicTitle,
    currentIndex: currentIndex >= 0 ? currentIndex + 1 : 1,
    totalInTopic: topicQuestions.length,
    topicQuestions: mappedQuestions,
    solvedCount,
  };
}
