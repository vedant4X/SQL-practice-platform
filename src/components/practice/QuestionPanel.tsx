"use client";

import React, { useState } from "react";
import {
  BookOpen,
  HelpCircle,
  Lightbulb,
  Table,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Bookmark,
  Share2,
  ChevronRight,
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
}: QuestionPanelProps) {
  const [confirmSolution, setConfirmSolution] = useState(false);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "easy":
        return <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">🟢 Easy</span>;
      case "medium":
        return <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-400">🟡 Medium</span>;
      case "hard":
        return <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-400">🔴 Hard</span>;
      default:
        return <span className="rounded bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-xs font-semibold text-purple-400">🟣 Expert</span>;
    }
  };

  return (
    <div className="flex h-full flex-col bg-background-card/50 text-slate-200">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-background-border bg-background-darker/60 px-3">
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("description")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "description"
                ? "border-primary text-primary-light font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Description
          </button>
          <button
            onClick={() => setActiveTab("hints")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "hints"
                ? "border-primary text-primary-light font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Hints ({question.hintsUsed}/{question.totalHints})
          </button>
          <button
            onClick={() => setActiveTab("solution")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "solution"
                ? "border-primary text-primary-light font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Solution
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "results"
                ? "border-primary text-primary-light font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            Results
          </button>
          <button
            onClick={() => setActiveTab("testcases")}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition ${
              activeTab === "testcases"
                ? "border-primary text-primary-light font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Test Cases
            {submitResult && (
              <span className={`ml-1 text-[11px] font-bold ${submitResult.verdict === "correct" ? "text-emerald-400" : "text-rose-400"}`}>
                ({submitResult.passedCount}/{submitResult.totalCount})
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onToggleBookmark}
          title="Bookmark question"
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Bookmark className={`h-4 w-4 ${question.isBookmarked ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {/* Tab 1: Description */}
        {activeTab === "description" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-lg font-bold text-white">{question.title}</h1>
              <div className="flex items-center gap-2">
                {getDifficultyBadge(question.difficulty)}
                <span className="flex items-center gap-1 rounded bg-primary/10 border border-primary/30 px-2 py-0.5 text-xs font-semibold text-primary-light">
                  <Zap className="h-3 w-3" />
                  {question.xp} XP
                </span>
                {question.isSolved && (
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    Solved ✓
                  </span>
                )}
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed">
              <p>{question.descriptionMarkdown}</p>
            </div>

            {/* Expected Output Schema */}
            <div className="rounded-lg border border-slate-800 bg-background-darker/50 p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Expected Columns ({question.expectedColumns.length})
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {question.expectedColumns.map((col) => (
                  <div key={col.name} className="flex items-center justify-between rounded bg-slate-800/60 px-2 py-1">
                    <span className="text-primary-light font-medium">{col.name}</span>
                    <span className="text-[10px] text-slate-400">{col.type}</span>
                  </div>
                ))}
              </div>
              {question.orderMatters && (
                <div className="text-[11px] text-amber-300 font-medium pt-1">
                  ⚠️ Note: Output row order matters for this problem. Make sure to use ORDER BY.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Hints */}
        {activeTab === "hints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs">Progressive Hint System</span>
              <span className="text-xs text-slate-400">
                Revealed: {question.hintsUsed} / {question.totalHints}
              </span>
            </div>

            {question.availableHints.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-center text-xs text-slate-400">
                <Lightbulb className="mx-auto h-6 w-6 text-amber-400 mb-2 opacity-60" />
                <p className="mb-3">Need a nudge? Unlocking a hint provides guided direction with a 20% XP penalty per level.</p>
                <button
                  onClick={onUnlockHint}
                  className="rounded bg-primary px-3 py-1.5 font-semibold text-white text-xs hover:bg-primary-hover transition"
                >
                  Unlock Hint 1 (-20% XP)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {question.availableHints.map((hintText, idx) => (
                  <div key={idx} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-1">
                    <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Hint {idx + 1}
                    </div>
                    <p className="text-slate-200">{hintText}</p>
                  </div>
                ))}

                {question.hintsUsed < question.totalHints && (
                  <button
                    onClick={onUnlockHint}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
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
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-center text-xs text-slate-300">
                <Lightbulb className="mx-auto h-8 w-8 text-amber-400 mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">Gated Solution</h3>
                <p className="mb-4 text-slate-300">
                  Viewing the official solution will permanently forfeit all XP for this question (0 XP awarded).
                </p>

                {confirmSolution ? (
                  <div className="space-y-2">
                    <button
                      onClick={onRevealSolution}
                      className="w-full rounded bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700"
                    >
                      Confirm: Forfeit XP & Reveal Solution
                    </button>
                    <button
                      onClick={() => setConfirmSolution(false)}
                      className="w-full text-slate-400 hover:text-white text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmSolution(true)}
                    className="rounded border border-red-500/50 bg-red-500/20 px-4 py-2 font-semibold text-red-300 hover:bg-red-500/30 transition"
                  >
                    Reveal Solution
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-800 bg-editor-bg p-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Official Reference Solution
                  </span>
                  <pre className="font-mono text-xs text-emerald-400 overflow-x-auto p-2 bg-slate-900 rounded">
                    {question.solutionQuery}
                  </pre>
                </div>

                {question.solutionExplanation && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white">Line-by-Line Explanation</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{question.solutionExplanation}</p>
                  </div>
                )}

                {question.commonMistakes && question.commonMistakes.length > 0 && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1 text-xs">
                    <span className="font-semibold text-amber-400">Common Mistakes to Avoid</span>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {question.commonMistakes.map((cm, i) => (
                        <li key={i}>{cm}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.interviewTip && (
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 space-y-1 text-xs">
                    <span className="font-semibold text-primary-light">Interview Tip</span>
                    <p className="text-slate-200">{question.interviewTip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Results */}
        {activeTab === "results" && (
          <ResultTable result={runResult} isLoading={isLoading} />
        )}

        {/* Tab 5: Test Cases */}
        {activeTab === "testcases" && (
          <div className="space-y-4">
            {!submitResult ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                Press "Submit" to judge your query against all test cases.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Overall Verdict Banner */}
                <div
                  className={`flex items-center justify-between rounded-lg p-3 text-xs font-semibold ${
                    submitResult.verdict === "correct"
                      ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border border-rose-500/40 bg-rose-500/15 text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {submitResult.verdict === "correct" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-400" />
                    )}
                    <span className="text-sm">
                      {submitResult.verdict === "correct"
                        ? `🎉 Correct! Passed ${submitResult.passedCount}/${submitResult.totalCount}`
                        : `Not Quite. Passed ${submitResult.passedCount}/${submitResult.totalCount}`}
                    </span>
                  </div>
                  {submitResult.xpEarned !== undefined && submitResult.xpEarned > 0 && (
                    <span className="rounded bg-emerald-500 px-2 py-0.5 text-white font-bold">
                      +{submitResult.xpEarned} XP
                    </span>
                  )}
                </div>

                {/* Per-test-case list */}
                <div className="space-y-2">
                  {submitResult.testCaseResults.map((tc, idx) => (
                    <div
                      key={tc.testCaseId || idx}
                      className="rounded-lg border border-slate-800 bg-background-darker/70 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                          {tc.passed ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400" />
                          )}
                          <span className="text-white">
                            {tc.name} {tc.isHidden ? "(Hidden Case)" : "(Sample Case)"}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {tc.executionTimeMs} ms
                        </span>
                      </div>

                      {tc.feedback && (
                        <div className="rounded bg-rose-500/10 border border-rose-500/20 p-2 text-rose-300 text-[11px]">
                          {tc.feedback}
                        </div>
                      )}

                      {tc.error && (
                        <div className="rounded bg-red-500/10 border border-red-500/20 p-2 text-red-400 text-[11px] font-mono">
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
