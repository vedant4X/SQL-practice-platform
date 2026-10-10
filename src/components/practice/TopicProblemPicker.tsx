"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ListOrdered,
  ChevronDown,
  CheckCircle,
  Circle,
  CircleDot,
  Search,
  X,
} from "lucide-react";
import { TopicQuestionSummary } from "@/lib/curriculum/navigation";

interface TopicProblemPickerProps {
  topicTitle: string;
  topicSlug?: string | null;
  currentIndex: number;
  totalInTopic: number;
  topicQuestions: TopicQuestionSummary[];
  currentSlug: string;
  dialect: string;
}

export default function TopicProblemPicker({
  topicTitle,
  currentIndex,
  totalInTopic,
  topicQuestions,
  currentSlug,
  dialect,
}: TopicProblemPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "solved" | "unsolved">("all");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const solvedCount = topicQuestions.filter((q) => q.isSolved).length;
  const progressPercent = totalInTopic > 0 ? Math.round((solvedCount / totalInTopic) * 100) : 0;

  // Filter questions based on search & filter tab
  const filteredQuestions = topicQuestions.filter((q) => {
    if (filterMode === "solved" && !q.isSolved) return false;
    if (filterMode === "unsolved" && q.isSolved) return false;
    if (searchQuery.trim()) {
      const match =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(q.order).includes(searchQuery);
      if (!match) return false;
    }
    return true;
  });

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "easy":
        return (
          <span className="rounded bg-[var(--accent-success-bg)] px-1.5 py-0.2 text-[10px] font-medium text-[var(--accent-success-text)] border border-[var(--accent-success-border)]">
            Easy
          </span>
        );
      case "medium":
        return (
          <span className="rounded bg-[var(--accent-warning-bg)] px-1.5 py-0.2 text-[10px] font-medium text-[var(--accent-warning-text)] border border-[var(--accent-warning-border)]">
            Med
          </span>
        );
      case "hard":
      case "expert":
        return (
          <span className="rounded bg-[var(--accent-danger-bg)] px-1.5 py-0.2 text-[10px] font-medium text-[var(--accent-danger-text)] border border-[var(--accent-danger-border)]">
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="View all 32 problems in this topic"
        className="flex items-center gap-1.5 rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
      >
        <ListOrdered className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />
        <span className="font-mono font-semibold">
          {currentIndex} / {totalInTopic}
        </span>
        <span className="hidden sm:inline text-[11px] text-[var(--text-muted)]">Problems</span>
        <span className="rounded bg-[var(--accent-success-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-success-text)] border border-[var(--accent-success-border)]">
          {solvedCount}/{totalInTopic}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* LeetCode-style Problem Navigator Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-[340px] sm:w-[420px] rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-xl z-50 overflow-hidden flex flex-col max-h-[520px] transition-colors">
          {/* Header & Progress Summary */}
          <div className="p-3.5 border-b border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                  Topic Curriculum
                </span>
                <span className="text-xs font-bold text-[var(--text-main)] truncate block">
                  {topicTitle || "Problems in Topic"}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--border-color)] hover:text-[var(--text-main)] transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Solved Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[var(--text-secondary)]">Solved Progress:</span>
                <span className="font-semibold text-[var(--accent-success)]">
                  {solvedCount} / {totalInTopic} ({progressPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`rounded px-2 py-0.5 font-medium transition ${
                    filterMode === "all"
                      ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
                  }`}
                >
                  All ({totalInTopic})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("solved")}
                  className={`rounded px-2 py-0.5 font-medium transition ${
                    filterMode === "solved"
                      ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
                  }`}
                >
                  Solved ({solvedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("unsolved")}
                  className={`rounded px-2 py-0.5 font-medium transition ${
                    filterMode === "unsolved"
                      ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
                  }`}
                >
                  Todo ({totalInTopic - solvedCount})
                </button>
              </div>

              {/* Search filter input */}
              <div className="relative flex-1 max-w-[140px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter..."
                  className="w-full rounded border border-[var(--border-control)] bg-[var(--bg-panel)] pl-6 pr-2 py-0.5 text-[11px] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--border-control)]"
                />
              </div>
            </div>
          </div>

          {/* Scrollable Questions List (1 to 32) */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-[var(--border-color)]/30">
            {filteredQuestions.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                No problems match the current filter.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isCurrent = q.slug === currentSlug;
                return (
                  <Link
                    key={q.id}
                    href={`/${dialect}/practice/${q.slug}`}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition ${
                      isCurrent
                        ? "bg-[var(--bg-surface)] border-l-2 border-[var(--accent-primary)] font-semibold"
                        : "hover:bg-[var(--bg-surface)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      {/* Solved Status Indicator */}
                      {q.isSolved ? (
                        <span title="Solved" className="inline-flex shrink-0">
                          <CheckCircle className="h-4 w-4 text-[var(--accent-success)]" />
                        </span>
                      ) : isCurrent ? (
                        <span title="Current problem" className="inline-flex shrink-0">
                          <CircleDot className="h-4 w-4 text-[var(--accent-primary)]" />
                        </span>
                      ) : (
                        <span title="Unsolved" className="inline-flex shrink-0">
                          <Circle className="h-4 w-4 text-[var(--text-muted)] opacity-30" />
                        </span>
                      )}

                      {/* Numerical Order: 1., 2., 32. */}
                      <span className="font-mono font-bold text-[var(--text-secondary)] shrink-0 w-6 text-right">
                        {q.order}.
                      </span>

                      {/* Title */}
                      <span
                        className={`truncate ${
                          isCurrent
                            ? "text-[var(--accent-primary)]"
                            : q.isSolved
                            ? "text-[var(--text-main)]"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {q.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrent && (
                        <span className="rounded bg-[var(--accent-primary)] text-[var(--accent-primary-text)] px-1.5 py-0.2 text-[9px] font-bold">
                          Current
                        </span>
                      )}
                      {getDifficultyBadge(q.difficulty)}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
