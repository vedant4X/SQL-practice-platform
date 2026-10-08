import fs from "fs";
import path from "path";

const PG_DIR = path.resolve(process.cwd(), "content", "questions", "postgresql");
const MYSQL_DIR = path.resolve(process.cwd(), "content", "questions", "mysql");

if (!fs.existsSync(MYSQL_DIR)) {
  fs.mkdirSync(MYSQL_DIR, { recursive: true });
}

function adaptSqlToMySql(sql: string, topicId: string): string {
  let res = sql;

  // 1. Date functions
  // DATE_TRUNC('month', order_date) -> DATE_FORMAT(order_date, '%Y-%m-01')
  res = res.replace(/DATE_TRUNC\s*\(\s*'month'\s*,\s*([^)]+)\)/gi, "DATE_FORMAT($1, '%Y-%m-01')");
  res = res.replace(/DATE_TRUNC\s*\(\s*'year'\s*,\s*([^)]+)\)/gi, "DATE_FORMAT($1, '%Y-01-01')");
  res = res.replace(/DATE_TRUNC\s*\(\s*'day'\s*,\s*([^)]+)\)/gi, "DATE($1)");

  // Date subtraction: (end_date - start_date) AS duration_days -> DATEDIFF(end_date, start_date) AS duration_days
  res = res.replace(/\(\s*([a-zA-Z0-9_.]+)\s*-\s*([a-zA-Z0-9_.]+)\s*\)\s*AS\s+duration_days/gi, "DATEDIFF($1, $2) AS duration_days");
  res = res.replace(/\(\s*([a-zA-Z0-9_.]+)\s*-\s*([a-zA-Z0-9_.]+)\s*\)\s*AS\s+days_diff/gi, "DATEDIFF($1, $2) AS days_diff");

  // EXTRACT(YEAR FROM col) -> YEAR(col)
  res = res.replace(/EXTRACT\s*\(\s*YEAR\s+FROM\s+([^)]+)\)/gi, "YEAR($1)");
  res = res.replace(/EXTRACT\s*\(\s*MONTH\s+FROM\s+([^)]+)\)/gi, "MONTH($1)");
  res = res.replace(/EXTRACT\s*\(\s*DAY\s+FROM\s+([^)]+)\)/gi, "DAY($1)");

  // 2. String functions
  // POSITION(needle IN haystack) -> LOCATE(needle, haystack)
  res = res.replace(/POSITION\s*\(\s*([^)]+?)\s+IN\s+([^)]+?)\s*\)/gi, "LOCATE($1, $2)");

  // SUBSTRING(str FROM a FOR b) -> SUBSTRING(str, a, b)
  res = res.replace(/SUBSTRING\s*\(\s*([^,()]+)\s+FROM\s+([0-9]+)\s+FOR\s+([0-9]+)\s*\)/gi, "SUBSTRING($1, $2, $3)");
  // SUBSTRING(str FROM expr) -> SUBSTRING(str, expr)
  res = res.replace(/SUBSTRING\s*\(\s*([^,()]+)\s+FROM\s+([^)]+)\)/gi, "SUBSTRING($1, $2)");

  // 3. Regex
  // col ~ 'pattern' -> col REGEXP 'pattern'
  res = res.replace(/([a-zA-Z0-9_.]+)\s*~\s*'([^']+)'/gi, "$1 REGEXP '$2'");

  // 4. PostgreSQL ILIKE -> MySQL LIKE (MySQL LIKE is case-insensitive for utf8mb4_0900_ai_ci by default)
  res = res.replace(/\bILIKE\b/gi, "LIKE");

  // 5. String concatenation operator || (outside quotes)
  // Check if string contains || outside single quotes
  if (res.includes("||")) {
    // E.g., first_name || ' ' || last_name
    res = res.replace(/([a-zA-Z0-9_.]+)\s*\|\|\s*' '\s*\|\|\s*([a-zA-Z0-9_.]+)/g, "CONCAT($1, ' ', $2)");
    res = res.replace(/([a-zA-Z0-9_.]+)\s*\|\|\s*([a-zA-Z0-9_.]+)/g, "CONCAT($1, $2)");
  }

  // 6. Fix any NUMERIC/INT casting ::int or ::numeric
  res = res.replace(/::(?:int|integer|bigint)/gi, "");
  res = res.replace(/::(?:numeric|decimal|float)/gi, "");
  res = res.replace(/::(?:text|varchar)/gi, "");

  return res;
}

function adaptQuestion(q: any, topicId: string): any {
  const mysqlQuestion = JSON.parse(JSON.stringify(q));

  mysqlQuestion.dialect = "mysql";
  mysqlQuestion.id = q.id.replace(/^q-/, "q-my-");

  // Adapt solution query
  mysqlQuestion.solution_query = adaptSqlToMySql(q.solution_query, topicId);

  // Adapt starter query
  if (mysqlQuestion.starter_query) {
    mysqlQuestion.starter_query = adaptSqlToMySql(q.starter_query, topicId);
  }

  // Adapt alternative solutions
  if (Array.isArray(mysqlQuestion.alternative_solutions)) {
    mysqlQuestion.alternative_solutions = mysqlQuestion.alternative_solutions.map((alt: string) =>
      adaptSqlToMySql(alt, topicId)
    );
  }

  // Adapt hints referencing PostgreSQL
  if (Array.isArray(mysqlQuestion.hints)) {
    mysqlQuestion.hints = mysqlQuestion.hints.map((h: string) => {
      let adapted = h.replace(/PostgreSQL/gi, "MySQL");
      adapted = adaptSqlToMySql(adapted, topicId);
      return adapted;
    });
  }

  // Adapt solution explanation
  if (mysqlQuestion.solution_explanation) {
    mysqlQuestion.solution_explanation = mysqlQuestion.solution_explanation.replace(/PostgreSQL/gi, "MySQL");
  }

  // Adapt description markdown
  if (mysqlQuestion.description_markdown) {
    mysqlQuestion.description_markdown = mysqlQuestion.description_markdown.replace(/PostgreSQL/gi, "MySQL");
    // If prompt had DATE_TRUNC('month', order_date), adapt description
    if (mysqlQuestion.description_markdown.includes("DATE_TRUNC")) {
      mysqlQuestion.description_markdown = mysqlQuestion.description_markdown.replace(
        /DATE_TRUNC\('month',\s*order_date\)/g,
        "DATE_FORMAT(order_date, '%Y-%m-01')"
      );
    }
  }

  // Update test cases IDs
  if (Array.isArray(mysqlQuestion.test_cases)) {
    mysqlQuestion.test_cases = mysqlQuestion.test_cases.map((tc: any) => ({
      ...tc,
      id: tc.id.replace(/^tc-/, "tc-my-"),
    }));
  }

  // Expected columns type normalization for MySQL
  if (Array.isArray(mysqlQuestion.expected_columns)) {
    mysqlQuestion.expected_columns = mysqlQuestion.expected_columns.map((c: any) => {
      let type = c.type;
      if (type === "numeric") type = "decimal";
      return { ...c, type };
    });
  }

  return mysqlQuestion;
}

const files = fs.readdirSync(PG_DIR).filter((f) => f.endsWith(".json"));

console.log(`Found ${files.length} PostgreSQL question files to adapt for MySQL...`);

let totalQuestions = 0;

for (const file of files) {
  const topicId = path.basename(file, ".json");
  const pgContent = fs.readFileSync(path.join(PG_DIR, file), "utf-8");
  const pgQuestions = JSON.parse(pgContent);

  const mysqlQuestions = pgQuestions.map((q: any) => adaptQuestion(q, topicId));
  totalQuestions += mysqlQuestions.length;

  fs.writeFileSync(
    path.join(MYSQL_DIR, file),
    JSON.stringify(mysqlQuestions, null, 2),
    "utf-8"
  );
}

console.log(`Successfully generated ${totalQuestions} MySQL questions across ${files.length} files in ${MYSQL_DIR}`);
