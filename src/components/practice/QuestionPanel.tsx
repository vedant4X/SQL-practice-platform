"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  HelpCircle,
  Lightbulb,
  Table,
  CheckCircle,
  XCircle,
  Zap,
  Bookmark,
  ArrowRight,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import ResultTable from "./ResultTable";
import { QueryExecutionResult, TestCaseResult } from "@/lib/engine/types";
import { TopicNavigationInfo } from "@/lib/curriculum/navigation";

interface QuestionData {
  id: string;
  slug: string;
  title: string;
  descriptionMarkdown: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  xp: number;
  expectedColumns: { name: string; type: string }[];
  tablesInvolved: string[];
  orderMatters: boolean;
  isSolved: boolean;
  isBookmarked: boolean;
  hintsUsed: number;
  totalHints: number;
  availableHints: string[];
  solutionViewed: boolean;
  solutionQuery?: string | null;
  solutionExplanation?: string | null;
  commonMistakes?: string[] | null;
  interviewTip?: string | null;
}

interface QuestionPanelProps {
  question: QuestionData;
  activeTab: "description" | "hints" | "solution" | "results" | "testcases";
  setActiveTab: (tab: "description" | "hints" | "solution" | "results" | "testcases") => void;
  runResult: QueryExecutionResult | null;
  submitResult: {
    verdict: "correct" | "incorrect" | "error" | "timeout";
    passedCount: number;
    totalCount: number;
    overallExecutionTimeMs: number;
    testCaseResults: TestCaseResult[];
    xpEarned?: number;
  } | null;
  isLoading?: boolean;
  onUnlockHint: () => void;
  onRevealSolution: () => void;
  onToggleBookmark: () => void;
  nextSlug?: string | null;
  dialect?: string;
  navigation?: TopicNavigationInfo | null;
}

export default function QuestionPanel({
  question,
  activeTab,
  setActiveTab,
  runResult,
  submitResult,
  isLoading,
  onUnlockHint,
  onRevealSolution,
  onToggleBookmark,
  nextSlug,
  dialect = "postgresql",
  navigation,
}: QuestionPanelProps) {
  const [confirmSolution, setConfirmSolution] = useState(false);

  const effectiveNextSlug = navigation?.nextSlug || nextSlug;
  const isLastInTopic = navigation?.isLastInTopic;

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "easy":
        return (
          <span className="rounded bg-[var(--accent-success-bg)] border border-[var(--accent-success-border)] px-2 py-0.5 text-xs font-medium text-[var(--accent-success-text)]">
            Easy
          </span>
        );
      case "medium":
        return (
          <span className="rounded bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] px-2 py-0.5 text-xs font-medium text-[var(--accent-warning-text)]">
            Medium
          </span>
        );
      case "hard":
      case "expert":
        return (
          <span className="rounded bg-[var(--accent-danger-bg)] border border-[var(--accent-danger-border)] px-2 py-0.5 text-xs font-medium text-[var(--accent-danger-text)]">
            {diff === "hard" ? "Hard" : "Expert"}
          </span>
        );
      default:
        return (
          <span className="rounded bg-[var(--bg-surface)] border border-[var(--border-control)] px-2 py-0.5 text-xs font-medium text-[var(--text-main)]">
            {diff}
          </span>
        );
    }
  };

  return (
    <div className="flex h-full flex-col bg-[var(--bg-panel)] text-[var(--text-main)] transition-colors">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-3">
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("description")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "description"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Description
          </button>
          <button
            onClick={() => setActiveTab("hints")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "hints"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Hints ({question.hintsUsed}/{question.totalHints})
          </button>
          <button
            onClick={() => setActiveTab("solution")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "solution"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Solution
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "results"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            Results
          </button>
          <button
            onClick={() => setActiveTab("testcases")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "testcases"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Test Cases
            {submitResult && (
              <span
                className={`ml-1 text-[11px] font-bold ${
                  submitResult.verdict === "correct"
                    ? "text-[var(--accent-success)]"
                    : "text-[var(--accent-danger)]"
                }`}
              >
                ({submitResult.passedCount}/{submitResult.totalCount})
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleBookmark}
            title={question.isBookmarked ? "Remove bookmark" : "Bookmark question"}
            aria-label={question.isBookmarked ? "Remove bookmark" : "Bookmark question"}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)] transition"
          >
            <Bookmark
              className={`h-4 w-4 ${question.isBookmarked ? "fill-[var(--accent-primary)] text-[var(--accent-primary)]" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {/* Tab 1: Description */}
        {activeTab === "description" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-base font-bold text-[var(--text-main)] sm:text-lg">
                {navigation?.currentIndex ? `${navigation.currentIndex}. ` : ""}
                {question.title}
              </h1>
              <div className="flex items-center gap-2">
                {getDifficultyBadge(question.difficulty)}
                <span className="flex items-center gap-1 rounded bg-[var(--accent-info-bg)] border border-[var(--accent-info-border)] px-2 py-0.5 text-xs font-medium text-[var(--accent-info-text)]">
                  <Zap className="h-3 w-3" />
                  {question.xp} XP
                </span>
                {question.isSolved && (
                  <span className="rounded bg-[var(--accent-success-bg)] border border-[var(--accent-success-border)] px-2 py-0.5 text-xs font-medium text-[var(--accent-success-text)]">
                    Solved ✓
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs leading-relaxed text-[var(--text-main)] whitespace-pre-line">
              {question.descriptionMarkdown}
            </div>

            {/* Expected Output Schema */}
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 space-y-2">
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Expected Columns ({question.expectedColumns.length})
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {question.expectedColumns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between rounded bg-[var(--bg-panel)] px-2.5 py-1.5 border border-[var(--border-color)]"
                  >
                    <span className="text-[var(--accent-primary)] font-semibold">{col.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{col.type}</span>
                  </div>
                ))}
              </div>
              {question.orderMatters && (
                <div className="text-[11px] text-[var(--accent-warning)] font-medium pt-1">
                  ⚠️ Note: Output row order matters for this problem. Make sure to use ORDER BY.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Hints */}
        {activeTab === "hints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-main)]">Progressive Hint System</span>
              <span>
                Revealed: {question.hintsUsed} / {question.totalHints}
              </span>
            </div>

            {question.availableHints.length === 0 ? (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 text-center text-xs text-[var(--text-muted)]">
                <Lightbulb className="mx-auto h-6 w-6 text-[var(--accent-warning)] mb-2 opacity-80" />
                <p className="mb-3">Need direction? Unlocking a hint provides guided direction with a 20% XP penalty per level.</p>
                <button
                  onClick={onUnlockHint}
                  className="rounded bg-[var(--accent-primary)] px-3 py-1.5 font-semibold text-[var(--accent-primary-text)] text-xs hover:bg-[var(--accent-primary-hover)] transition"
                >
                  Unlock Hint 1 (-20% XP)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {question.availableHints.map((hintText, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-[var(--accent-warning-border)] bg-[var(--accent-warning-bg)] p-3 text-xs space-y-1 text-[var(--accent-warning-text)]"
                  >
                    <div className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Hint {idx + 1}
                    </div>
                    <p className="leading-relaxed">{hintText}</p>
                  </div>
                ))}

                {question.hintsUsed < question.totalHints && (
                  <button
                    onClick={onUnlockHint}
                    className="w-full rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
                  >
                    Unlock Hint {question.hintsUsed + 1} (-{(question.hintsUsed + 1) * 20}% XP)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Solution */}
        {activeTab === "solution" && (
          <div className="space-y-4">
            {!question.solutionViewed && !question.solutionQuery ? (
              <div className="rounded-lg border border-[var(--accent-danger-border)] bg-[var(--accent-danger-bg)] p-5 text-center text-xs text-[var(--accent-danger-text)]">
                <Lightbulb className="mx-auto h-7 w-7 text-[var(--accent-warning)] mb-2" />
                <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Gated Solution</h3>
                <p className="mb-4 text-[var(--text-secondary)]">
                  Viewing the official solution will permanently forfeit all XP for this question (0 XP awarded).
                </p>

                {confirmSolution ? (
                  <div className="space-y-2">
                    <button
                      onClick={onRevealSolution}
                      className="w-full rounded bg-[var(--accent-danger)] px-4 py-2 font-bold text-white transition hover:opacity-90"
                    >
                      Confirm: Forfeit XP & Reveal Solution
                    </button>
                    <button
                      onClick={() => setConfirmSolution(false)}
                      className="w-full text-[var(--text-muted)] hover:underline text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmSolution(true)}
                    className="rounded border border-[var(--accent-danger-border)] bg-[var(--bg-panel)] px-4 py-2 font-semibold text-[var(--accent-danger-text)] hover:bg-[var(--accent-danger-bg)] transition"
                  >
                    Reveal Solution
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                    Official Reference Solution
                  </span>
                  <pre className="font-mono text-xs text-[var(--accent-success-text)] overflow-x-auto p-2.5 bg-[var(--bg-panel)] rounded border border-[var(--border-color)]">
                    {question.solutionQuery}
                  </pre>
                </div>

                {question.solutionExplanation && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-[var(--text-main)]">Line-by-Line Explanation</h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                      {question.solutionExplanation}
                    </p>
                  </div>
                )}

                {question.commonMistakes && question.commonMistakes.length > 0 && (
                  <div className="rounded-lg border border-[var(--accent-warning-border)] bg-[var(--accent-warning-bg)] p-3 space-y-1 text-xs">
                    <span className="font-semibold text-[var(--accent-warning-text)]">Common Mistakes to Avoid</span>
                    <ul className="list-disc list-inside text-[var(--accent-warning-text)] space-y-1">
                      {question.commonMistakes.map((cm, i) => (
                        <li key={i}>{cm}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.interviewTip && (
                  <div className="rounded-lg border border-[var(--accent-info-border)] bg-[var(--accent-info-bg)] p-3 space-y-1 text-xs">
                    <span className="font-semibold text-[var(--accent-info-text)]">Interview Tip</span>
                    <p className="text-[var(--accent-info-text)]">{question.interviewTip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Results */}
        {activeTab === "results" && (
          <div className="space-y-4">
            {effectiveNextSlug ? (
              <div className="flex items-center justify-between rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-xs">
                <span className="text-[var(--text-secondary)]">Ready to move forward?</span>
                <Link
                  href={`/${dialect}/practice/${effectiveNextSlug}`}
                  aria-label={`Next problem: ${navigation?.nextTitle || "Next problem"}`}
                  className="flex items-center gap-1 rounded bg-[var(--accent-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition"
                >
                  <span>Next Problem</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : isLastInTopic ? (
              <div className="flex items-center justify-between rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] p-2.5 text-xs">
                <span className="text-[var(--text-secondary)]">Completed topic challenges!</span>
                <Link
                  href={`/${dialect}/topics`}
                  aria-label="Back to topic curriculum"
                  className="flex items-center gap-1 rounded bg-[var(--accent-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition"
                >
                  <span>Back to Curriculum</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : null}
            <ResultTable result={runResult} isLoading={isLoading} />
          </div>
        )}

        {/* Tab 5: Test Cases */}
        {activeTab === "testcases" && (
          <div className="space-y-4">
            {!submitResult ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] italic">
                Press "Submit" to judge your query against all automated test cases.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Overall Verdict Banner */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-3.5 text-xs font-semibold border ${
                    submitResult.verdict === "correct"
                      ? "border-[var(--accent-success-border)] bg-[var(--accent-success-bg)] text-[var(--accent-success-text)]"
                      : "border-[var(--accent-danger-border)] bg-[var(--accent-danger-bg)] text-[var(--accent-danger-text)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {submitResult.verdict === "correct" ? (
                      <CheckCircle className="h-5 w-5 text-[var(--accent-success)]" />
                    ) : (
                      <XCircle className="h-5 w-5 text-[var(--accent-danger)]" />
                    )}
                    <span className="text-sm font-bold">
                      {submitResult.verdict === "correct"
                        ? `Passed all test cases! (${submitResult.passedCount}/${submitResult.totalCount})`
                        : `Not quite. Passed ${submitResult.passedCount}/${submitResult.totalCount}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {submitResult.xpEarned !== undefined && submitResult.xpEarned > 0 && (
                      <span className="rounded bg-[var(--accent-success)] px-2 py-0.5 text-[var(--accent-primary-text)] font-bold text-xs">
                        +{submitResult.xpEarned} XP
                      </span>
                    )}

                    {/* PROMINENT NEXT PROBLEM BUTTON (Accepted = Primary, Wrong = Secondary) */}
                    {effectiveNextSlug ? (
                      <Link
                        href={`/${dialect}/practice/${effectiveNextSlug}`}
                        aria-label={`Next problem: ${navigation?.nextTitle || "Next problem"}`}
                        className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                          submitResult.verdict === "correct"
                            ? "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)] ring-2 ring-[var(--border-control)]"
                            : "border border-[var(--border-control)] bg-[var(--bg-panel)] hover:bg-[var(--bg-surface)] text-[var(--text-main)]"
                        }`}
                        title={`Next problem: ${navigation?.nextTitle || "Next problem"} (Alt+→)`}
                      >
                        <span>Next problem →</span>
                      </Link>
                    ) : isLastInTopic ? (
                      <Link
                        href={`/${dialect}/topics`}
                        aria-label="Back to curriculum"
                        className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                          submitResult.verdict === "correct"
                            ? "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-primary-text)]"
                            : "border border-[var(--border-control)] bg-[var(--bg-panel)] hover:bg-[var(--bg-surface)] text-[var(--text-main)]"
                        }`}
                        title="Completed all problems in this topic! Back to curriculum (Alt+→)"
                      >
                        <span>{navigation?.nextTopicSlug ? "Next topic →" : "Back to topic →"}</span>
                      </Link>
                    ) : null}
                  </div>
                </div>

                {/* Per-test-case list */}
                <div className="space-y-2">
                  {submitResult.testCaseResults.map((tc, idx) => (
                    <div
                      key={tc.testCaseId || idx}
                      className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                          {tc.passed ? (
                            <CheckCircle className="h-4 w-4 text-[var(--accent-success)]" />
                          ) : (
                            <XCircle className="h-4 w-4 text-[var(--accent-danger)]" />
                          )}
                          <span className="text-[var(--text-main)] font-semibold">
                            {tc.name} {tc.isHidden ? "(Hidden Case)" : "(Sample Case)"}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          {tc.executionTimeMs} ms
                        </span>
                      </div>

                      {tc.feedback && (
                        <div className="rounded bg-[var(--accent-danger-bg)] border border-[var(--accent-danger-border)] p-2 text-[var(--accent-danger-text)] text-[11px]">
                          {tc.feedback}
                        </div>
                      )}

                      {tc.error && (
                        <div className="rounded bg-[var(--accent-danger-bg)] border border-[var(--accent-danger-border)] p-2 text-[var(--accent-danger-text)] text-[11px] font-mono">
                          {tc.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
