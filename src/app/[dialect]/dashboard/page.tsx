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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-background text-slate-400">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Calculating {isPostgres ? "PostgreSQL" : "MySQL"} mastery stats...</p>
        </div>
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="rounded-2xl border border-slate-800 bg-background-card/50 p-8 shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary-light">
            <LogIn className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to View Dashboard</h2>
          <p className="mt-2 text-sm text-slate-400">
            Track your {isPostgres ? "PostgreSQL" : "MySQL"} XP, solved challenges, progression levels, and tailored practice recommendations.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-slate-700 bg-background-card px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const masteredCount = stats?.topicProgress.filter((t) => t.isMastered).length || 0;
  const overallPercentage =
    stats && stats.totalQuestions > 0
      ? Math.round((stats.solvedCount / stats.totalQuestions) * 100)
      : 0;

  return (
    <div className="flex-1 space-y-8 px-4 py-10 sm:px-6 max-w-6xl mx-auto w-full">
      {/* Header Profile Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {isPostgres ? "PostgreSQL" : "MySQL"} Practice Dashboard
            </h1>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                isPostgres
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                  : "border-teal-500/30 bg-teal-500/10 text-teal-300"
              }`}
            >
              {isPostgres ? "PostgreSQL 16" : "MySQL 8.4"}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Track your dialect-specific mastery, problem milestones, and skill progression.
          </p>
        </div>

        <Link
          href={`/${dialect}/topics`}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-background-card px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition shadow-sm w-fit"
        >
          <BookOpen className="h-4 w-4 text-slate-400" />
          <span>Browse Curriculum</span>
        </Link>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Level Card */}
        <div className="rounded-xl border border-slate-800 bg-background-card/50 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Progression Level</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">Level {stats?.level || 1}</div>
          <div className="text-[11px] text-slate-500">{stats?.xpToNextLevel || 50} XP to next level</div>
        </div>

        {/* Total XP Card */}
        <div className="rounded-xl border border-slate-800 bg-background-card/50 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{isPostgres ? "PostgreSQL" : "MySQL"} XP</span>
            <Zap className={`h-4 w-4 ${isPostgres ? "text-sky-400" : "text-teal-400"}`} />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.totalXp || 0}</div>
          <div className="text-[11px] text-slate-500">Earned in this dialect track</div>
        </div>

        {/* Solved Count Card */}
        <div className="rounded-xl border border-slate-800 bg-background-card/50 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Problems Solved</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {stats?.solvedCount || 0}
            <span className="text-xs font-normal text-slate-500 ml-1">/ {stats?.totalQuestions || 0}</span>
          </div>
          <div className="text-[11px] text-slate-500">{overallPercentage}% track completed</div>
        </div>

        {/* Accuracy Card */}
        <div className="rounded-xl border border-slate-800 bg-background-card/50 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Judging Accuracy</span>
            <Target className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.accuracyPercentage || 0}%</div>
          <div className="text-[11px] text-slate-500">Pass rate on submissions</div>
        </div>
      </div>

      {/* Recommended Next Problem */}
      {stats?.recommendedQuestion && (
        <div
          className={`rounded-2xl border p-6 shadow-lg ${
            isPostgres
              ? "border-sky-500/30 bg-gradient-to-r from-sky-950/20 to-background-card"
              : "border-teal-500/30 bg-gradient-to-r from-teal-950/20 to-background-card"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                  <Compass className="h-3 w-3" />
                  Recommended Next Step
                </span>
                <span className="text-xs text-slate-400">• {stats.recommendedQuestion.topicTitle}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{stats.recommendedQuestion.title}</h2>
              <p className="text-xs text-slate-400">{stats.recommendedQuestion.reason}</p>
            </div>

            <Link
              href={`/${dialect}/practice/${stats.recommendedQuestion.slug}`}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-md transition ${
                isPostgres ? "bg-sky-600 hover:bg-sky-500" : "bg-teal-600 hover:bg-teal-500"
              }`}
            >
              <span>Solve Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Topic Mastery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Curriculum Topic Mastery</h2>
          <span className="text-xs text-slate-400">
            {masteredCount} of {stats?.topicProgress.length || 0} topics mastered (≥80%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats?.topicProgress.map((tp) => (
            <div
              key={tp.topicId}
              className="rounded-xl border border-slate-800 bg-background-card/40 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate max-w-[180px]">{tp.title}</span>
                {tp.isMastered && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle className="h-3 w-3" /> Mastered
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Progress</span>
                  <span>
                    {tp.solvedCount}/{tp.totalCount} ({tp.progressPercentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      tp.isMastered ? "bg-emerald-500" : isPostgres ? "bg-sky-500" : "bg-teal-500"
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
