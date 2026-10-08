"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";

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

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/v1/user/dashboard")
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
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-background text-slate-400">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Calculating PostgreSQL mastery stats...</p>
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
            Track your XP, solved challenges, progression levels, and tailored practice recommendations.
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
              className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl w-full flex-1 space-y-8 px-4 py-8 sm:px-6">
      {/* Welcome & Level Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Performance Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time PostgreSQL 16 skill progression, accuracy, and curriculum mastery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/topics"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-background-card px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:text-white transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Curriculum
          </Link>
          <Link
            href="/playground"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition"
          >
            <Zap className="h-3.5 w-3.5" />
            Open Playground
          </Link>
        </div>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Level & XP */}
        <div className="rounded-xl border border-slate-800 bg-background-card/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Level & XP</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">Level {stats?.level || 1}</span>
            <span className="text-xs font-mono text-amber-400">{stats?.totalXp || 0} XP</span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(10, 100 - ((stats?.xpToNextLevel || 50) / 100) * 100))}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {stats?.xpToNextLevel || 0} XP to Level {(stats?.level || 1) + 1}
            </p>
          </div>
        </div>

        {/* Card 2: Problems Solved */}
        <div className="rounded-xl border border-slate-800 bg-background-card/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {stats?.solvedCount || 0}
            </span>
            <span className="text-xs text-slate-400">/ {stats?.totalQuestions || 153}</span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{
                  width: `${Math.round(((stats?.solvedCount || 0) / (stats?.totalQuestions || 153)) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {Math.round(((stats?.solvedCount || 0) / (stats?.totalQuestions || 153)) * 100)}% of total catalog
            </p>
          </div>
        </div>

        {/* Card 3: Accuracy */}
        <div className="rounded-xl border border-slate-800 bg-background-card/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Accuracy Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary-light">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {stats?.accuracyPercentage || 0}%
            </span>
            <span className="text-xs text-slate-400">first-try ratio</span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${stats?.accuracyPercentage || 0}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Passing test evaluations</p>
          </div>
        </div>

        {/* Card 4: Streak */}
        <div className="rounded-xl border border-slate-800 bg-background-card/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Practice Streak</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {stats?.streakDays || 1} {stats?.streakDays === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-rose-400 rounded-full w-full" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Keep solving to maintain streak!</p>
          </div>
        </div>
      </div>

      {/* Recommended Next Practice Card (Explainable) */}
      {stats?.recommendedQuestion && (
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-background-card to-background-card p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary-light">
                  <Compass className="h-3 w-3" />
                  Recommended Next
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  {stats.recommendedQuestion.topicTitle}
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-400">
                  {stats.recommendedQuestion.difficulty}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {stats.recommendedQuestion.title}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <span className="text-primary-light font-medium">Why recommended:</span>
                <span>{stats.recommendedQuestion.reason}</span>
              </p>
            </div>

            <div>
              <Link
                href={`/practice/${stats.recommendedQuestion.slug}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-hover transition whitespace-nowrap"
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
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-white">Curriculum Mastery by Topic</h2>
          <span className="text-xs text-slate-400">
            {stats?.topicProgress.filter((t) => t.isMastered).length || 0} /{" "}
            {stats?.topicProgress.length || 51} Mastered (&ge; 80%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats?.topicProgress.map((tp) => (
            <div
              key={tp.topicId}
              className="rounded-xl border border-slate-800/80 bg-background-card/40 p-4 transition hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                    L{tp.level}
                  </span>
                  <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                    {tp.title}
                  </span>
                </div>
                {tp.isMastered && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <Award className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>
                    {tp.solvedCount} of {tp.totalCount} completed
                  </span>
                  <span className="font-mono text-slate-300">{tp.progressPercentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      tp.isMastered ? "bg-emerald-400" : "bg-primary"
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
