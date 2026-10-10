"use client";

import React, { useEffect, useState, useRef, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Database } from "lucide-react";
import SqlEditor from "@/components/editor/SqlEditor";
import SchemaExplorer, { TableMeta } from "@/components/practice/SchemaExplorer";
import QuestionPanel from "@/components/practice/QuestionPanel";
import TopicProblemPicker from "@/components/practice/TopicProblemPicker";
import { Dialect, QueryExecutionResult } from "@/lib/engine/types";
import { TopicNavigationInfo } from "@/lib/curriculum/navigation";

interface PageProps {
  params: Promise<{ dialect: string; slug: string }>;
}

export default function DialectPracticePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
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
  const [navigation, setNavigation] = useState<TopicNavigationInfo | null>(null);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveDraftTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestSqlRef = useRef<string>("");
  latestSqlRef.current = sqlCode;

  // Cloud Draft Auto-Save Function
  const saveDraftToCloud = useCallback(
    async (codeToSave: string) => {
      if (!codeToSave.trim()) return;
      setDraftStatus("saving");
      try {
        const res = await fetch(`/api/v1/${dialect}/questions/${slug}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: codeToSave }),
        });
        if (res.ok) {
          setDraftStatus("saved");
        } else {
          setDraftStatus("error"); // LocalStorage buffer intact
        }
      } catch {
        setDraftStatus("error"); // Offline buffer intact
      }
    },
    [dialect, slug]
  );

  // Load question & schema data + draft resolution
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Fetch question and navigation
    fetch(`/api/v1/${dialect}/questions/${slug}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (!isMounted) return;
        if (data?.success && data?.data?.question) {
          const q = data.data.question;
          setQuestion(q);
          const nav: TopicNavigationInfo | null = data.data.navigation || null;
          if (nav && typeof window !== "undefined") {
            try {
              const guestSolvedRaw = localStorage.getItem("sqljudge_guest_solved");
              const guestSolved = guestSolvedRaw ? JSON.parse(guestSolvedRaw) : [];
              if (guestSolved.length > 0 && nav.topicQuestions) {
                nav.topicQuestions = nav.topicQuestions.map((tq) => ({
                  ...tq,
                  isSolved: tq.isSolved || guestSolved.includes(tq.id),
                }));
                nav.solvedCount = nav.topicQuestions.filter((x) => x.isSolved).length;
              }
            } catch {
              // Ignore local parse errors
            }
          }
          setNavigation(nav);

          const starter =
            q.starterQuery ||
            (isPostgres ? "-- Write your PostgreSQL query here\n" : "-- Write your MySQL query here\n");

          // Priority 1: Check cloud draft for logged-in user
          let resolvedCode: string | null = null;
          try {
            const draftRes = await fetch(`/api/v1/${dialect}/questions/${slug}/draft`);
            if (draftRes.ok) {
              const draftData = await draftRes.json();
              if (draftData?.success && draftData?.data?.draft) {
                resolvedCode = draftData.data.draft;
              }
            }
          } catch {
            // Offline fallback
          }

          // Priority 2: Check localStorage temporary buffer
          if (!resolvedCode && typeof window !== "undefined") {
            const localDraft = localStorage.getItem(`sqljudge_draft_${dialect}_${slug}`);
            if (localDraft) {
              resolvedCode = localDraft;
            }
          }

          setSqlCode(resolvedCode || starter);
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
  }, [dialect, slug, isPostgres]);

  // Handle SQL Change: sync to local offline buffer immediately, debounce cloud auto-save
  const handleSqlChange = (newVal: string) => {
    setSqlCode(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sqljudge_draft_${dialect}_${slug}`, newVal);
    }

    if (saveDraftTimerRef.current) {
      clearTimeout(saveDraftTimerRef.current);
    }
    saveDraftTimerRef.current = setTimeout(() => {
      saveDraftToCloud(newVal);
    }, 600);
  };

  // Save before unload & on window blur
  useEffect(() => {
    const handleBeforeUnload = () => {
      const code = latestSqlRef.current;
      if (code && code.trim()) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`sqljudge_draft_${dialect}_${slug}`, code);
        }
        // Beacon / keepalive save
        try {
          fetch(`/api/v1/${dialect}/questions/${slug}/draft`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft: code }),
            keepalive: true,
          });
        } catch {
          // Ignore unload errors
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleBeforeUnload);
      if (saveDraftTimerRef.current) {
        clearTimeout(saveDraftTimerRef.current);
      }
    };
  }, [dialect, slug]);

  // Keyboard navigation shortcuts: Alt+→ for Next, Alt+← for Prev
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        if (navigation?.nextSlug) {
          router.push(`/${dialect}/practice/${navigation.nextSlug}`);
        } else if (navigation?.isLastInTopic) {
          router.push(`/${dialect}/topics`);
        }
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        if (navigation?.prevSlug && !navigation.isFirstInTopic) {
          router.push(`/${dialect}/practice/${navigation.prevSlug}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigation, dialect, router]);

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
          message: err.message || "Failed to communicate with sandbox engine",
          userFacingMessage: err.message || "Failed to communicate with sandbox engine",
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
          setNavigation((prev: any) => {
            if (!prev || !prev.topicQuestions) return prev;
            const updated = prev.topicQuestions.map((tq: any) =>
              tq.slug === slug || tq.id === question?.id ? { ...tq, isSolved: true } : tq
            );
            return {
              ...prev,
              topicQuestions: updated,
              solvedCount: updated.filter((x: any) => x.isSolved).length,
            };
          });
          // Save solved status in guest storage if guest
          if (typeof window !== "undefined" && question?.id) {
            try {
              const guestSolvedRaw = localStorage.getItem("sqljudge_guest_solved");
              const guestSolved = guestSolvedRaw ? JSON.parse(guestSolvedRaw) : [];
              if (!guestSolved.includes(question.id)) {
                guestSolved.push(question.id);
                localStorage.setItem("sqljudge_guest_solved", JSON.stringify(guestSolved));
              }
            } catch {
              // Ignore guest storage errors
            }
          }
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
    const starter =
      question.starterQuery ||
      (isPostgres ? "-- Write your PostgreSQL query here\n" : "-- Write your MySQL query here\n");
    setSqlCode(starter);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sqljudge_draft_${dialect}_${slug}`);
    }
    saveDraftToCloud(starter);
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

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[var(--bg-base)] text-[var(--text-muted)]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm font-medium">Loading {isPostgres ? "PostgreSQL" : "MySQL"} sandbox & problem...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[var(--bg-base)] text-[var(--text-main)]">
        <p className="text-lg font-semibold text-[var(--accent-danger)]">Question not found</p>
        <Link
          href={`/${dialect}/topics`}
          className="mt-4 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm text-[var(--accent-primary-text)] font-semibold hover:bg-[var(--accent-primary-hover)] transition"
        >
          Return to {isPostgres ? "PostgreSQL" : "MySQL"} Curriculum
        </Link>
      </div>
    );
  }

  const prevSlug = navigation?.prevSlug;
  const nextSlug = navigation?.nextSlug;
  const isFirstInTopic = navigation?.isFirstInTopic;
  const isLastInTopic = navigation?.isLastInTopic;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[var(--bg-base)] transition-colors">
      {/* Subheader Navigation */}
      <div className="flex h-11 items-center justify-between border-b border-[var(--glass-border)] glass-sub px-4">
        <div className="flex items-center gap-2.5">
          <Link
            href={`/${dialect}/topics`}
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-main)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Curriculum</span>
          </Link>
          <span className="text-[var(--border-control)]">/</span>
          <span className="text-xs font-semibold text-[var(--text-main)] truncate max-w-[200px] sm:max-w-md">
            {navigation?.currentIndex ? `${navigation.currentIndex}. ` : ""}
            {question.title}
          </span>
          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold border border-[var(--border-control)] bg-[var(--bg-panel)] text-[var(--text-secondary)]">
            {isPostgres ? "PG 16" : "MySQL 8.4"}
          </span>
          {question.isSolved && (
            <span className="flex items-center gap-1 rounded bg-[var(--accent-success-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-success-text)] border border-[var(--accent-success-border)]">
              <CheckCircle className="h-3 w-3" /> Solved
            </span>
          )}
        </div>

        {/* LeetCode-style Problem Navigator & Persistent Previous / Next Arrow Navigation */}
        <div className="flex items-center gap-2">
          {navigation && navigation.topicQuestions && navigation.topicQuestions.length > 0 && (
            <TopicProblemPicker
              topicTitle={navigation.topicTitle || "Curriculum"}
              topicSlug={navigation.topicSlug}
              currentIndex={navigation.currentIndex}
              totalInTopic={navigation.totalInTopic}
              topicQuestions={navigation.topicQuestions}
              currentSlug={slug}
              dialect={dialect}
            />
          )}

          {/* Previous Button: disabled style on first question, accessible aria-disabled */}
          {isFirstInTopic || !prevSlug ? (
            <button
              disabled
              aria-disabled="true"
              className="flex items-center gap-1 rounded border border-[var(--border-color)] bg-[var(--bg-panel)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] opacity-50 cursor-not-allowed select-none"
              title="First problem in this topic"
              aria-label="First problem in this topic"
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Prev</span>
            </button>
          ) : (
            <Link
              href={`/${dialect}/practice/${prevSlug}`}
              className="flex items-center gap-1 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
              title={`Previous: ${navigation?.prevTitle || "Previous"} (Alt+←)`}
              aria-label={`Previous problem: ${navigation?.prevTitle || "Previous"}`}
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Prev</span>
            </Link>
          )}

          {/* Next Button: On last question shows 'Back to topic' or 'Next topic', never dead! */}
          {isLastInTopic || !nextSlug ? (
            <Link
              href={`/${dialect}/topics`}
              className="flex items-center gap-1 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
              title="Completed all problems in this topic! Return to curriculum (Alt+→)"
              aria-label="Completed all problems in this topic, return to curriculum"
            >
              <span>{navigation?.nextTopicSlug ? "Next topic" : "Back to topic"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href={`/${dialect}/practice/${nextSlug}`}
              className="flex items-center gap-1 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
              title={`Next: ${navigation?.nextTitle || "Next"} (Alt+→)`}
              aria-label={`Next problem: ${navigation?.nextTitle || "Next"}`}
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Main 3-Column Grid Workspace */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        {/* Left: Problem Details & Tabs (5 Cols) */}
        <div className="border-r border-[var(--border-color)] lg:col-span-5 h-full overflow-hidden">
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
            nextSlug={nextSlug}
            dialect={dialect}
            navigation={navigation}
          />
        </div>

        {/* Center: Monaco SQL Editor (5 Cols) */}
        <div className="border-r border-[var(--border-color)] lg:col-span-5 h-full overflow-hidden flex flex-col">
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
            nextSlug={nextSlug}
            draftStatus={draftStatus}
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
