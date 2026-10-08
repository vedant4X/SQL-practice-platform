import fs from "fs";
import path from "path";
import { Dialect, Difficulty, QuestionMetadata, QuestionStatus } from "../../engine/types";
import { TopicQuestionsSchema } from "../schema";

export interface QuestionSummary {
  id: string;
  slug: string;
  title: string;
  topic_id: string;
  subtopic_id: string;
  difficulty: Difficulty;
  dialect: Dialect;
  xp: number;
  estimated_minutes: number;
  status: QuestionStatus;
}

const CONTENT_DIR = path.resolve(process.cwd(), "content", "questions");

// Cache storage per dialect
class QuestionBank {
  private dialectLoaded: Record<Dialect, boolean> = {
    postgresql: false,
    mysql: false,
  };

  private questionsByDialect: Record<Dialect, QuestionMetadata[]> = {
    postgresql: [],
    mysql: [],
  };

  private byId: Record<Dialect, Map<string, QuestionMetadata>> = {
    postgresql: new Map(),
    mysql: new Map(),
  };

  private bySlug: Record<Dialect, Map<string, QuestionMetadata>> = {
    postgresql: new Map(),
    mysql: new Map(),
  };

  private byTopic: Record<Dialect, Map<string, QuestionMetadata[]>> = {
    postgresql: new Map(),
    mysql: new Map(),
  };

  private summaries: Record<Dialect, QuestionSummary[]> = {
    postgresql: [],
    mysql: [],
  };

  public loadDialect(dialect: Dialect): void {
    if (this.dialectLoaded[dialect]) return;

    const dir = path.join(CONTENT_DIR, dialect);
    const questions: QuestionMetadata[] = [];
    const idMap = new Map<string, QuestionMetadata>();
    const slugMap = new Map<string, QuestionMetadata>();
    const topicMap = new Map<string, QuestionMetadata[]>();
    const summaries: QuestionSummary[] = [];

    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(dir, file), "utf-8");
          const parsed = JSON.parse(content);
          const validated = TopicQuestionsSchema.parse(parsed) as QuestionMetadata[];

          for (const q of validated) {
            questions.push(q);
            idMap.set(q.id, q);
            slugMap.set(q.slug, q);

            const topicList = topicMap.get(q.topic_id) || [];
            topicList.push(q);
            topicMap.set(q.topic_id, topicList);

            summaries.push({
              id: q.id,
              slug: q.slug,
              title: q.title,
              topic_id: q.topic_id,
              subtopic_id: q.subtopic_id,
              difficulty: q.difficulty,
              dialect: q.dialect,
              xp: q.xp,
              estimated_minutes: q.estimated_minutes,
              status: q.status,
            });
          }
        } catch (err) {
          console.error(`Failed to load questions from ${file}:`, err);
        }
      }
    }

    this.questionsByDialect[dialect] = questions;
    this.byId[dialect] = idMap;
    this.bySlug[dialect] = slugMap;
    this.byTopic[dialect] = topicMap;
    this.summaries[dialect] = summaries;
    this.dialectLoaded[dialect] = true;
  }

  public getQuestions(dialect: Dialect = "postgresql"): QuestionMetadata[] {
    this.loadDialect(dialect);
    return this.questionsByDialect[dialect];
  }

  public getSummaries(dialect: Dialect = "postgresql"): QuestionSummary[] {
    this.loadDialect(dialect);
    return this.summaries[dialect];
  }

  public getById(id: string, dialect?: Dialect): QuestionMetadata | undefined {
    if (dialect) {
      this.loadDialect(dialect);
      return this.byId[dialect].get(id);
    }
    // Search postgresql first, then mysql
    this.loadDialect("postgresql");
    const pg = this.byId.postgresql.get(id);
    if (pg) return pg;
    this.loadDialect("mysql");
    return this.byId.mysql.get(id);
  }

  public getBySlug(slug: string, dialect?: Dialect): QuestionMetadata | undefined {
    if (dialect) {
      this.loadDialect(dialect);
      return this.bySlug[dialect].get(slug);
    }
    this.loadDialect("postgresql");
    const pg = this.bySlug.postgresql.get(slug);
    if (pg) return pg;
    this.loadDialect("mysql");
    return this.bySlug.mysql.get(slug);
  }

  public getByTopic(topicId: string, dialect: Dialect = "postgresql"): QuestionMetadata[] {
    this.loadDialect(dialect);
    return this.byTopic[dialect].get(topicId) || [];
  }
}

const bank = new QuestionBank();

// Backward-compatible exports
export const ALL_QUESTIONS: QuestionMetadata[] = bank.getQuestions("postgresql");

export function getAllQuestions(dialect: Dialect = "postgresql"): QuestionMetadata[] {
  return bank.getQuestions(dialect);
}

export function getQuestionSummaries(dialect: Dialect = "postgresql"): QuestionSummary[] {
  return bank.getSummaries(dialect);
}

export function getQuestionById(id: string, dialect?: Dialect): QuestionMetadata | undefined {
  return bank.getById(id, dialect);
}

export function getQuestionBySlug(slug: string, dialect?: Dialect): QuestionMetadata | undefined {
  return bank.getBySlug(slug, dialect);
}

export function getQuestionsByTopic(topicId: string, dialect: Dialect = "postgresql"): QuestionMetadata[] {
  return bank.getByTopic(topicId, dialect);
}
