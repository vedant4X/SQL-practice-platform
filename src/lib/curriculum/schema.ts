import { z } from "zod";

export const ColumnDefinitionSchema = z.object({
  name: z.string(),
  type: z.string(),
});

export const ComparisonConfigSchema = z.object({
  compare_column_names: z.boolean().optional(),
  order_matters: z.boolean().optional(),
  float_tolerance: z.number().optional(),
});

export const TestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_hidden: z.boolean(),
  dataset_name: z.string(),
  setup_sql: z.string().optional(),
  verification_sql: z.string().optional(),
});

export const QuestionMetadataSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description_markdown: z.string(),
  topic_id: z.string(),
  subtopic_id: z.string(),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  dialect: z.enum(["postgresql", "mysql"]),
  database_id: z.string(),
  question_type: z.enum(["select", "ddl_dml"]).optional().default("select"),
  tables_involved: z.array(z.string()),
  expected_columns: z.array(ColumnDefinitionSchema),
  order_matters: z.boolean(),
  comparison_config: ComparisonConfigSchema.optional(),
  starter_query: z.string(),
  solution_query: z.string(),
  solution_explanation: z.string(),
  alternative_solutions: z.array(z.string()).optional(),
  common_mistakes: z.array(z.string()).optional(),
  interview_tip: z.string().optional(),
  dialect_notes: z.string().optional(),
  hints: z.array(z.string()).min(3),
  tags: z.array(z.string()),
  source: z.string(),
  companies: z.array(z.string()).optional(),
  estimated_minutes: z.number(),
  xp: z.number(),
  status: z.enum(["draft", "published", "archived"]),
  version: z.number(),
  test_cases: z.array(TestCaseSchema).min(3),
});

export const TopicQuestionsSchema = z.array(QuestionMetadataSchema);
