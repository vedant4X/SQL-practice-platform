# SQL Practice & Learning Platform (Dual-Dialect: MySQL + PostgreSQL)

A production-quality SQL practice platform supporting authentic PostgreSQL 16 and MySQL 8.4 engines with multi-test automated judging, progressive hints, line-by-line solution walkthroughs, and separate progress tracking.

---

## Quick Start

### 1. Prerequisites
- **Node.js:** v20.x or v22.x LTS (compatible with Node v24)
- **Package Manager:** npm

### 2. Installation
```bash
npm install
```

### 3. Running Locally

#### Step A: Start MySQL Sandbox Daemon (Port 3307)
*Required for MySQL questions and playground:*
```bash
# Via convenience script:
.\run-mysql.bat

# Or directly via PowerShell:
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --port=3307 --datadir="c:\SQL_WEB2\data\mysql-sandbox-data" --skip-log-bin --local-infile=OFF --secure-file-priv="" --sql-mode="ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION" --character-set-server=utf8mb4 --collation-server=utf8mb4_0900_ai_ci --default-time-zone="+00:00"
```

#### Step B: Start Web Server
```bash
# Development Mode (hot reloading):
npm run dev

# Production Mode (Recommended: fast, optimized, <15ms execution):
npm run build
npm run start
# (or double-click .\start.bat)
```
Once started, visit: **`http://localhost:3000`**

---

## Run It Fast Locally (Performance Tips)

1. **Development vs. Production:**  
   Next.js in `dev` mode compiles TypeScript and routes on demand upon the first request. For realistic performance (<100ms API responses, <15ms submission evaluation), use `npm run build && npm run start`.
2. **Antivirus Exclusions on Windows:**  
   If running on Windows with Windows Defender, exclude the workspace folder (`C:\SQL_WEB2`), `node_modules`, and `.next` from real-time file scanning. This avoids locking files during PGlite WASM memory initialization.
3. **Verify Performance:**  
   Run the automated engine and judge latency check:
   ```bash
   npm run perf:check
   ```

---

## Dialect Navigation & Architecture

- **PostgreSQL Track:** `http://localhost:3000/postgresql/topics`  
  Backed by authentic PostgreSQL 16 (`@electric-sql/pglite` in-process WASM engine). 51 curriculum topics with 1,632 published questions (32 per topic).
- **MySQL Track:** `http://localhost:3000/mysql/topics`  
  Backed by authentic MySQL 8.4 LTS daemon with connection pooling, multi-dataset judging, and separate curriculum tracking. 51 curriculum topics with 1,632 published questions (32 per topic).
- **Dialect Switcher:** Accessible in the top navigation bar at all times, with cookie persistence (`sql_dialect`).

---

## Verification & Test Commands

- **Run all automated tests (50/50 passing):**
  ```bash
  npm run test
  ```
- **Validate all 3,264 questions against real engines:**
  ```bash
  npm run questions:validate
  ```
- **Generate Question Progress Ledger:**
  ```bash
  npm run questions:report
  ```
- **Security Sandbox Suite:**
  ```bash
  npm run test:security
  ```
- **Production Build:**
  ```bash
  npm run build
  ```
