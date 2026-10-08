export type Dialect = "mysql" | "postgresql";

export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type QuestionType = "select" | "ddl_dml";
export type QuestionStatus = "draft" | "published" | "archived";

export interface ColumnDefinition {
  name: string;
  type: string;
}

export interface ComparisonConfig {
  compare_column_names?: boolean;
  order_matters?: boolean;
  float_tolerance?: number;
}

export interface TestCase {
  id: string;
  name: string;
  is_hidden: boolean;
  dataset_name: string;
  setup_sql?: string;
  verification_sql?: string;
}

export interface QuestionMetadata {
  id: string;
  slug: string;
  title: string;
  description_markdown: string;
  topic_id: string;
  subtopic_id: string;
  difficulty: Difficulty;
  dialect: Dialect;
  database_id: string;
  question_type?: QuestionType;
  tables_involved: string[];
  expected_columns: ColumnDefinition[];
  order_matters: boolean;
  comparison_config?: ComparisonConfig;
  starter_query: string;
  solution_query: string;
  solution_explanation: string;
  alternative_solutions?: string[];
  common_mistakes?: string[];
  interview_tip?: string;
  dialect_notes?: string;
  hints: string[]; // >= 3 progressive levels
  tags: string[];
  source: string;
  companies?: string[];
  estimated_minutes: number;
  xp: number;
  status: QuestionStatus;
  version: number;
  test_cases: TestCase[];
}

export interface QueryExecutionResult {
  success: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  totalRows: number;
  executionTimeMs: number;
  hasMore: boolean;
  explainPlan?: unknown;
  error?: {
    code: string;
    sqlState?: string;
    message: string;
    hint?: string;
    position?: number;
    userFacingMessage: string;
  };
}

export interface TestCaseResult {
  testCaseId: string;
  name: string;
  isHidden: boolean;
  passed: boolean;
  executionTimeMs: number;
  feedback?: string;
  error?: string;
  userRows?: Record<string, unknown>[];
  expectedRows?: Record<string, unknown>[];
  columns?: string[];
}

export interface SubmissionEvaluationResult {
  verdict: "correct" | "incorrect" | "error" | "timeout";
  passedCount: number;
  totalCount: number;
  testCaseResults: TestCaseResult[];
  overallExecutionTimeMs: number;
  xpEarned?: number;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

export interface ExecutionRequest {
  databaseId: string;
  query: string;
  variant?: "sample" | "hidden_1" | "hidden_2";
  options?: {
    timeoutMs?: number;
    maxRows?: number;
    includeExplain?: boolean;
    questionType?: QuestionType;
    availableTables?: string[];
  };
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnSchema[];
  rowCount?: number;
  sampleRows?: Record<string, unknown>[];
}

export interface ErrorDetail {
  code: string;
  sqlState?: string;
  message: string;
  hint?: string;
  position?: number;
  userFacingMessage: string;
}

export interface DialectAdapter {
  id: Dialect;
  displayName: string;
  monacoLanguage: string;
  formatterLanguage: "postgresql" | "mysql";
  validateStatement(sql: string, questionType?: QuestionType): ValidationResult;
  execute(request: ExecutionRequest): Promise<QueryExecutionResult>;
  translateError(rawError: unknown, schemaInfo?: unknown): ErrorDetail;
  normalizeValue(value: unknown, columnType?: string): unknown;
  introspectSchema(databaseId: string): Promise<TableSchema[]>;
  provisionPlaygroundSchema(sessionId: string): Promise<void>;
  resetPlayground(sessionId: string): Promise<void>;
  explain?(sql: string): Promise<unknown>;
}
