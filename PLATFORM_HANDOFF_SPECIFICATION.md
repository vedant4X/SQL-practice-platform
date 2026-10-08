# SQL Platform Build & Master Handoff Specification

> **Platform Name:** SQL Platform (PostgreSQL-First)  
> **Repository Path:** `c:/SQL_WEB2`  
> **Stack:** Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS, Monaco Editor, PostgreSQL 16.4 Engine (`@electric-sql/pglite`), Scrypt Auth, Vitest.  
> **Status:** Fully functional MVP, 20/20 automated tests passing, production build passing (`next build`).

---

## 1. Executive Summary

This project is a production-grade, PostgreSQL-first SQL practice platform combining:
- **LeetCode:** Real-time test-case judging, multi-test evaluation (1 visible sample + $\ge 2$ hidden alternate datasets), query execution times, row comparisons, and error feedback.
- **SQLBolt:** Structured 10-level learning hierarchy (51 topics), progressive hints (-20% XP penalty per hint), and line-by-line solution walkthroughs (with XP forfeiture confirmation).
- **DataCamp:** XP progression system ($\text{Level} = \lfloor\sqrt{\text{totalXP} / 50}\rfloor + 1$), accuracy metrics, practice streaks, and explainable next-problem recommendations.
- **InterviewBit:** 12 complex, realistic multi-table scenario databases (Fintech fraud, SaaS cohort churn, Healthcare readmission, Supply chain thresholds).

### Core Working Rules Enforced
1. **Zero Mocked SQL:** 100% of queries execute against a genuine PostgreSQL 16.4 engine (WebAssembly build running in-process, with standard SQLSTATE codes and full SQL feature support).
2. **Defense-in-Depth:** AST & lexical validator blocks multi-statements, `COPY`, filesystem routines (`pg_read_file`), and system catalog access. Every execution runs in an ephemeral transaction and rolls back immediately.
3. **Strict Curriculum Coverage:** All 51 topics feature $\ge 3$ fully validated questions (153 total), each with $\ge 3$ progressive hints, line-by-line explanations, and $\ge 3$ test cases.

---

## 2. Complete File Inventory

### 2.1 Documentation (`docs/`)
- [`docs/DESIGN.md`](file:///c:/SQL_WEB2/docs/DESIGN.md): Comprehensive functional requirements, data flow, ER diagrams, REST API specs, and UI layouts.
- [`docs/DECISIONS.md`](file:///c:/SQL_WEB2/docs/DECISIONS.md): Architectural Decision Records (ADRs) covering engine selection, auth hashing, comparator logic, and dual-runner isolation.
- [`docs/SANDBOX.md`](file:///c:/SQL_WEB2/docs/SANDBOX.md): Security threat model, sandboxing tiers, SQLSTATE error maps, resource limits, and privilege isolation.

### 2.2 Datasets (`datasets/`)
Each database directory contains `schema.sql`, `data.sql` (visible sample), `hidden_data_1.sql` (edge-case test case), and `hidden_data_2.sql` (stress test case):
- **Core Educational Datasets:**
  - `datasets/employeedb/`: HR hierarchy, salaries, projects, departments.
  - `datasets/ecommercedb/`: Customers, orders, order items, product catalog.
  - `datasets/collegedb/`: University courses, student enrollments, instructors, departments.
- **12 Real-World Business Scenarios (`datasets/scenarios/`):**
  - `banking/`: Accounts, loans, transactions, customer profiles.
  - `hospital/`: Doctors, patients, appointments, admissions, treatments.
  - `food_delivery/`: Restaurants, menu items, delivery drivers, orders.
  - `movie_streaming/`: Users, streaming sessions, ratings, genre catalog.
  - `social_media/`: User graphs, posts, comments, likes, follower trees.
  - `airline/`: Flights, airports, ticket bookings, passenger manifests.
  - `hotel/`: Rooms, guests, reservations, billings.
  - `library/`: Book catalog, memberships, checkout loans, overdue fines.
  - `inventory/`: Warehouses, stock levels, restocking shipments.
  - `finance/`: Portfolios, equities, trades, dividend logs.
  - `hr/`: Job openings, candidate applications, interview scores, offer letters.
  - `sales/`: Sales representatives, CRM leads, pipeline opportunities, closed deals.

### 2.3 PostgreSQL Execution Engine (`src/lib/engine/`)
- [`src/lib/engine/types.ts`](file:///c:/SQL_WEB2/src/lib/engine/types.ts): TypeScript interfaces for questions, test cases, evaluation results, errors, and comparator configs.
- [`src/lib/engine/statement-validator.ts`](file:///c:/SQL_WEB2/src/lib/engine/statement-validator.ts): Validates single-statement execution, prevents multi-query semicolon injection, and blocks forbidden keywords (`COPY`, `pg_read_file`, `pg_sleep`, `ALTER SYSTEM`).
- [`src/lib/engine/error-translator.ts`](file:///c:/SQL_WEB2/src/lib/engine/error-translator.ts): Translates raw PostgreSQL SQLSTATE codes (`42601`, `42703`, `42P01`, `42803`, `57014`) into friendly plain English with column typo suggestions.
- [`src/lib/engine/result-comparator.ts`](file:///c:/SQL_WEB2/src/lib/engine/result-comparator.ts): Compares user query results with solution results (handles order-dependent vs. multiset comparisons, float tolerance of `1e-6`, and `NULL` semantics).
- [`src/lib/engine/sandbox-runner.ts`](file:///c:/SQL_WEB2/src/lib/engine/sandbox-runner.ts): Ephemeral PostgreSQL 16 runner with 5s timeout, 1,000 row truncation (`hasMore: true`), and automatic transaction rollback.
- [`src/lib/engine/evaluator.ts`](file:///c:/SQL_WEB2/src/lib/engine/evaluator.ts): Multi-test judging harness that executes solutions and user queries against visible sample + 2 hidden test datasets.
- [`src/lib/engine/playground-db.ts`](file:///c:/SQL_WEB2/src/lib/engine/playground-db.ts): Session-specific stateful sandbox manager for free-form playground queries and reset triggers.

### 2.4 Curriculum & Question Bank (`src/lib/curriculum/`)
- [`src/lib/curriculum/topics.ts`](file:///c:/SQL_WEB2/src/lib/curriculum/topics.ts): Complete definition of 10 levels and 51 topics with slugs and descriptions.
- `src/lib/curriculum/questions/`: 153 validated questions across 10 modules:
  - `level1-basics.ts` (15 questions)
  - `level2-functions.ts` (15 questions)
  - `level3-grouping.ts` (15 questions)
  - `level4-joins.ts` (15 questions)
  - `level5-subqueries.ts` (15 questions)
  - `level6-set-operators.ts` (15 questions)
  - `level7-intermediate.ts` (15 questions: CTEs, Views, Temp Tables)
  - `level8-window.ts` (15 questions: ROW_NUMBER, RANK, LEAD, LAG, Frames)
  - `level9-advanced.ts` (15 questions: NTILE, EXPLAIN, Hierarchies)
  - `level10-scenarios.ts` (18 questions: 12 Business Scenarios)

### 2.5 Application Store & Authentication (`src/lib/`)
- [`src/lib/db/store.ts`](file:///c:/SQL_WEB2/src/lib/db/store.ts): Persistent atomic JSON/relational database stored at `data/app-db.json` (users, submissions, XP ledger, question states, bookmarks, user settings).
- [`src/lib/auth/password.ts`](file:///c:/SQL_WEB2/src/lib/auth/password.ts): Cryptographic password hashing using Node.js `crypto.scrypt` with random 16-byte salt.
- [`src/lib/auth/session.ts`](file:///c:/SQL_WEB2/src/lib/auth/session.ts): HS256 JWT generation and validation via `jose`.
- [`src/lib/auth/cookies.ts`](file:///c:/SQL_WEB2/src/lib/auth/cookies.ts): Secure `httpOnly`, `sameSite=lax` cookie management (`sql_platform_session`).
- [`src/lib/progress/service.ts`](file:///c:/SQL_WEB2/src/lib/progress/service.ts): Progression calculations ($\text{Level} = \lfloor\sqrt{\text{totalXP} / 50}\rfloor + 1$, streak tracking, accuracy rate, and explainable recommendation engine).

### 2.6 REST APIs (`src/app/api/v1/`)
- `auth/register/route.ts`: User registration.
- `auth/login/route.ts`: User authentication.
- `auth/logout/route.ts`: Cookie invalidation.
- `auth/me/route.ts`: Current session user profile & XP.
- `topics/route.ts`: Catalog index with completion stats.
- `topics/[slug]/questions/route.ts`: Topic-specific questions.
- `questions/[slug]/route.ts`: Problem statement, metadata, user solve status.
- `questions/[slug]/schema/route.ts`: Table columns, primary keys, and 10-row preview.
- `questions/[slug]/execute/route.ts`: Runs query against visible sample data.
- `questions/[slug]/submit/route.ts`: Evaluates query against all 3 test cases, records attempt, awards XP.
- `questions/[slug]/hints/route.ts`: Unlocks next progressive hint (-20% XP penalty).
- `questions/[slug]/solution/route.ts`: Reveals query & explanation (forfeits XP).
- `user/dashboard/route.ts`: Returns full progression stats, mastery breakdown, and recommendations.
- `user/saved-questions/route.ts`: Bookmarked questions management.
- `user/settings/route.ts`: Practice Mode default and editor settings.
- `playground/execute/route.ts`: Free-form multi-statement SQL execution.
- `playground/reset/route.ts`: Resets playground database schema.

### 2.7 Frontend UI Pages & Components
- [`src/app/page.tsx`](file:///c:/SQL_WEB2/src/app/page.tsx): Modern dark-themed landing page with feature badges and quick CTA.
- [`src/app/topics/page.tsx`](file:///c:/SQL_WEB2/src/app/topics/page.tsx): Curriculum directory grouped across 10 levels with progress counters.
- [`src/app/practice/[slug]/page.tsx`](file:///c:/SQL_WEB2/src/app/practice/%5Bslug%5D/page.tsx): 3-panel IDE layout:
  - Left: Problem tabs (Description, Hints, Solution, Results, Test Cases).
  - Center: Monaco SQL Editor with autocompletion, format, reset, and anti-paste Practice Mode.
  - Right: Schema Explorer with collapsible tables and sample row drawer.
- [`src/app/playground/page.tsx`](file:///c:/SQL_WEB2/src/app/playground/page.tsx): Free-form SQL workspace supporting DDL/DML, table creation, reset, and CSV/JSON export.
- [`src/app/dashboard/page.tsx`](file:///c:/SQL_WEB2/src/app/dashboard/page.tsx): Performance metrics (Level, XP progress bar, accuracy rate, streak, explainable recommendation card, topic mastery).
- [`src/app/profile/page.tsx`](file:///c:/SQL_WEB2/src/app/profile/page.tsx): User profile, Practice Mode anti-paste toggle, and bookmarked questions.
- [`src/app/login/page.tsx`](file:///c:/SQL_WEB2/src/app/login/page.tsx) & [`src/app/register/page.tsx`](file:///c:/SQL_WEB2/src/app/register/page.tsx): Authentication forms.
- [`src/components/Navbar.tsx`](file:///c:/SQL_WEB2/src/components/Navbar.tsx): Header with XP pill, level indicator, navigation, and user menu.

---

## 3. Automated Test Suite Breakdown (20 of 20 Passing)

Run tests via:
```powershell
npm run test
```

### Test Results
1. **`tests/security/sandbox.test.ts` (10 tests - ALL PASSED):**
   - Blocks multi-statement query injection (`SELECT 1; DROP TABLE...`).
   - Blocks `COPY` file operations.
   - Blocks access to filesystem routines (`pg_read_file`, `pg_ls_dir`).
   - Blocks extension creation (`CREATE EXTENSION`).
   - Blocks role modification attempts (`SET ROLE postgres`).
   - Enforces timeout on runaway queries (`pg_sleep`).
   - Enforces max row limit (truncation at 1,000 rows with `hasMore: true`).
   - Rejects queries exceeding 10,000 character limit.
   - Guarantees transaction rollback (mutations never persist in sample data).
   - Zero test data leakage (hidden test cases never leak rows or expected values).

2. **`tests/content/curriculum-validation.test.ts` (4 tests - ALL PASSED):**
   - Verifies all 51 curriculum topics exist and are sequentially numbered.
   - Verifies every topic contains $\ge 3$ published questions (153 total).
   - Verifies all 153 questions contain $\ge 3$ progressive hints, line-by-line explanation, and $\ge 3$ test cases.
   - Executes solution queries against real PostgreSQL 16 engine with 100% success.

3. **`tests/api/api-flow.test.ts` (6 tests - ALL PASSED):**
   - User registration, password hashing, and session authentication.
   - Submits correct SQL, passes all 3 test cases, records attempt, awards XP.
   - Submits incorrect SQL, records failed attempt, awards zero XP.
   - Unlocks hints with proper 20% penalty calculation.
   - Reveals solution and enforces complete XP forfeiture.
   - Computes progression stats and Level formula $\lfloor\sqrt{\text{totalXP}/50}\rfloor + 1$.

---

## 4. Key Configuration & Run Commands

```powershell
# 1. Install dependencies
npm install

# 2. Run all 20 automated tests
npm run test

# 3. Build optimized production bundle (0 errors, 21 routes)
npm run build

# 4. Start local development server on http://localhost:3000
npm run dev
```

---

## 5. Ready-to-Use Prompts for Further Feature Extension

Copy and paste any of the following prompts directly to continue developing:

### Prompt 1: Add Social Leaderboard & Global Rankings
```text
I want to add a global leaderboard feature to the platform.
1. Create a new REST API endpoint GET /api/v1/leaderboard that returns the top 50 users ranked by total XP, level, questions solved, and accuracy rate.
2. Create a new page at src/app/leaderboard/page.tsx with a podium view for top 3 and a clean table for ranks 4-50.
3. Highlight the current logged-in user's rank even if they are outside the top 50.
4. Add a navigation link to Leaderboard in Navbar.tsx.
5. Add test cases in tests/api/api-flow.test.ts verifying the leaderboard ranking logic.
```

### Prompt 2: Add Real-Time Query Plan Visualizer (`EXPLAIN ANALYZE`)
```text
Enhance the Practice and Playground workspaces with an interactive PostgreSQL query execution plan visualizer:
1. When user clicks "Explain Plan", send query with EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) to the backend runner.
2. In the frontend, render a visual execution tree showing node types (Seq Scan, Index Scan, Hash Join, Sort), execution time per node, and row count discrepancies.
3. Provide a collapsible panel next to ResultTable.
4. Ensure AST validator permits EXPLAIN queries safely while maintaining isolation.
```

### Prompt 3: Add Dual-Runner Native PostgreSQL Container Switch
```text
Extend sandbox-runner.ts to support dynamic switching between the WebAssembly PGlite engine and a dedicated native PostgreSQL 16 Docker container via pg.Pool:
1. Detect whether the native container is reachable (via DATABASE_URL_SANDBOX in .env).
2. If reachable, execute queries in the native container under the restricted role sandbox_readonly with statement_timeout=5000.
3. If unreachable, gracefully fall back to the in-process WebAssembly PGlite engine.
4. Add an indicator in the UI showing which execution backend is currently active.
```

### Prompt 4: Add Timed Assessment & Interview Mock Mode
```text
Add an "Interview Mode" / Timed Assessment module:
1. Allow users to start a 45-minute timed mock interview selecting 3 questions (1 Easy, 1 Medium, 1 Hard) from different topics.
2. During the mock assessment, hide solutions and disable progressive hints.
3. Include a countdown timer at the top with auto-submission on expiration.
4. Produce a detailed final interview scorecard evaluating execution time, first-attempt accuracy, and SQL clean-code style.
```
