import fs from "fs";
import path from "path";
import { ALL_QUESTIONS } from "../src/lib/curriculum/questions";
import { TopicQuestionsSchema } from "../src/lib/curriculum/schema";
import { TOPICS } from "../src/lib/curriculum/topics";

const CONTENT_DIR = path.resolve(process.cwd(), "content", "questions");
const PG_DIR = path.join(CONTENT_DIR, "postgresql");
const MYSQL_DIR = path.join(CONTENT_DIR, "mysql");

fs.mkdirSync(PG_DIR, { recursive: true });
fs.mkdirSync(MYSQL_DIR, { recursive: true });

console.log(`Migrating ${ALL_QUESTIONS.length} PostgreSQL questions across ${TOPICS.length} topics...`);

const questionsByTopic = new Map<string, any[]>();
for (const q of ALL_QUESTIONS) {
  const list = questionsByTopic.get(q.topic_id) || [];
  list.push({
    ...q,
    dialect: "postgresql",
    alternative_solutions: q.alternative_solutions || [],
    common_mistakes: q.common_mistakes || [],
    dialect_notes: q.dialect_notes || "",
  });
  questionsByTopic.set(q.topic_id, list);
}

let totalMigrated = 0;
for (const topic of TOPICS) {
  const topicQuestions = questionsByTopic.get(topic.id) || [];
  // Validate with Zod
  const validated = TopicQuestionsSchema.parse(topicQuestions);
  const filePath = path.join(PG_DIR, `${topic.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(validated, null, 2), "utf-8");
  totalMigrated += validated.length;
}

console.log(`Successfully migrated ${totalMigrated} questions into ${TOPICS.length} files in ${PG_DIR}`);
