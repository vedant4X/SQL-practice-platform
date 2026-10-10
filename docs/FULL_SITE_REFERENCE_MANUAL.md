# Full Website Developer & Prompt Engineering Reference Manual

> **Purpose:** This document provides an exhaustive, low-level technical reference of the entire SQL Practice Platform codebase at `c:/SQL_WEB2`. Use this reference to write hyper-specific, one-shot prompts for features, refactors, UI updates, and backend enhancements.

---

## 1. System Architecture & High-Level Topology

```
                       ┌────────────────────────────────────────────────────────┐
                       │                   Next.js 15 Client                    │
                       │  (React 19, Monaco Editor, Tailwind CSS, Lucide Icons) │
                       └───────────┬────────────────────────────────┬───────────┘
                                   │                                │
            REST Calls (JSON)      ▼                                ▼      localStorage
       ┌───────────────────────────────────────┐         ┌────────────────────────┐
       │     Next.js App Router API Routes     │         │ - quro_draft_<slug>    │
       │           (/api/v1/*)                 │         │ - quro_practice_mode   │
       └───────────┬───────────────┬───────────┘         │ - quro_guest_solved    │
                   │               │                     └────────────────────────┘
                   ▼               ▼
      ┌────────────────────┐   ┌──────────────────────────────────────────────┐
      │  App Store / Auth  │   │          PostgreSQL 16 Engine Sandbox        │
      │ (data/app-db.json) │   │          (@electric-sql/pglite WASM)         │
      │ - Users & Scrypt   │   │                                              │
      │ - Submissions      │   │  1. AST & Statement Validator                │
      │ - XP Ledger        │   │  2. Ephemeral Transaction Sandbox (ROLLBACK) │
      │ - Question States  │   │  3. Multi-Test Evaluator (Sample + 2 Hidden) │
      │ - Bookmarks        │   │  4. Result Comparator (Tolerance + NULLs)    │
      │ - Settings         │   │  5. Error Translator (SQLSTATE -> English)   │
      └────────────────────┘   └──────────────────────────────────────────────┘
```

---

## 2. Directory & File Reference Map

### 2.1 Engine & Sandbox (`src/lib/engine/`)
| File | Main Exports / Symbols | Responsibility |
| :--- | :--- | :--- |
| [`types.ts`](file:///c:/SQL_WEB2/src/lib/engine/types.ts) | `QuestionMetadata`, `TestCase`, `QueryExecutionResult`, `TestCaseResult`, `Difficulty`, `QuestionType` | Core domain type definitions used across engine, curriculum, and frontend. |
| [`statement-validator.ts`](file:///c:/SQL_WEB2/src/lib/engine/statement-validator.ts) | `validateStatement(sql, allowedType)` | AST/lexical validator: blocks multi-statement semicolons, `COPY`, filesystem routines, extension creation, and system catalogs. |
| [`sandbox-runner.ts`](file:///c:/SQL_WEB2/src/lib/engine/sandbox-runner.ts) | `executeInSandbox(databaseId, query, datasetType, options)` | Loads dataset schema & SQL, starts `BEGIN`, sets 5s timeout, truncates at 1,000 rows (`hasMore`), and always executes `ROLLBACK`. |
| [`evaluator.ts`](file:///c:/SQL_WEB2/src/lib/engine/evaluator.ts) | `evaluateSubmission(question, userQuery)` | Runs user query against 1 visible sample + $\ge 2$ hidden test cases, executes solution query as reference, and checks correctness via comparator. |
| [`result-comparator.ts`](file:///c:/SQL_WEB2/src/lib/engine/result-comparator.ts) | `compareResults(actual, expected, config)` | Normalizes column names, checks ordered vs. multiset equality, float tolerance (`1e-6`), and NULL matching. |
| [`error-translator.ts`](file:///c:/SQL_WEB2/src/lib/engine/error-translator.ts) | `translatePostgresError(rawError, availableTables, availableColumns)` | Parses PostgreSQL error codes (`42601`, `42703`, `42P01`, etc.), identifies typo distances (Levenshtein), and produces friendly messages. |
| [`playground-db.ts`](file:///c:/SQL_WEB2/src/lib/engine/playground-db.ts) | `getOrCreatePlaygroundDb(sessionId)`, `resetPlaygroundDb(sessionId)` | Manages stateful PGlite instances for playground queries; persists user tables across playground runs until reset. |

---

### 2.2 Datasets & Curriculum (`datasets/` & `src/lib/curriculum/`)
| Directory / File | Key Data / Exports | Purpose |
| :--- | :--- | :--- |
| `datasets/employeedb/` | `departments`, `employees`, `salaries`, `projects`, `employee_projects` | Employee hierarchy & compensation dataset (Levels 1–9 practice). |
| `datasets/ecommercedb/` | `customers`, `orders`, `order_items`, `products`, `categories` | Online retail sales & inventory dataset. |
| `datasets/collegedb/` | `students`, `courses`, `enrollments`, `instructors`, `departments` | Academic university registrar dataset. |
| `datasets/scenarios/` | 12 scenario folders (`banking`, `hospital`, `food_delivery`, `movie_streaming`, `social_media`, `airline`, `hotel`, `library`, `inventory`, `finance`, `hr`, `sales`) | Realistic enterprise databases for Level 10 business problem solving. |
| [`topics.ts`](file:///c:/SQL_WEB2/src/lib/curriculum/topics.ts) | `TOPICS: Topic[]` (51 topics across 10 levels) | Master catalog definition with levels, slugs, descriptions, and mastery thresholds. |
| [`questions/index.ts`](file:///c:/SQL_WEB2/src/lib/curriculum/questions/index.ts) | `ALL_QUESTIONS`, `getQuestionById()`, `getQuestionBySlug()`, `getQuestionsByTopic()` | Aggregate question registry containing all 153 validated questions. |

---

### 2.3 Application Store & Services (`src/lib/`)
| File | Symbols | Details |
| :--- | :--- | :--- |
| [`src/lib/db/store.ts`](file:///c:/SQL_WEB2/src/lib/db/store.ts) | `appStore` (singleton class `AppStore`) | Atomic file-backed relational store (`data/app-db.json`): `getUserByEmail`, `createUser`, `recordSubmission`, `getUserQuestionState`, `toggleBookmark`, `updateUserSettings`. |
| [`src/lib/auth/password.ts`](file:///c:/SQL_WEB2/src/lib/auth/password.ts) | `hashPassword(password)`, `verifyPassword(password, hash)` | Scrypt cryptographic key derivation with 16-byte random salt. |
| [`src/lib/auth/session.ts`](file:///c:/SQL_WEB2/src/lib/auth/session.ts) | `createSessionToken(payload)`, `verifySessionToken(token)` | HS256 JWT encoding/decoding via `jose`. Default expiration: 7 days. |
| [`src/lib/auth/cookies.ts`](file:///c:/SQL_WEB2/src/lib/auth/cookies.ts) | `setSessionCookie()`, `clearSessionCookie()`, `getSessionFromRequest()` | Handles HTTP-only cookie `sql_platform_session`. |
| [`src/lib/progress/service.ts`](file:///c:/SQL_WEB2/src/lib/progress/service.ts) | `getUserProgressStats(userId)`, `calculateLevel(totalXp)` | Level calculation: $\lfloor\sqrt{\text{totalXP} / 50}\rfloor + 1$. Computes topic completion %, streak, accuracy %, and explainable recommendations. |
| [`src/lib/api/response.ts`](file:///c:/SQL_WEB2/src/lib/api/response.ts) | `successResponse(data, status)`, `errorResponse(code, message, status)` | Standard JSON envelope for all API endpoints. |

---

### 2.4 Frontend Pages & Component Hierarchy (`src/app/` & `src/components/`)
```text
RootLayout (src/app/layout.tsx)
 ├── Navbar (src/components/Navbar.tsx)
 └── Page Content:
      ├── LandingPage (src/app/page.tsx)
      ├── TopicsPage (src/app/topics/page.tsx)
      ├── PracticePage (src/app/practice/[slug]/page.tsx)
      │    ├── QuestionPanel (src/components/practice/QuestionPanel.tsx)
      │    │    └── ResultTable (src/components/practice/ResultTable.tsx)
      │    ├── SqlEditor (src/components/editor/SqlEditor.tsx)
      │    └── SchemaExplorer (src/components/practice/SchemaExplorer.tsx)
      ├── PlaygroundPage (src/app/playground/page.tsx)
      │    ├── Monaco Editor
      │    └── ResultTable (src/components/practice/ResultTable.tsx)
      ├── DashboardPage (src/app/dashboard/page.tsx)
      ├── ProfilePage (src/app/profile/page.tsx)
      ├── LoginPage (src/app/login/page.tsx)
      └── RegisterPage (src/app/register/page.tsx)
```

---

## 3. End-to-End Data Flow Lifecycles

### 3.1 "Run Query" Lifecycle (Practice Workspace)
1. **User action:** Clicks **Run Query** button (or presses `Ctrl+Enter`).
2. **Component:** [`SqlEditor.tsx`](file:///c:/SQL_WEB2/src/components/editor/SqlEditor.tsx) triggers `onRun()`.
3. **Page handler:** [`practice/[slug]/page.tsx`](file:///c:/SQL_WEB2/src/app/practice/%5Bslug%5D/page.tsx) calls `POST /api/v1/questions/:slug/execute` with `{ sql: sqlCode }`.
4. **API Route:** [`execute/route.ts`](file:///c:/SQL_WEB2/src/app/api/v1/questions/%5Bslug%5D/execute/route.ts):
   - Validates SQL format via Zod.
   - Runs `executeInSandbox(question.database_id, sql, "sample", { questionType, availableTables })`.
5. **Sandbox Runner:** [`sandbox-runner.ts`](file:///c:/SQL_WEB2/src/lib/engine/sandbox-runner.ts):
   - Runs `validateStatement(sql)`: throws if multiple queries, forbidden tokens (`COPY`, `pg_read_file`), or length > 10,000 chars.
   - Initialises PGlite instance with `schema.sql` and visible `data.sql`.
   - Executes inside `BEGIN; ... ROLLBACK;` block with 5-second timer.
   - Truncates output to 1,000 rows (`hasMore: true`).
6. **Frontend State:** `practice/[slug]/page.tsx` sets `runResult`, switches active tab to `"results"`.
7. **Display:** [`ResultTable.tsx`](file:///c:/SQL_WEB2/src/components/practice/ResultTable.tsx) renders interactive data grid or translated PostgreSQL error card.

---

### 3.2 "Submit Solution" & Judging Lifecycle
1. **User action:** Clicks **Submit Solution** button (or presses `Ctrl+Shift+Enter`).
2. **Page handler:** [`practice/[slug]/page.tsx`](file:///c:/SQL_WEB2/src/app/practice/%5Bslug%5D/page.tsx) calls `POST /api/v1/questions/:slug/submit` with `{ sql: sqlCode }`.
3. **API Route:** [`submit/route.ts`](file:///c:/SQL_WEB2/src/app/api/v1/questions/%5Bslug%5D/submit/route.ts) delegates to `evaluateSubmission(question, sql)`.
4. **Evaluator:** [`evaluator.ts`](file:///c:/SQL_WEB2/src/lib/engine/evaluator.ts):
   - Iterates over `question.test_cases`:
     - Test Case 1: Visible sample (`data.sql`).
     - Test Case 2: Hidden test dataset 1 (`hidden_data_1.sql`).
     - Test Case 3: Hidden test dataset 2 (`hidden_data_2.sql`).
   - Executes both `question.solution_query` and `userQuery` against each dataset.
   - Runs `compareResults(actual, expected, question.comparison_config)`.
5. **Verdict:**
   - If all test cases match $\to$ `verdict: "correct"`.
   - If any test case mismatches $\to$ `verdict: "incorrect"`.
   - If execution fails or times out $\to$ `verdict: "error"` or `"timeout"`.
6. **XP Ledger:** If authenticated and not already solved:
   - Penalty subtracted: $20\%$ per unlocked hint ($0.8^{\text{hintsUsed}}$).
   - If solution was previously viewed $\to$ $0\text{ XP}$ awarded.
   - `appStore.recordSubmission()` records attempt and adds transaction to `xp_ledger`.
7. **Frontend State:** Switches active tab to `"testcases"` showing passed/failed counts, per-case execution times, and earned XP banner.

---

### 3.3 Hint Unlock & XP Penalty Lifecycle
1. **User action:** Clicks **Unlock Next Hint** in Question Panel.
2. **API Route:** `POST /api/v1/questions/:slug/hints`:
   - Checks user question state in `appStore`.
   - Increments `hintsUsed` (capped at `totalHints`).
   - Deducts 20% potential XP for this problem.
   - Returns slice of hints `question.hints.slice(0, hintsRevealedCount)`.
3. **Frontend:** Displays hint markdown with remaining solvable XP badge.

---

### 3.4 Solution Reveal & Forfeiture Lifecycle
1. **User action:** User clicks **View Official Solution**.
2. **Confirmation Modal:** Displays warning: *"Viewing this solution forfeits all XP for this question permanently."*
3. **API Route:** `POST /api/v1/questions/:slug/solution`:
   - Sets `solutionViewed: true` in user question state.
   - Records $0\text{ XP}$ maximum for future attempts.
   - Returns `solutionQuery`, `solutionExplanation`, `commonMistakes`, and `interviewTip`.
4. **Frontend:** Reveals official query, line-by-line explanation, and syntax tips.

---

## 4. Schemas & Data Contracts

### 4.1 `QuestionMetadata` Interface (`src/lib/engine/types.ts`)
```typescript
export interface QuestionMetadata {
  id: string;                         // e.g. "q-l1-001"
  slug: string;                       // e.g. "view-all-departments"
  title: string;                      // e.g. "View All Departments"
  description_markdown: string;       // GitHub-flavored markdown
  topic_id: string;                   // e.g. "t-l1-01"
  subtopic_id: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  dialect: "postgresql";
  database_id: string;                // "employeedb" | "ecommercedb" | "collegedb" | scenarios/*
  question_type?: "select" | "ddl_dml";
  tables_involved: string[];          // e.g. ["departments"]
  expected_columns: { name: string; type: string }[];
  order_matters: boolean;
  comparison_config?: {
    compare_column_names?: boolean;
    order_matters?: boolean;
    float_tolerance?: number;
  };
  starter_query: string;
  solution_query: string;
  solution_explanation: string;
  alternative_solutions?: string[];
  common_mistakes?: string[];
  interview_tip?: string;
  hints: string[];                    // Exactly 3 progressive hints
  tags: string[];
  source: string;
  companies?: string[];
  estimated_minutes: number;
  xp: number;                         // Standard: Easy=100, Medium=200, Hard=300, Expert=400
  status: "published" | "draft";
  version: number;
  test_cases: TestCase[];             // 1 sample + 2 hidden test cases
}
```

### 4.2 Query Execution & Evaluation Results
```typescript
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
}
```

---

## 5. UI Component Anatomy & Styling Tokens

### 5.1 Color Scheme & CSS Variables (`src/app/globals.css`)
- **Primary Accent:** `colors.primary = #0284c7` (Sky 600), `colors.primary-light = #38bdf8` (Sky 400), `colors.primary-hover = #0369a1`
- **Backgrounds:**
  - Base Dark: `bg-background = #0f172a` (Slate 900)
  - Card/Panel: `bg-background-card = #1e293b` (Slate 800)
  - Deep Darker: `bg-background-darker = #0b0f19`
- **Borders:** `border-background-border = #334155` (Slate 700), `border-slate-800 = #1e293b`
- **Badges:**
  - Easy: `bg-emerald-500/10 text-emerald-400 border-emerald-500/30`
  - Medium: `bg-amber-500/10 text-amber-400 border-amber-500/30`
  - Hard: `bg-rose-500/10 text-rose-400 border-rose-500/30`
  - Expert: `bg-purple-500/10 text-purple-400 border-purple-500/30`

### 5.2 Monaco Editor Setup (`src/components/editor/SqlEditor.tsx`)
- **Custom Dark Theme:** `"quietgrove-dark"`
- **Registered Shortcuts:**
  - `Ctrl/Cmd + Enter` $\to$ Trigger `onRun()`
  - `Ctrl/Cmd + Shift + Enter` $\to$ Trigger `onSubmit()`
  - `Ctrl/Cmd + Shift + F` $\to$ Format SQL via `sql-formatter`
- **Practice Mode (Anti-Paste Mechanism):**
  - Intercepts `onPaste` event in DOM container and Monaco editor:
    ```typescript
    editor.onKeyDown((e) => {
      if (practiceMode && (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
        e.preventDefault();
        setPasteBlockedNotice(true);
      }
    });
    ```
  - Displays transient warning badge: *"Clipboard paste is disabled in Practice Mode."*

---

## 6. Prompt Engineering Guide for Future Modifications

When writing prompts to modify this codebase, follow these established conventions:

### Rule 1: Specify Exact File Paths and Function Names
Instead of: *"Add a filter to the topics page"*  
Use: *"In `src/app/topics/page.tsx`, add a level selector filter that updates `selectedLevel` state."*

### Rule 2: Respect the Genuine PostgreSQL Execution Rule
Never propose mocking query execution or returning static arrays. All queries must run through `executeInSandbox` in `src/lib/engine/sandbox-runner.ts` or `evaluateSubmission` in `src/lib/engine/evaluator.ts`.

### Rule 3: Maintain Schema Shape Compatibility
When modifying `QueryExecutionResult`, ensure all required fields (`success`, `columns`, `rows`, `rowCount`, `totalRows`, `executionTimeMs`, `hasMore`) are provided to maintain strict TypeScript compilation.

---

### Ready-to-Use Prompt Templates

#### Template A: Adding a New Practice Question
```text
I want to add a new question to Level 4 (Relational Joins):
1. In `src/lib/curriculum/questions/level4-joins.ts`, create a new QuestionMetadata object:
   - ID: "q-l4-016"
   - Slug: "department-project-budget-match"
   - Title: "Department Project Budget Matching"
   - Topic ID: "t-l4-01" (Inner Join)
   - Difficulty: "medium", Database: "employeedb", XP: 200
   - Description markdown with clear input/output requirements.
   - Provide 3 progressive hints and line-by-line solution explanation.
   - Define 3 test cases: 1 sample and 2 hidden edge-case datasets.
2. Run `npm run test` to verify the solution query executes against real PostgreSQL 16.
```

#### Template B: Adding a Global Leaderboard
```text
Add a public user leaderboard:
1. Backend: Create `src/app/api/v1/leaderboard/route.ts` returning the top 50 users from `appStore` sorted by `totalXp` descending.
2. Frontend: Create `src/app/leaderboard/page.tsx` displaying rank, user name, level, total XP, and questions completed.
3. Navigation: Add a Leaderboard link to `src/components/Navbar.tsx` with an Award icon.
4. Test: Add test case in `tests/api/api-flow.test.ts` verifying sorting and ranking.
```

#### Template C: Adding a Visual Query Plan (`EXPLAIN ANALYZE`) Tab
```text
Add an interactive Query Plan tab to QuestionPanel.tsx:
1. In `src/lib/engine/sandbox-runner.ts`, add support for executing `EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) <query>`.
2. In `src/components/practice/QuestionPanel.tsx`, add an "Execution Plan" tab.
3. Parse the returned JSON execution tree and display operation nodes (Seq Scan, Index Scan, Hash Join, Nested Loop) with runtime duration and cost bars.
4. Ensure the statement validator permits safe EXPLAIN statements.
```

#### Template D: Adding Native PostgreSQL Docker Container Support
```text
Enable dynamic dual-runner switching:
1. In `src/lib/engine/sandbox-runner.ts`, check for `DATABASE_URL_SANDBOX` in process.env.
2. If available, test connection with `pg.Pool`. If healthy, run queries inside the container under the `sandbox_readonly` role with `SET LOCAL statement_timeout = 5000;`.
3. If container is unreachable, automatically fall back to PGlite WebAssembly engine.
4. Show a pill badge in `src/components/Navbar.tsx` indicating: "Engine: PostgreSQL 16 (Container)" or "Engine: PostgreSQL 16 (WASM)".
```
