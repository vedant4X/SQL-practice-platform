"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, CheckCircle } from "lucide-react";
import SqlEditor from "@/components/editor/SqlEditor";
import SchemaExplorer, { TableMeta } from "@/components/practice/SchemaExplorer";
import QuestionPanel from "@/components/practice/QuestionPanel";
import { Dialect, QueryExecutionResult } from "@/lib/engine/types";

interface PageProps {
  params: Promise<{ dialect: string; slug: string }>;
}

export default function DialectPracticePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const dialect: Dialect = resolvedParams.dialect === "mysql" ? "mysql" : "postgresql";
  const slug = resolvedParams.slug;
  const isPostgres = dialect === "postgresql";

  const [question, setQuestion] = useState<any>(null);
  const [schemaTables, setSchemaTables] = useState<TableMeta[]>([]);
  const [sqlCode, setSqlCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"description" | "hints" | "solution" | "results" | "testcases">("description");
  const [runResult, setRunResult] = useState<QueryExecutionResult | null>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);

  // Load question & schema data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Fetch question
    fetch(`/api/v1/${dialect}/questions/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && data?.data?.question) {
          const q = data.data.question;
          setQuestion(q);
          setPrevSlug(data.data.prevSlug || null);
          setNextSlug(data.data.nextSlug || null);

          // Restore draft or starter
          const draftKey = `sqljudge_draft_${dialect}_${slug}`;
          const savedDraft = typeof window !== "undefined" ? localStorage.getItem(draftKey) : null;
          if (savedDraft) {
            setSqlCode(savedDraft);
          } else {
            setSqlCode(q.starterQuery || (isPostgres ? "-- Write your PostgreSQL query here\n" : "-- Write your MySQL query here\n"));
          }
        }
      })
      .catch((err) => console.error("Failed to load question:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // Fetch schema
    fetch(`/api/v1/${dialect}/questions/${slug}/schema`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && data?.data?.tables) {
          setSchemaTables(data.data.tables);
        }
      })
      .catch((err) => console.error("Failed to load schema:", err));

    // Load practice mode preference
    if (typeof window !== "undefined") {
      const pm = localStorage.getItem("sqljudge_practice_mode");
      if (pm === "true") setPracticeMode(true);
    }

    return () => {
      isMounted = false;
    };
  }, [dialect, slug]);

  // Autosave draft
  const handleSqlChange = (newVal: string) => {
    setSqlCode(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sqljudge_draft_${dialect}_${slug}`, newVal);
    }
  };

  const handleTogglePracticeMode = () => {
    const updated = !practiceMode;
    setPracticeMode(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sqljudge_practice_mode", String(updated));
    }
  };

  // Run Query
  const handleRun = async () => {
    if (!sqlCode.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await fetch(`/api/v1/${dialect}/questions/${slug}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: sqlCode }),
      });
      const data = await res.json();
      if (data?.success && data?.data?.result) {
        setRunResult(data.data.result);
      } else if (data?.error) {
        setRunResult({
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
      setActiveTab("results");
    } catch (err: any) {
      setRunResult({
        success: false,
        columns: [],
        rows: [],
        rowCount: 0,
        totalRows: 0,
        hasMore: false,
        error: {
          code: "500",
          message: err.message || "Failed to communicate with execution server",
          userFacingMessage: err.message || "Failed to communicate with execution server",
        },
        executionTimeMs: 0,
      });
      setActiveTab("results");
    } finally {
      setIsExecuting(false);
    }
  };

  // Submit Query
  const handleSubmit = async () => {
    if (!sqlCode.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await fetch(`/api/v1/${dialect}/questions/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: sqlCode }),
      });
      const data = await res.json();
      if (data?.success && data?.data) {
        setSubmitResult(data.data);
        if (data.data.verdict === "correct") {
          setQuestion((prev: any) => (prev ? { ...prev, isSolved: true } : prev));
        }
      } else if (data?.error) {
        setSubmitResult({
          verdict: "error",
          passedCount: 0,
          totalCount: question?.testCaseCount || 3,
          overallExecutionTimeMs: 0,
          testCaseResults: [],
          error: data.error.userFacingMessage || data.error.message,
        });
      }
      setActiveTab("testcases");
    } catch (err: any) {
      console.error("Submission failed:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset to starter code
  const handleReset = () => {
    if (!question) return;
    const starter = question.starterQuery || (isPostgres ? "-- Write your PostgreSQL query here\n" : "-- Write your MySQL query here\n");
    setSqlCode(starter);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sqljudge_draft_${dialect}_${slug}`);
    }
  };

  // Unlock Hint
  const handleUnlockHint = async () => {
    try {
      const res = await fetch(`/api/v1/${dialect}/questions/${slug}/hints`, { method: "POST" });
      const data = await res.json();
      if (data?.success && data?.data) {
        setQuestion((prev: any) => ({
          ...prev,
          hintsUsed: data.data.unlockedHintLevel,
          availableHints: [...(prev.availableHints || []), data.data.hintText],
        }));
      }
    } catch (err) {
      console.error("Unlock hint failed:", err);
    }
  };

  // Reveal Solution
  const handleRevealSolution = async () => {
    try {
      const res = await fetch(`/api/v1/${dialect}/questions/${slug}/solution`, { method: "POST" });
      const data = await res.json();
      if (data?.success && data?.data) {
        setQuestion((prev: any) => ({
          ...prev,
          solutionViewed: true,
          solutionQuery: data.data.solutionQuery,
          solutionExplanation: data.data.solutionExplanation,
          commonMistakes: data.data.commonMistakes,
          interviewTip: data.data.interviewTip,
          dialectNotes: data.data.dialectNotes,
        }));
      }
    } catch (err) {
      console.error("Reveal solution failed:", err);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    if (!question) return;
    const nextState = !question.isBookmarked;
    try {
      await fetch("/api/v1/user/saved-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, isBookmarked: nextState, dialect }),
      });
      setQuestion((prev: any) => ({ ...prev, isBookmarked: nextState }));
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-background text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading {isPostgres ? "PostgreSQL" : "MySQL"} sandbox & problem...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-background text-slate-300">
        <p className="text-lg font-semibold text-rose-400">Question not found</p>
        <Link href={`/${dialect}/topics`} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover">
          Return to {isPostgres ? "PostgreSQL" : "MySQL"} Curriculum
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background-darker">
      {/* Subheader Navigation */}
      <div className="flex h-11 items-center justify-between border-b border-background-border bg-background-card/40 px-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${dialect}/topics`}
            className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Curriculum</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-md">
            {question.title}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
              isPostgres
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "border-teal-500/30 bg-teal-500/10 text-teal-300"
            }`}
          >
            {isPostgres ? "PG 16" : "MySQL 8.4"}
          </span>
          {question.isSolved && (
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="h-3 w-3" /> Solved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {prevSlug && (
            <Link
              href={`/${dialect}/practice/${prevSlug}`}
              className="flex items-center gap-1 rounded border border-slate-800 bg-background-dark px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white"
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Prev</span>
            </Link>
          )}
          {nextSlug && (
            <Link
              href={`/${dialect}/practice/${nextSlug}`}
              className="flex items-center gap-1 rounded border border-slate-800 bg-background-dark px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Main 3-Column Grid Workspace */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* Left: Problem Details & Tabs (5 Cols) */}
        <div className="border-r border-background-border lg:col-span-5 h-full overflow-hidden">
          <QuestionPanel
            question={question}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            runResult={runResult}
            submitResult={submitResult}
            isLoading={isExecuting}
            onUnlockHint={handleUnlockHint}
            onRevealSolution={handleRevealSolution}
            onToggleBookmark={handleToggleBookmark}
          />
        </div>

        {/* Center: Monaco SQL Editor (5 Cols) */}
        <div className="border-r border-background-border lg:col-span-5 h-full overflow-hidden flex flex-col">
          <SqlEditor
            value={sqlCode}
            onChange={handleSqlChange}
            onRun={handleRun}
            onSubmit={handleSubmit}
            onReset={handleReset}
            isLoading={isExecuting}
            practiceMode={practiceMode}
            onTogglePracticeMode={handleTogglePracticeMode}
            dialect={dialect}
          />
        </div>

        {/* Right: Schema Explorer (2 Cols) */}
        <div className="hidden lg:block lg:col-span-2 h-full overflow-hidden">
          <SchemaExplorer
            databaseId={question.databaseId || "default"}
            tables={schemaTables}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}
