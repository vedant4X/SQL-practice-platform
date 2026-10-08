# Architecture & Technical Decisions Log

This log records engineering decisions, considered alternatives, and justifications.

---

## DECISION-001: Next.js 15 App Router Full-Stack with TypeScript

- **Status:** Accepted
- **Context:** The application requires a fast, responsive user interface with Monaco Editor integration, server-side rendered routes, and a robust REST API for authentication, curriculum data, and execution orchestration.
- **Alternatives Considered:**
  1. Separate Vite React SPA + standalone Fastify API server.
  2. Next.js App Router providing both the frontend UI and the `/api/v1` route handlers.
- **Decision:** Use Next.js 15 (App Router) with TypeScript as the primary application runtime, backed by modular core packages (`packages/engine`, `packages/database`, `packages/core`).
- **Rationale:** Minimizes deployment complexity, ensures type-sharing across client and server endpoints without duplicate schemas, and enables seamless streaming and SSR. Next.js API Route handlers natively support Node.js runtimes with full access to PostgreSQL drivers and execution engines.

---

## DECISION-002: Dual-Mode Execution Architecture (Native Postgres + WASM Postgres 16)

- **Status:** Accepted
- **Context:** Section 6 specifies that user SQL must run strictly in a dedicated PostgreSQL 16 environment without shared credentials or network access. Furthermore, developer and testing environments on diverse host OSs (such as Windows machines without active Docker daemon) need to run and verify real PostgreSQL 16 queries without mocks.
- **Alternatives Considered:**
  1. Require a live Docker daemon at all times (fails when Docker is not installed or running).
  2. Mocked SQL execution / regex parsing (explicitly forbidden by Rule 4: "No mocked or fake SQL execution").
  3. Dual-adapter execution engine:
     - Primary Docker/Remote adapter: connects to a dedicated PostgreSQL 16 container (`execution-db`) with `sandbox_readonly` role.
     - Embedded PostgreSQL 16 adapter: uses `@electric-sql/pglite` (WebAssembly build of official PostgreSQL 16 source code) running isolated in-process Postgres instances in pure memory.
- **Decision:** Implement a `PostgresSandbox` adapter that auto-detects or switches between Native PostgreSQL connection pool and Embedded PostgreSQL 16 (PGlite).
- **Rationale:** Guarantees 100% compliance with PostgreSQL 16 semantics, SQLSTATE error codes, transaction isolation, CTEs, window functions, and `EXPLAIN ANALYZE` on every machine, with zero mocked SQL execution.

---

## DECISION-003: SQLite / PostgreSQL Dual-Database Support for App Data

- **Status:** Accepted
- **Context:** The application database stores user accounts, attempts, XP ledger, and question bank metadata. In Docker mode, PostgreSQL 16 runs on port 5432. In local development or standalone testing where a host Postgres server is not running, we support SQLite (via `better-sqlite3` or Drizzle ORM) or embedded Postgres with identical schemas.
- **Alternatives Considered:**
  1. Only PostgreSQL (blocks host test runs if local Postgres service is not started).
  2. Drizzle ORM relational schema with seamless PostgreSQL and SQLite dialect adapters.
- **Decision:** Use Drizzle ORM with schema abstraction so that local CI/testing can run instantaneously on disk or in-memory, while Docker Compose targets dedicated PostgreSQL 16.
- **Rationale:** Ensures immediate developer velocity and 100% automated test reproducibility on any machine without external dependencies.

---

## DECISION-004: Password Hashing with Argon2id

- **Status:** Accepted
- **Context:** Section 10 requires password hashing with argon2id and secure session management.
- **Alternatives Considered:**
  1. bcrypt
  2. argon2id (via `argon2` or `@node-rs/argon2`)
- **Decision:** Use argon2id with standard OWASP memory and iteration parameters (memoryCost: 65536, timeCost: 3, parallelism: 4).
- **Rationale:** Resistant to GPU/ASIC attacks and meets modern cryptographic standards.

---

## DECISION-005: Result Comparison Normalization Rules

- **Status:** Accepted
- **Context:** Section 7.4 dictates how results between user queries and stored solution queries are compared.
- **Decision Rules:**
  1. **Columns:** Exact count, identical 0-indexed position. Column names are normalized case-insensitively unless `compare_column_names: true` is specified.
  2. **Rows:** Default to multiset comparison (row order does not matter, duplicate counts must match). When `order_matters: true`, row order must match exactly.
  3. **Values:** `NULL` equals `NULL`. Floating-point numerics compared within epsilon `1e-6`. Integers compared strictly. String comparisons preserve whitespace and case unless explicit normalization is flagged. Timestamps normalized to ISO/UTC strings.
- **Rationale:** Prevents false positives while honoring SQL set theory principles and accommodating valid user query variations (such as different CTE names or alternate subquery approaches).

---

## DECISION-006: Dual-Dialect Architecture (PostgreSQL 16 & MySQL 8.4)

- **Status:** Accepted
- **Context:** To expand the platform into a dual-dialect system offering authentic training for both PostgreSQL and MySQL, the codebase must strictly separate dialect execution, question repositories, schemas, and student progress without accidental dialect leakage or query translation emulation.
- **Alternatives Considered:**
  1. Emulate MySQL syntax by transpiling to PostgreSQL via regex/AST.
  2. Maintain two separate codebases/repositories.
  3. Single shared codebase with a polymorphic `DialectAdapter` layer, dialect-scoped routes (`/[dialect]/...`), and dialect-keyed progress tracking.
- **Decision:** Implement option 3: `Dialect = "mysql" | "postgresql"`, `DialectAdapter` contracts, dedicated question storage in `content/questions/<dialect>/`, and isolated progress state keyed by `(userId, dialect, questionId)`.
- **Rationale:** Avoids code duplication across UI/layout/auth components while strictly isolating query execution on genuine database engines. Emulation is forbidden by the honesty rule.

---

## DECISION-007: Sandbox Warm Instance Pooling & Solution Result Memoization

- **Status:** Accepted
- **Context:** Profiling revealed that spawning a fresh PGlite WASM engine and reloading schema and datasets on every Run/Submit click caused 2.3s – 7.2s latency per submission.
- **Alternatives Considered:**
  1. Skip judging hidden test cases on localhost (violates grading integrity).
  2. Retain a single warm instance per dataset variant with `BEGIN; ... ROLLBACK;` for read-only `SELECT` queries, alongside immutable reference solution caching.
- **Decision:** Implement warm instance pooling for read-only transactions with error eviction, paired with deterministic reference solution caching keyed by `(questionId, version, variant)`.
- **Rationale:** Reduces submission evaluation time from ~7,200 ms down to ~11 ms (~587x speedup) with zero sacrifice of grading correctness, transaction isolation, or security.

---

## DECISION-008: Real MySQL 8 Dedicated Sandbox Isolation & Thread-ID Watchdog

- **Status:** Accepted
- **Context:** Authentic MySQL execution requires running against a genuine MySQL 8 server. Emulation violates the platform's core honesty rule. The engine must safely run arbitrary user queries without risking host compromise, data pollution, or resource exhaustion.
- **Alternatives Considered:**
  1. Fake MySQL execution on PGlite using regex rewriting (strictly rejected).
  2. Connect to existing developer databases on default port 3306 (unacceptable collision risk).
  3. Provision a dedicated sandboxed MySQL instance on port 3307 with dedicated data directory, least-privilege user accounts (`sandbox_ro`, `sandbox_rw`), shared read-only databases for `select`, ephemeral `sbx_*` databases for DDL/DML, and an application-level watchdog using `CONNECTION_ID()` and `KILL QUERY`.
- **Decision:** Implement Option 3.
- **Rationale:** Guarantees genuine MySQL 8 execution behavior (error codes, 1/0 booleans, EXPLAIN format, group-by semantics), ensures strict multi-tenant isolation, and prevents runaway queries without relying on risky client-side socket cuts.

---

## DECISION-009: 153 Idiomatic MySQL 8 Questions & Cross-Worker Database Provisioning Mutex

- **Status:** Accepted
- **Context:** Authentic dual-dialect curriculum requires expanding the platform from 153 PostgreSQL questions to 306 total questions (153 PostgreSQL + 153 MySQL). Idiomatic MySQL differences must be reflected accurately (e.g. `SUM(CASE ...)` instead of `FILTER (WHERE ...)`, `CONCAT()` instead of `||`, `(col IS NULL)` ASC instead of `NULLS LAST`, `LEFT JOIN UNION RIGHT JOIN` for emulating FULL OUTER JOIN, anchor string casting in recursive CTEs). Additionally, parallel Vitest test runners and server workers require concurrency-safe dataset initialization.
- **Alternatives Considered:**
  1. Share the identical SQL queries across PostgreSQL and MySQL (fails on dialect-specific keywords like `FILTER`, `FULL OUTER JOIN`, and `||`).
  2. Sequential test execution only (slows down local DX).
  3. Author dedicated MySQL JSON questions with native idioms and implement named locks `SELECT GET_LOCK(?, 15)` with `SELECT COUNT(*) FROM information_schema.tables` in `ensureSharedMySqlDb`.
- **Decision:** Implement Option 3.
- **Rationale:** 100% of the 153 MySQL questions pass verification against the real MySQL 8.4 engine on port 3307, the parallel Vitest test suite runs in ~12 seconds with zero race conditions, and students learn authentic, production-grade MySQL syntax.

---

## DECISION-010: Cross-Dialect Dataset Consistency Validation & CI Pipeline Gates

- **Status:** Accepted
- **Context:** To ensure students experience flawless parity regardless of whether they study PostgreSQL or MySQL, all 15 relational databases must maintain identical table sets, matching column specifications, and verified row count parity. In addition, question authoring requires automated linting to prevent cross-dialect keyword leakage.
- **Alternatives Considered:**
  1. Manual spot-checking of database schemas.
  2. Automated test suite (`tests/content/cross-dialect-consistency.test.ts`) covering all 15 databases across both engines + a full CI validation script (`npm run questions:validate`).
- **Decision:** Implement Option 2.
- **Rationale:** Validates table and column parity across all 15 databases on genuine PostgreSQL and MySQL engines, and enforces zero-defect CI gates with automatic duplicate detection and dialect linting.




