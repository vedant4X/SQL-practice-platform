import fs from "fs";
import path from "path";
import { TOPICS } from "../src/lib/curriculum/topics";
import { getAllQuestions } from "../src/lib/curriculum/questions";

interface TopicStat {
  topicId: string;
  topicTitle: string;
  level: number;
  pgCount: number;
  pgDiff: { easy: number; medium: number; hard: number; expert: number };
  mysqlCount: number;
  mysqlDiff: { easy: number; medium: number; hard: number; expert: number };
}

function generateReport(): string {
  const pgQuestions = getAllQuestions("postgresql");
  const mysqlQuestions = getAllQuestions("mysql");

  const stats: TopicStat[] = TOPICS.map((t) => {
    const pgForTopic = pgQuestions.filter((q) => q.topic_id === t.id && q.status === "published");
    const mysqlForTopic = mysqlQuestions.filter((q) => q.topic_id === t.id && q.status === "published");

    const getDiff = (list: typeof pgForTopic) => ({
      easy: list.filter((q) => q.difficulty === "easy").length,
      medium: list.filter((q) => q.difficulty === "medium").length,
      hard: list.filter((q) => q.difficulty === "hard").length,
      expert: list.filter((q) => q.difficulty === "expert").length,
    });

    return {
      topicId: t.id,
      topicTitle: t.title,
      level: t.level,
      pgCount: pgForTopic.length,
      pgDiff: getDiff(pgForTopic),
      mysqlCount: mysqlForTopic.length,
      mysqlDiff: getDiff(mysqlForTopic),
    };
  });

  const totalPg = stats.reduce((sum, s) => sum + s.pgCount, 0);
  const totalMysql = stats.reduce((sum, s) => sum + s.mysqlCount, 0);

  const lines: string[] = [];
  lines.push("# SQL Practice Platform: Question Bank Progress Report");
  lines.push("");
  lines.push(`> **Last Updated:** ${new Date().toISOString()}`);
  lines.push(`> **Total Questions:** PostgreSQL: **${totalPg}** / Target 1,530–2,040 | MySQL: **${totalMysql}** / Target 1,530–2,040`);
  lines.push("");
  lines.push("## Summary by Topic & Dialect");
  lines.push("");
  lines.push("| # | Level | Topic | PostgreSQL Published | PG Breakdown (E/M/H/X) | MySQL Published | MySQL Breakdown (E/M/H/X) | Target Status |");
  lines.push("|---|---|---|---|---|---|---|---|");

  stats.forEach((s, idx) => {
    const pgBreakdown = `${s.pgDiff.easy}/${s.pgDiff.medium}/${s.pgDiff.hard}/${s.pgDiff.expert}`;
    const mysqlBreakdown = `${s.mysqlDiff.easy}/${s.mysqlDiff.medium}/${s.mysqlDiff.hard}/${s.mysqlDiff.expert}`;
    const status = s.pgCount >= 30 && s.mysqlCount >= 30 ? "✅ Complete" : s.pgCount >= 3 ? "🟡 PG Seeded (3+)" : "🔴 Not Started";

    lines.push(
      `| ${idx + 1} | L${s.level} | ${s.topicTitle} | ${s.pgCount} | ${pgBreakdown} | ${s.mysqlCount} | ${mysqlBreakdown} | ${status} |`
    );
  });

  lines.push("");
  lines.push("## Overall Totals");
  lines.push("");
  lines.push(`- **PostgreSQL Published Questions:** ${totalPg} across ${TOPICS.length} topics`);
  lines.push(`- **MySQL Published Questions:** ${totalMysql} across ${TOPICS.length} topics`);
  lines.push(`- **Combined Platform Total:** ${totalPg + totalMysql} questions`);
  lines.push("");

  return lines.join("\n");
}

const reportContent = generateReport();
const outputPath = path.resolve(process.cwd(), "docs", "QUESTION_PROGRESS.md");
fs.writeFileSync(outputPath, reportContent, "utf-8");

console.log(reportContent);
