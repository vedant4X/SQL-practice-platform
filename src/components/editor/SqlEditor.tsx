"use client";

import React, { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { OnMount } from "@monaco-editor/react";
import { format } from "sql-formatter";
import { Play, Send, AlignLeft, RotateCcw, RefreshCw, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Dialect } from "@/lib/engine/types";
import { useTheme } from "@/lib/theme/ThemeContext";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-[#090d16] text-slate-500">
      <div className="flex items-center gap-2 text-xs">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
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
  nextSlug?: string | null;
  onNextQuestion?: () => void;
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
  nextSlug,
  onNextQuestion,
}: SqlEditorProps) {
  const editorRef = useRef<any>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isPostgres = dialect === "postgresql";

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define Minimalist Dark Theme
    monaco.editor.defineTheme("sqljudge-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "fbbf24" },
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "identifier", foreground: "e2e8f0" },
      ],
      colors: {
        "editor.background": "#090d16",
        "editor.lineHighlightBackground": "#111827",
        "editorCursor.foreground": "#38bdf8",
        "editorWhitespace.foreground": "#1e293b",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#94a3b8",
      },
    });

    // Define Minimalist Light Theme (High Contrast)
    monaco.editor.defineTheme("sqljudge-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "005cc5", fontStyle: "bold" },
        { token: "string", foreground: "15803d" },
        { token: "number", foreground: "d97706" },
        { token: "comment", foreground: "6e7781", fontStyle: "italic" },
        { token: "identifier", foreground: "0969da" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#f8fafc",
        "editorCursor.foreground": "#005cc5",
        "editorWhitespace.foreground": "#e2e8f0",
        "editorLineNumber.foreground": "#94a3b8",
        "editorLineNumber.activeForeground": "#0f172a",
      },
    });

    monaco.editor.setTheme(isDark ? "sqljudge-dark" : "sqljudge-light");

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
  };

  // Re-sync Monaco theme on theme switch
  useEffect(() => {
    if (editorRef.current && (window as any).monaco) {
      (window as any).monaco.editor.setTheme(isDark ? "sqljudge-dark" : "sqljudge-light");
    }
  }, [isDark]);

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
    <div className="flex h-full flex-col bg-white dark:bg-[#090d16] transition-colors">
      {/* Editor Action Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFormat}
            disabled={isLoading}
            className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            title="Format SQL (Ctrl+Shift+F)"
          >
            <AlignLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Format</span>
          </button>
          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            title="Reset code"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* RUN BUTTON */}
          <button
            onClick={onRun}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition shadow-sm"
            title="Execute query (Ctrl+Enter)"
          >
            <Play className={`h-3 w-3 ${isLoading ? "animate-spin" : "fill-current"}`} />
            <span>Run</span>
          </button>

          {/* SUBMIT BUTTON */}
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            title="Submit query against test cases (Ctrl+Shift+Enter)"
          >
            <Send className="h-3 w-3" />
            <span>Submit</span>
          </button>

          {/* NEXT QUESTION ARROW BUTTON */}
          {nextSlug && (
            <Link
              href={`/${dialect}/practice/${nextSlug}`}
              className="flex items-center gap-1 rounded border border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition shadow-sm"
              title="Travel to Next Question"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={isPostgres ? "pgsql" : "mysql"}
          value={value}
          onChange={(v) => onChange(v || "")}
          onMount={handleEditorDidMount}
          theme={isDark ? "sqljudge-dark" : "sqljudge-light"}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            lineNumbers: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
}
