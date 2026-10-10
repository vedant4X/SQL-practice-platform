"use client";

import React, { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { OnMount } from "@monaco-editor/react";
import { format } from "sql-formatter";
import { Play, Send, AlignLeft, RotateCcw, RefreshCw, ArrowRight, Check, Cloud } from "lucide-react";
import Link from "next/link";
import { Dialect } from "@/lib/engine/types";
import { useTheme } from "@/lib/theme/ThemeContext";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-panel)] text-[var(--text-muted)]">
      <div className="flex items-center gap-2 text-xs">
        <RefreshCw className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
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
  draftStatus?: "idle" | "saving" | "saved" | "error";
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
  draftStatus = "idle",
}: SqlEditorProps) {
  const editorRef = useRef<any>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isPostgres = dialect === "postgresql";

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Quiet Grove Dark Theme
    monaco.editor.defineTheme("quietgrove-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "8FD0A0", fontStyle: "bold" },
        { token: "string", foreground: "E5B782" },
        { token: "number", foreground: "91BDE0" },
        { token: "comment", foreground: "9BB1A1", fontStyle: "italic" },
        { token: "identifier", foreground: "DDE8DE" },
      ],
      colors: {
        "editor.background": "#273630",
        "editor.lineHighlightBackground": "#202B27",
        "editorCursor.foreground": "#8FD0A0",
        "editorWhitespace.foreground": "#45574B",
        "editorLineNumber.foreground": "#6F8777",
        "editorLineNumber.activeForeground": "#DDE8DE",
      },
    });

    // Quiet Grove Light Theme
    monaco.editor.defineTheme("quietgrove-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "1B6E32", fontStyle: "bold" },
        { token: "string", foreground: "8C530A" },
        { token: "number", foreground: "155A8A" },
        { token: "comment", foreground: "4E6556", fontStyle: "italic" },
        { token: "identifier", foreground: "1B2620" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.lineHighlightBackground": "#F4F7F4",
        "editorCursor.foreground": "#1B6E32",
        "editorWhitespace.foreground": "#D6E0D8",
        "editorLineNumber.foreground": "#76927F",
        "editorLineNumber.activeForeground": "#1B2620",
      },
    });

    monaco.editor.setTheme(isDark ? "quietgrove-dark" : "quietgrove-light");

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
      (window as any).monaco.editor.setTheme(isDark ? "quietgrove-dark" : "quietgrove-light");
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
      // Keep existing code on parse failure
    }
  };

  return (
    <div className="flex h-full flex-col bg-[var(--bg-panel)] transition-colors">
      {/* Editor Action Toolbar */}
      <div className="flex h-11 items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFormat}
            disabled={isLoading}
            className="flex items-center gap-1 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] disabled:opacity-50 transition"
            title="Format SQL (Ctrl+Shift+F)"
            aria-label="Format SQL"
          >
            <AlignLeft className="h-3 w-3 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Format</span>
          </button>
          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex items-center gap-1 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] disabled:opacity-50 transition"
            title="Reset code to starter template"
            aria-label="Reset code"
          >
            <RotateCcw className="h-3 w-3 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Draft Auto-save status */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-[var(--text-muted)] pl-2">
            <Cloud className="h-3 w-3" />
            {draftStatus === "saving" && <span>Saving draft...</span>}
            {draftStatus === "saved" && <span className="text-[var(--accent-success)]">Saved</span>}
            {draftStatus === "error" && <span className="text-[var(--accent-danger)]">Offline draft</span>}
            {draftStatus === "idle" && <span>Auto-saved</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* RUN BUTTON */}
          <button
            onClick={onRun}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] disabled:opacity-50 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
            title="Execute query in sandbox (Ctrl+Enter)"
            aria-label="Execute query"
          >
            <Play className={`h-3 w-3 ${isLoading ? "animate-spin text-[var(--accent-primary)]" : "fill-current"}`} />
            <span>Run</span>
          </button>

          {/* SUBMIT BUTTON */}
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded bg-[var(--accent-primary)] px-3.5 py-1 text-xs font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
            title="Submit query against test cases (Ctrl+Shift+Enter)"
            aria-label="Submit query"
          >
            <Send className="h-3 w-3" />
            <span>Submit</span>
          </button>
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
          theme={isDark ? "quietgrove-dark" : "quietgrove-light"}
          options={{
            fontSize: 13,
            fontFamily: "'IBM Plex Mono', 'JetBrains Mono', Consolas, monospace",
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
