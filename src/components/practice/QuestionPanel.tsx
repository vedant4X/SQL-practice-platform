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
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import ResultTable from "./ResultTable";
import { QueryExecutionResult, TestCaseResult } from "@/lib/engine/types";

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
}: QuestionPanelProps) {
  const [confirmSolution, setConfirmSolution] = useState(false);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "easy":
        return (
          <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Easy
          </span>
        );
      case "medium":
        return (
          <span className="rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            Medium
          </span>
        );
      case "hard":
        return (
          <span className="rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            Hard
          </span>
        );
      default:
        return (
          <span className="rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400">
            Expert
          </span>
        );
    }
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#090d16] text-slate-800 dark:text-slate-200 transition-colors">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3">
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("description")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "description"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Description
          </button>
          <button
            onClick={() => setActiveTab("hints")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "hints"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Hints ({question.hintsUsed}/{question.totalHints})
          </button>
          <button
            onClick={() => setActiveTab("solution")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "solution"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Solution
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "results"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            Results
          </button>
          <button
            onClick={() => setActiveTab("testcases")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "testcases"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Test Cases
            {submitResult && (
              <span
                className={`ml-1 text-[11px] font-bold ${
                  submitResult.verdict === "correct"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                ({submitResult.passedCount}/{submitResult.totalCount})
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Travel Next Question Arrow Button in tab bar */}
          {nextSlug && (
            <Link
              href={`/${dialect}/practice/${nextSlug}`}
              className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Next Question"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}

          <button
            onClick={onToggleBookmark}
            title="Bookmark question"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition"
          >
            <Bookmark
              className={`h-4 w-4 ${question.isBookmarked ? "fill-blue-600 text-blue-600" : ""}`}
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
              <h1 className="text-base font-bold text-slate-900 dark:text-white">{question.title}</h1>
              <div className="flex items-center gap-2">
                {getDifficultyBadge(question.difficulty)}
                <span className="flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                  <Zap className="h-3 w-3" />
                  {question.xp} XP
                </span>
                {question.isSolved && (
                  <span className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Solved ✓
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
              {question.descriptionMarkdown}
            </div>

            {/* Expected Output Schema */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Expected Columns ({question.expectedColumns.length})
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {question.expectedColumns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between rounded bg-white dark:bg-slate-800 px-2.5 py-1.5 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{col.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{col.type}</span>
                  </div>
                ))}
              </div>
              {question.orderMatters && (
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                  ⚠️ Note: Output row order matters for this problem. Make sure to use ORDER BY.
                </div>
              )}
            </div>

            {/* Bottom Travel Arrow */}
            {nextSlug && (
              <div className="pt-2">
                <Link
                  href={`/${dialect}/practice/${nextSlug}`}
                  className="flex items-center justify-center gap-1.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span>Go to Next Question</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Hints */}
        {activeTab === "hints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Progressive Hint System</span>
              <span>
                Revealed: {question.hintsUsed} / {question.totalHints}
              </span>
            </div>

            {question.availableHints.length === 0 ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-center text-xs text-slate-600 dark:text-slate-400">
                <Lightbulb className="mx-auto h-6 w-6 text-amber-500 mb-2 opacity-80" />
                <p className="mb-3">Need direction? Unlocking a hint provides guided direction with a 20% XP penalty per level.</p>
                <button
                  onClick={onUnlockHint}
                  className="rounded bg-blue-600 px-3 py-1.5 font-semibold text-white text-xs hover:bg-blue-700 transition"
                >
                  Unlock Hint 1 (-20% XP)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {question.availableHints.map((hintText, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs space-y-1 text-slate-800 dark:text-slate-200"
                  >
                    <div className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Hint {idx + 1}
                    </div>
                    <p className="leading-relaxed">{hintText}</p>
                  </div>
                ))}

                {question.hintsUsed < question.totalHints && (
                  <button
                    onClick={onUnlockHint}
                    className="w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
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
              <div className="rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-5 text-center text-xs text-rose-900 dark:text-rose-200">
                <Lightbulb className="mx-auto h-7 w-7 text-amber-500 mb-2" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Gated Solution</h3>
                <p className="mb-4 text-slate-600 dark:text-slate-300">
                  Viewing the official solution will permanently forfeit all XP for this question (0 XP awarded).
                </p>

                {confirmSolution ? (
                  <div className="space-y-2">
                    <button
                      onClick={onRevealSolution}
                      className="w-full rounded bg-rose-600 px-4 py-2 font-bold text-white transition hover:bg-rose-700"
                    >
                      Confirm: Forfeit XP & Reveal Solution
                    </button>
                    <button
                      onClick={() => setConfirmSolution(false)}
                      className="w-full text-slate-500 dark:text-slate-400 hover:underline text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmSolution(true)}
                    className="rounded border border-rose-300 dark:border-rose-800 bg-white dark:bg-rose-950/40 px-4 py-2 font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/50 transition"
                  >
                    Reveal Solution
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                    Official Reference Solution
                  </span>
                  <pre className="font-mono text-xs text-emerald-700 dark:text-emerald-400 overflow-x-auto p-2.5 bg-white dark:bg-[#090d16] rounded border border-slate-200 dark:border-slate-800">
                    {question.solutionQuery}
                  </pre>
                </div>

                {question.solutionExplanation && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Line-by-Line Explanation</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {question.solutionExplanation}
                    </p>
                  </div>
                )}

                {question.commonMistakes && question.commonMistakes.length > 0 && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-1 text-xs">
                    <span className="font-semibold text-amber-800 dark:text-amber-400">Common Mistakes to Avoid</span>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
                      {question.commonMistakes.map((cm, i) => (
                        <li key={i}>{cm}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.interviewTip && (
                  <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 p-3 space-y-1 text-xs">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">Interview Tip</span>
                    <p className="text-slate-700 dark:text-slate-300">{question.interviewTip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Results */}
        {activeTab === "results" && (
          <div className="space-y-3">
            {/* Quick travel banner above/next to results */}
            {nextSlug && runResult && (
              <div className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400">Ready to move forward?</span>
                <Link
                  href={`/${dialect}/practice/${nextSlug}`}
                  className="flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  <span>Next Question</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
            <ResultTable result={runResult} isLoading={isLoading} />
          </div>
        )}

        {/* Tab 5: Test Cases */}
        {activeTab === "testcases" && (
          <div className="space-y-4">
            {!submitResult ? (
              <div className="p-6 text-center text-xs text-slate-500 italic">
                Press "Submit" to judge your query against all automated test cases.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Overall Verdict Banner */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-lg p-3.5 text-xs font-semibold border ${
                    submitResult.verdict === "correct"
                      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                      : "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {submitResult.verdict === "correct" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    )}
                    <span className="text-sm font-bold">
                      {submitResult.verdict === "correct"
                        ? `Passed all test cases! (${submitResult.passedCount}/${submitResult.totalCount})`
                        : `Not quite. Passed ${submitResult.passedCount}/${submitResult.totalCount}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {submitResult.xpEarned !== undefined && submitResult.xpEarned > 0 && (
                      <span className="rounded bg-emerald-600 px-2 py-0.5 text-white font-bold text-xs">
                        +{submitResult.xpEarned} XP
                      </span>
                    )}

                    {/* PROMINENT NEXT QUESTION ARROW BUTTON */}
                    {nextSlug && (
                      <Link
                        href={`/${dialect}/practice/${nextSlug}`}
                        className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 text-xs transition shadow-sm"
                        title="Proceed to next question"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Per-test-case list */}
                <div className="space-y-2">
                  {submitResult.testCaseResults.map((tc, idx) => (
                    <div
                      key={tc.testCaseId || idx}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16] p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                          {tc.passed ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          )}
                          <span className="text-slate-900 dark:text-white font-semibold">
                            {tc.name} {tc.isHidden ? "(Hidden Case)" : "(Sample Case)"}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {tc.executionTimeMs} ms
                        </span>
                      </div>

                      {tc.feedback && (
                        <div className="rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-2 text-rose-800 dark:text-rose-300 text-[11px]">
                          {tc.feedback}
                        </div>
                      )}

                      {tc.error && (
                        <div className="rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-2 text-rose-900 dark:text-rose-300 text-[11px] font-mono">
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
