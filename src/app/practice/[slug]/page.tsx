"use client";

import React, { useEffect, useState, useRef, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Database } from "lucide-react";
import SqlEditor from "@/components/editor/SqlEditor";
import SchemaExplorer, { TableMeta } from "@/components/practice/SchemaExplorer";
import QuestionPanel from "@/components/practice/QuestionPanel";
import TopicProblemPicker from "@/components/practice/TopicProblemPicker";
import { QueryExecutionResult } from "@/lib/engine/types";
import { TopicNavigationInfo } from "@/lib/curriculum/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PracticePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const slug = resolvedParams.slug;
  const dialect = "postgresql";

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

  const saveDraftToCloud = useCallback(
    async (codeToSave: string) => {
      if (!codeToSave.trim()) return;
      setDraftStatus("saving");
      try {
        const res = await fetch(`/api/v1/questions/${slug}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: codeToSave }),
        });
        if (res.ok) {
          setDraftStatus("saved");
        } else {
          setDraftStatus("error");
        }
      } catch {
        setDraftStatus("error");
      }
    },
    [slug]
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/v1/questions/${slug}`)
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
            } catch {}
          }
          setNavigation(nav);

          const starter = q.starterQuery || "-- Write your PostgreSQL query here\n";
          let resolvedCode: string | null = null;

          try {
            const draftRes = await fetch(`/api/v1/questions/${slug}/draft`);
            if (draftRes.ok) {
              const draftData = await draftRes.json();
              if (draftData?.success && draftData?.data?.draft) {
                resolvedCode = draftData.data.draft;
              }
            }
          } catch {
            // Fallback
          }

          if (!resolvedCode && typeof window !== "undefined") {
            const localDraft = localStorage.getItem(`sqljudge_draft_${slug}`);
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

    fetch(`/api/v1/questions/${slug}/schema`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && data?.data?.tables) {
          setSchemaTables(data.data.tables);
        }
      })
      .catch((err) => console.error("Failed to load schema:", err));

    if (typeof window !== "undefined") {
      const pm = localStorage.getItem("sqljudge_practice_mode");
      if (pm === "true") setPracticeMode(true);
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleSqlChange = (newVal: string) => {
    setSqlCode(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sqljudge_draft_${slug}`, newVal);
    }

    if (saveDraftTimerRef.current) {
      clearTimeout(saveDraftTimerRef.current);
    }
    saveDraftTimerRef.current = setTimeout(() => {
      saveDraftToCloud(newVal);
    }, 600);
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      const code = latestSqlRef.current;
      if (code && code.trim()) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`sqljudge_draft_${slug}`, code);
        }
        try {
          fetch(`/api/v1/questions/${slug}/draft`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft: code }),
            keepalive: true,
          });
        } catch {}
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
  }, [slug]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        if (navigation?.nextSlug) {
          router.push(`/practice/${navigation.nextSlug}`);
        } else if (navigation?.isLastInTopic) {
          router.push(`/topics`);
        }
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        if (navigation?.prevSlug && !navigation.isFirstInTopic) {
          router.push(`/practice/${navigation.prevSlug}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigation, router]);

  const handleTogglePracticeMode = () => {
    const updated = !practiceMode;
    setPracticeMode(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("sqljudge_practice_mode", String(updated));
    }
  };

  const handleRun = async () => {
    if (!sqlCode.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await fetch(`/api/v1/questions/${slug}/execute`, {
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
          message: err.message || "Execution error",
          userFacingMessage: err.message || "Execution error",
        },
        executionTimeMs: 0,
      });
      setActiveTab("results");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (!sqlCode.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await fetch(`/api/v1/questions/${slug}/submit`, {
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
          if (typeof window !== "undefined" && question?.id) {
            try {
              const guestSolvedRaw = localStorage.getItem("sqljudge_guest_solved");
              const guestSolved = guestSolvedRaw ? JSON.parse(guestSolvedRaw) : [];
              if (!guestSolved.includes(question.id)) {
                guestSolved.push(question.id);
                localStorage.setItem("sqljudge_guest_solved", JSON.stringify(guestSolved));
              }
            } catch {}
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

  const handleReset = () => {
    if (!question) return;
    const starter = question.starterQuery || "-- Write your PostgreSQL query here\n";
    setSqlCode(starter);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sqljudge_draft_${slug}`);
    }
    saveDraftToCloud(starter);
  };

  const handleUnlockHint = async () => {
    try {
      const res = await fetch(`/api/v1/questions/${slug}/hints`, { method: "POST" });
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

  const handleRevealSolution = async () => {
    try {
      const res = await fetch(`/api/v1/questions/${slug}/solution`, { method: "POST" });
      const data = await res.json();
      if (data?.success && data?.data) {
        setQuestion((prev: any) => ({
          ...prev,
          solutionViewed: true,
          solutionQuery: data.data.solutionQuery,
          solutionExplanation: data.data.solutionExplanation,
          commonMistakes: data.data.commonMistakes,
          interviewTip: data.data.interviewTip,
        }));
      }
    } catch (err) {
      console.error("Reveal solution failed:", err);
    }
  };

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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[var(--bg-base)] text-[var(--text-muted)]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm font-medium">Loading PostgreSQL sandbox & problem...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[var(--bg-base)] text-[var(--text-main)]">
        <p className="text-lg font-semibold text-[var(--accent-danger)]">Question not found</p>
        <Link
          href={`/topics`}
          className="mt-4 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-sm text-[var(--accent-primary-text)] font-semibold hover:bg-[var(--accent-primary-hover)] transition"
        >
          Return to Curriculum
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
            href={`/topics`}
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
            PostgreSQL 16
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
              href={`/practice/${prevSlug}`}
              className="flex items-center gap-1 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
              title={`Previous: ${navigation?.prevTitle || "Previous"} (Alt+←)`}
              aria-label={`Previous problem: ${navigation?.prevTitle || "Previous"}`}
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Prev</span>
            </Link>
          )}

          {isLastInTopic || !nextSlug ? (
            <Link
              href={`/topics`}
              className="flex items-center gap-1 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
              title="Completed all problems in this topic! Return to curriculum (Alt+→)"
              aria-label="Completed all problems in this topic, return to curriculum"
            >
              <span>{navigation?.nextTopicSlug ? "Next topic" : "Back to topic"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href={`/practice/${nextSlug}`}
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

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
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
