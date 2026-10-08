"use client";

import React, { useState, useRef, use } from "react";
import dynamic from "next/dynamic";
import { OnMount } from "@monaco-editor/react";
import { format } from "sql-formatter";
import {
  Play,
  RotateCcw,
  AlignLeft,
  Trash2,
  Terminal,
  Clock,
  Table as TableIcon,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import ResultTable from "@/components/practice/ResultTable";
import { Dialect, QueryExecutionResult } from "@/lib/engine/types";

// Dynamic Monaco with ssr: false
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0d1117] text-slate-500">
      <div className="flex items-center gap-2 text-xs">
        <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
        <span>Loading SQL Playground Editor...</span>
      </div>
    </div>
  ),
});

const PG_PLAYGROUND_SQL = `-- Interactive PostgreSQL 16 Playground
-- Full DDL/DML capabilities in this isolated session.
CREATE TABLE IF NOT EXISTS demo_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    budget NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'active'
);

INSERT INTO demo_projects (name, budget, status) VALUES
('PostgreSQL Sandbox', 25000.00, 'active'),
('Query Optimizer', 18500.50, 'in_progress'),
('Database Sharding', 34000.00, 'planning');

SELECT 
    name, 
    budget, 
    status,
    ROUND(budget * 1.15, 2) AS projected_cost
FROM demo_projects
ORDER BY budget DESC;
`;

const MYSQL_PLAYGROUND_SQL = `-- Interactive MySQL 8.4 Playground
-- Full DDL/DML capabilities in this isolated session.
CREATE TABLE IF NOT EXISTS demo_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    budget DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'active'
);

INSERT INTO demo_projects (name, budget, status) VALUES
('MySQL Sandbox', 25000.00, 'active'),
('InnoDB Buffer Pool', 18500.50, 'in_progress'),
('Replication Cluster', 34000.00, 'planning');

SELECT 
    name, 
    budget, 
    status,
    ROUND(budget * 1.15, 2) AS projected_cost
FROM demo_projects
ORDER BY budget DESC;
`;

export default function DialectPlaygroundPage({
  params,
}: {
  params: Promise<{ dialect: string }>;
}) {
  const resolvedParams = use(params);
  const dialect: Dialect = resolvedParams.dialect === "mysql" ? "mysql" : "postgresql";
  const isPostgres = dialect === "postgresql";

  const [sql, setSql] = useState<string>(isPostgres ? PG_PLAYGROUND_SQL : MYSQL_PLAYGROUND_SQL);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<QueryExecutionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme("sqljudge-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: isPostgres ? "38bdf8" : "2dd4bf", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "f59e0b" },
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.lineHighlightBackground": "#161b22",
        "editorCursor.foreground": isPostgres ? "#38bdf8" : "#2dd4bf",
      },
    });

    monaco.editor.setTheme("sqljudge-dark");

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });
  };

  const handleFormat = () => {
    try {
      const formatted = format(sql, {
        language: isPostgres ? "postgresql" : "mysql",
        keywordCase: "upper",
        linesBetweenQueries: 2,
      });
      setSql(formatted);
    } catch {
      // Keep existing
    }
  };

  const handleClear = () => {
    setSql("");
    setResult(null);
  };

  const handleRun = async () => {
    if (!sql.trim() || isRunning) return;
    setIsRunning(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/${dialect}/playground/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (data?.success && data?.data?.result) {
        setResult(data.data.result);
      } else if (data?.error) {
        setResult({
          success: false,
          columns: [],
          rows: [],
          rowCount: 0,
          totalRows: 0,
          hasMore: false,
          error: data.error,
          executionTimeMs: 0,
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        columns: [],
        rows: [],
        rowCount: 0,
        totalRows: 0,
        hasMore: false,
        error: {
          code: "500",
          message: err.message || "Failed to execute",
          userFacingMessage: err.message || "Execution failed",
        },
        executionTimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Resetting will wipe all tables and session modifications. Proceed?")) {
      try {
        await fetch(`/api/v1/${dialect}/playground/reset`, { method: "POST" });
        setSql(isPostgres ? PG_PLAYGROUND_SQL : MYSQL_PLAYGROUND_SQL);
        setResult(null);
        setStatusMessage("Session reset to initial schema.");
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        console.error("Reset failed:", err);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background-darker">
      {/* Playground Header */}
      <div className="flex h-12 items-center justify-between border-b border-background-border bg-background-card/50 px-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              isPostgres ? "bg-sky-500/10 text-sky-400" : "bg-teal-500/10 text-teal-400"
            }`}
          >
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">
                {isPostgres ? "PostgreSQL 16" : "MySQL 8.4"} Playground
              </h1>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                  isPostgres
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                    : "border-teal-500/30 bg-teal-500/10 text-teal-300"
                }`}
              >
                {isPostgres ? "In-Process Isolated" : "MySQL 8.4 Isolated"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusMessage && (
            <span className="text-xs text-emerald-400 font-medium animate-fade-in mr-2">
              {statusMessage}
            </span>
          )}
          <button
            onClick={handleFormat}
            disabled={isRunning}
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            title="Format SQL (Ctrl+Shift+F)"
          >
            <AlignLeft className="h-3 w-3" />
            Format
          </button>
          <button
            onClick={handleClear}
            disabled={isRunning}
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            title="Clear Editor"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
          <button
            onClick={handleReset}
            disabled={isRunning}
            className="flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
            title="Reset playground tables and data"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            title="Execute Query (Ctrl+Enter)"
          >
            <Play className="h-3 w-3 fill-current" />
            Run
          </button>
        </div>
      </div>

      {/* Editor & Results Split */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        {/* Editor Half */}
        <div className="border-r border-background-border h-full flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              language={isPostgres ? "pgsql" : "mysql"}
              value={sql}
              onChange={(v) => setSql(v || "")}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 8, bottom: 8 },
              }}
            />
          </div>
        </div>

        {/* Results Half */}
        <div className="flex flex-col h-full overflow-hidden bg-background-dark">
          <div className="flex h-9 items-center justify-between border-b border-background-border bg-background-darker/60 px-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <TableIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>Query Execution Output</span>
            </div>
            {result?.success && (
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {result.executionTimeMs} ms
                </span>
                <span>{result.rowCount} row(s)</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {isRunning ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                <div className="flex items-center gap-2 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span>Executing in sandbox...</span>
                </div>
              </div>
            ) : result ? (
              <ResultTable result={result} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 text-xs space-y-2">
                <Terminal className="h-8 w-8 text-slate-600" />
                <p>Run a query to view execution results, row sets, or errors.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
