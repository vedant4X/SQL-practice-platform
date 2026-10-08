"use client";

import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { OnMount } from "@monaco-editor/react";
import { format } from "sql-formatter";
import { Play, Send, AlignLeft, RotateCcw, ShieldAlert, RefreshCw } from "lucide-react";
import { Dialect } from "@/lib/engine/types";

// Dynamic import with ssr: false for Monaco Editor (Performance item D)
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0d1117] text-slate-500">
      <div className="flex items-center gap-2 text-xs">
        <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
        <span>Initializing SQL Editor...</span>
      </div>
    </div>
  ),
});

interface SqlEditorProps {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isLoading?: boolean;
  practiceMode?: boolean;
  onTogglePracticeMode?: () => void;
  dialect?: Dialect;
}

export default function SqlEditor({
  value,
  onChange,
  onRun,
  onSubmit,
  onReset,
  isLoading = false,
  practiceMode = false,
  onTogglePracticeMode,
  dialect = "postgresql",
}: SqlEditorProps) {
  const editorRef = useRef<any>(null);
  const [pasteBlockedNotice, setPasteBlockedNotice] = useState(false);
  const isPostgres = dialect === "postgresql";

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom dark theme
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
        "editorWhitespace.foreground": "#334155",
      },
    });

    monaco.editor.setTheme("sqljudge-dark");

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        onSubmit();
      }
    );

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        handleFormat();
      }
    );

    // Practice Mode (anti-paste enforcement in editor container)
    const domNode = editor.getDomNode();
    if (domNode) {
      domNode.addEventListener(
        "paste",
        (e: ClipboardEvent) => {
          if (practiceMode) {
            e.preventDefault();
            e.stopPropagation();
            setPasteBlockedNotice(true);
            setTimeout(() => setPasteBlockedNotice(false), 4000);
          }
        },
        true
      );

      domNode.addEventListener(
        "drop",
        (e: DragEvent) => {
          if (practiceMode) {
            e.preventDefault();
            e.stopPropagation();
            setPasteBlockedNotice(true);
            setTimeout(() => setPasteBlockedNotice(false), 4000);
          }
        },
        true
      );
    }
  };

  const handleFormat = () => {
    try {
      const formatted = format(value, {
        language: isPostgres ? "postgresql" : "mysql",
        keywordCase: "upper",
        linesBetweenQueries: 2,
      });
      onChange(formatted);
    } catch {
      // Keep existing on parse failure
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-background-border bg-editor-bg">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-background-border bg-background-darker/80 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`font-mono font-bold tracking-wide uppercase text-[11px] px-2 py-0.5 rounded border ${
              isPostgres
                ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                : "border-teal-500/30 bg-teal-500/10 text-teal-400"
            }`}
          >
            {isPostgres ? "PostgreSQL 16" : "MySQL 8.4"}
          </span>
          {onTogglePracticeMode && (
            <button
              onClick={onTogglePracticeMode}
              className={`flex items-center gap-1 rounded px-2 py-0.5 font-medium transition ${
                practiceMode
                  ? "border border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border border-slate-700 bg-background-card text-slate-400 hover:text-slate-200"
              }`}
              title="Practice Mode disables pasting to build tactile SQL memory"
            >
              <ShieldAlert className="h-3 w-3" />
              Practice Mode: {practiceMode ? "ON" : "OFF"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            disabled={isLoading}
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            title="Format SQL (Ctrl+Shift+F)"
          >
            <AlignLeft className="h-3 w-3" />
            Format
          </button>
          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            title="Reset to starter query"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
          <button
            onClick={onRun}
            disabled={isLoading}
            className={`flex items-center gap-1.5 rounded bg-slate-700 px-3 py-1 font-medium text-white transition hover:bg-slate-600 disabled:opacity-50`}
            title="Run Query (Ctrl+Enter)"
          >
            <Play className={`h-3 w-3 fill-current ${isPostgres ? "text-sky-400" : "text-teal-400"}`} />
            Run
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-1 font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            title="Submit & Judge against all test cases (Ctrl+Shift+Enter)"
          >
            <Send className="h-3 w-3" />
            Submit
          </button>
        </div>
      </div>

      {/* Practice Mode Anti-Paste Alert */}
      {pasteBlockedNotice && (
        <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Paste is disabled in Practice Mode. Type your query to build muscle memory.</span>
        </div>
      )}

      {/* Monaco Code Editor */}
      <div className="relative flex-1">
        <Editor
          height="100%"
          language={isPostgres ? "pgsql" : "mysql"}
          value={value}
          onChange={(v) => onChange(v || "")}
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
            suggestOnTriggerCharacters: true,
            renderLineHighlight: "all",
          }}
        />
      </div>
    </div>
  );
}
