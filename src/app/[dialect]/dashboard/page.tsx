"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Trophy,
  Zap,
  Target,
  Flame,
  CheckCircle,
  Compass,
  ArrowRight,
  BookOpen,
  Award,
  LogIn,
  Database,
  Server,
} from "lucide-react";
import { Dialect } from "@/lib/engine/types";

interface TopicProgress {
  topicId: string;
  title: string;
  level: number;
  solvedCount: number;
  totalCount: number;
  progressPercentage: number;
  isMastered: boolean;
}

interface UserStats {
  userId: string;
  dialect: Dialect;
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  solvedCount: number;
  totalQuestions: number;
  accuracyPercentage: number;
  streakDays: number;
  topicProgress: TopicProgress[];
  recommendedQuestion?: {
    questionId: string;
    slug: string;
    title: string;
    difficulty: string;
    topicTitle: string;
    reason: string;
  };
}

export default function DialectDashboardPage({
  params,
}: {
  params: Promise<{ dialect: string }>;
}) {
  const resolvedParams = use(params);
  const dialect: Dialect = resolvedParams.dialect === "mysql" ? "mysql" : "postgresql";
  const isPostgres = dialect === "postgresql";

  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/${dialect}/user/dashboard`)
      .then(async (res) => {
        if (res.status === 401) {
          setUnauthenticated(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success && data?.data?.stats) {
          setStats(data.data.stats);
        }
      })
      .catch((err) => console.error("Error fetching dashboard stats:", err))
      .finally(() => setIsLoading(false));
  }, [dialect]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl w-full flex-1 space-y-8 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="h-8 w-48 bg-[var(--bg-surface)] rounded animate-pulse" />
          <div className="h-8 w-32 bg-[var(--bg-surface)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 animate-pulse space-y-3">
              <div className="h-4 w-24 bg-[var(--bg-surface)] rounded" />
              <div className="h-8 w-16 bg-[var(--bg-surface)] rounded" />
              <div className="h-2 w-full bg-[var(--bg-surface)] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-8 shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
            <LogIn className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Sign In to View Dashboard</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Track your XP, solved challenges, progression levels, and tailored practice recommendations.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-primary-text)] shadow-xs hover:bg-[var(--accent-primary-hover)] transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-[var(--border-control)] bg-[var(--bg-panel)] px-5 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl w-full flex-1 space-y-8 px-4 py-8 sm:px-6 bg-[var(--bg-base)] text-[var(--text-main)] transition-colors">
      {/* Welcome & Level Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              Performance Dashboard
            </h1>
            <span className="rounded px-2 py-0.5 text-xs font-bold border border-[var(--border-control)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
              {isPostgres ? "PostgreSQL 16" : "MySQL 8.4"}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Real-time {isPostgres ? "PostgreSQL" : "MySQL"} skill progression, accuracy, and curriculum mastery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${dialect}/topics`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--border-control)] bg-[var(--bg-panel)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs"
          >
            <BookOpen className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            Curriculum
          </Link>
          <Link
            href={`/${dialect}/playground`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition shadow-xs"
          >
            <Zap className="h-3.5 w-3.5" />
            Open Playground
          </Link>
        </div>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="relative">
        <div className="absolute -top-6 -left-6 w-64 h-36 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-6 -right-6 w-64 h-36 bg-[var(--accent-success)]/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Level & XP */}
          <div className="rounded-xl glass p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Level & XP</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-warning-bg)] text-[var(--accent-warning)]">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--text-main)]">Level {stats?.level || 1}</span>
              <span className="text-xs font-mono text-[var(--accent-warning)] font-semibold">{stats?.totalXp || 0} XP</span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-warning)] rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(10, 100 - ((stats?.xpToNextLevel || 50) / 100) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                {stats?.xpToNextLevel || 0} XP to Level {(stats?.level || 1) + 1}
              </p>
            </div>
          </div>

          {/* Card 2: Problems Solved */}
          <div className="rounded-xl glass p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Completed</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-success-bg)] text-[var(--accent-success)]">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--text-main)]">
                {stats?.solvedCount || 0}
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ {stats?.totalQuestions || 153}</span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-success)] rounded-full"
                  style={{
                    width: `${Math.round(((stats?.solvedCount || 0) / (stats?.totalQuestions || 153)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                {Math.round(((stats?.solvedCount || 0) / (stats?.totalQuestions || 153)) * 100)}% of total catalog
              </p>
            </div>
          </div>

          {/* Card 3: Accuracy */}
          <div className="rounded-xl glass p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Accuracy Rate</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--text-main)]">
                {stats?.accuracyPercentage || 0}%
              </span>
              <span className="text-xs text-[var(--text-muted)]">first-try ratio</span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded-full"
                  style={{ width: `${stats?.accuracyPercentage || 0}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Passing test evaluations</p>
            </div>
          </div>

          {/* Card 4: Streak */}
          <div className="rounded-xl glass p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Practice Streak</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-danger-bg)] text-[var(--accent-danger)]">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[var(--text-main)]">
                {stats?.streakDays || 1} {stats?.streakDays === 1 ? "day" : "days"}
              </span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
                <div className="h-full bg-[var(--accent-danger)] rounded-full w-full" />
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Keep solving to maintain streak!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Practice Card */}
      {stats?.recommendedQuestion && (
        <div className="rounded-2xl border border-[var(--border-control)] bg-[var(--bg-surface)] p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded bg-[var(--accent-primary)]/15 px-2 py-0.5 text-xs font-bold text-[var(--accent-primary)]">
                  <Compass className="h-3 w-3" />
                  Recommended Next
                </span>
                <span className="rounded bg-[var(--bg-panel)] border border-[var(--border-color)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                  {stats.recommendedQuestion.topicTitle}
                </span>
                <span className="rounded bg-[var(--accent-success-bg)] border border-[var(--accent-success-border)] px-2 py-0.5 text-[11px] font-semibold uppercase text-[var(--accent-success-text)]">
                  {stats.recommendedQuestion.difficulty}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                {stats.recommendedQuestion.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="text-[var(--accent-primary)] font-medium">Why recommended:</span>
                <span>{stats.recommendedQuestion.reason}</span>
              </p>
            </div>

            <div>
              <Link
                href={`/${dialect}/practice/${stats.recommendedQuestion.slug}`}
                className="flex items-center justify-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-xs font-bold text-[var(--accent-primary-text)] shadow-xs hover:bg-[var(--accent-primary-hover)] transition whitespace-nowrap"
              >
                <span>Solve Question</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Topic Mastery Progress Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Curriculum Mastery by Topic</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {stats?.topicProgress.filter((t) => t.isMastered).length || 0} /{" "}
            {stats?.topicProgress.length || 51} Mastered (&ge; 80%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats?.topicProgress.map((tp) => (
            <div
              key={tp.topicId}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 transition hover:border-[var(--border-control)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-[var(--bg-surface)] border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
                    L{tp.level}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-main)] truncate max-w-[170px]">
                    {tp.title}
                  </span>
                </div>
                {tp.isMastered && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-success)]">
                    <Award className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
                  <span>
                    {tp.solvedCount} of {tp.totalCount} completed
                  </span>
                  <span className="font-mono text-[var(--text-main)]">{tp.progressPercentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      tp.isMastered ? "bg-[var(--accent-success)]" : "bg-[var(--accent-primary)]"
                    }`}
                    style={{ width: `${tp.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
