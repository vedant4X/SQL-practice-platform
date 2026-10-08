"use client";

import React, { useState, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { format } from "sql-formatter";
import {
  Play,
  RotateCcw,
  AlignLeft,
  Trash2,
  Download,
  Terminal,
  Clock,
  Table as TableIcon,
  Sparkles,
  Info,
} from "lucide-react";
import ResultTable from "@/components/practice/ResultTable";
import { QueryExecutionResult } from "@/lib/engine/types";

const INITIAL_PLAYGROUND_SQL = `-- Interactive PostgreSQL 16 Playground
-- You have full DDL/DML capabilities in this isolated session.
-- Try creating tables, inserting data, running complex queries:

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

export default function PlaygroundPage() {
  const [sql, setSql] = useState<string>(INITIAL_PLAYGROUND_SQL);
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
        { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "f59e0b" },
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.lineHighlightBackground": "#161b22",
        "editorCursor.foreground": "#38bdf8",
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
        language: "postgresql",
        keywordCase: "upper",
        linesBetweenQueries: 2,
      });
      setSql(formatted);
    } catch {
      // Keep existing on parse failure
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
      const res = await fetch("/api/v1/playground/execute", {
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
          message: err.message || "Failed to execute playground query",
          userFacingMessage: err.message || "Failed to execute playground query",
        },
        executionTimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetDb = async () => {
    if (confirm("Reset playground database? All custom tables and modifications will be dropped.")) {
      try {
        await fetch("/api/v1/playground/reset", { method: "POST" });
        setStatusMessage("Sandbox database reset successfully.");
        setResult(null);
        setTimeout(() => setStatusMessage(null), 3500);
      } catch (err) {
        console.error("Failed to reset sandbox:", err);
      }
    }
  };

  const handleExportCsv = () => {
    if (!result?.rows || result.rows.length === 0 || !result.columns) return;
    const header = result.columns.join(",");
    const rows = result.rows.map((row) =>
      result.columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sql_query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    if (!result?.rows || result.rows.length === 0) return;
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.rows, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", `sql_query_result_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background-darker">
      {/* Top action toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-background-border bg-background-card/40 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-white">PostgreSQL 16 Playground</span>
          <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            v16.4 WebAssembly Engine
          </span>
          {statusMessage && (
            <span className="ml-3 text-xs font-semibold text-emerald-400 animate-pulse">
              {statusMessage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            className="flex items-center gap-1 rounded bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Format SQL (Ctrl+Shift+F)"
          >
            <AlignLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Format</span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-rose-400 transition"
            title="Clear editor"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            onClick={handleResetDb}
            className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-amber-300 hover:bg-slate-700 transition"
            title="Reset sandbox database"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Sandbox</span>
          </button>

          {result?.rows && result.rows.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 rounded border border-slate-700 bg-background-dark px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:text-white"
                title="Download results as CSV"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1 rounded border border-slate-700 bg-background-dark px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:text-white"
                title="Download results as JSON"
              >
                <Download className="h-3.5 w-3.5 text-primary-light" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
          >
            <Play className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : "fill-current"}`} />
            <span>{isRunning ? "Running..." : "Run (Ctrl+Enter)"}</span>
          </button>
        </div>
      </div>

      {/* Split layout: Editor on Top, Results on Bottom */}
      <div className="grid flex-1 grid-rows-2 overflow-hidden">
        {/* Editor Half */}
        <div className="h-full border-b border-background-border">
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={sql}
            onChange={(val) => setSql(val || "")}
            onMount={handleEditorDidMount}
            theme="sqljudge-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 12 },
            }}
          />
        </div>

        {/* Results Half */}
        <div className="flex h-full flex-col bg-background-card/30">
          <div className="flex items-center justify-between border-b border-background-border bg-background-darker/60 px-4 py-2">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Execution Results
              </span>
              {result?.success && (
                <span className="ml-2 text-xs font-mono text-emerald-400">
                  {result.rowCount} {result.rowCount === 1 ? "row" : "rows"} ({result.executionTimeMs}ms)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Info className="h-3 w-3" />
              <span>Full PostgreSQL syntax supported (DDL, DML, CTEs, Windowing)</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3">
            <ResultTable result={result} isLoading={isRunning} />
          </div>
        </div>
      </div>
    </div>
  );
}
