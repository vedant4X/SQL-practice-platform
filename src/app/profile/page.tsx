"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Shield,
  Zap,
  Bookmark,
  ExternalLink,
  Sliders,
  CheckCircle,
  LogIn,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface SavedQuestion {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  topicId: string;
  xp: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  totalXp: number;
  level: number;
}

interface UserSettings {
  practiceModeEnabled: boolean;
  theme: "dark" | "light";
  leaderboardVisible: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    practiceModeEnabled: false,
    theme: "dark",
    leaderboardVisible: true,
  });
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    // 1. Fetch User Profile
    fetch("/api/v1/auth/me")
      .then(async (res) => {
        if (res.status === 401) {
          setUnauthenticated(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success && data?.data?.user) {
          setProfile(data.data.user);
        }
      })
      .catch(() => setUnauthenticated(true))
      .finally(() => setLoading(false));

    // 2. Fetch Bookmarks
    fetch("/api/v1/user/saved-questions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data?.savedQuestions) {
          setSavedQuestions(data.data.savedQuestions);
        }
      })
      .catch(() => {});

    // 3. Fetch Settings
    fetch("/api/v1/user/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data?.settings) {
          setSettings(data.data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const handleTogglePracticeMode = async () => {
    const updated = !settings.practiceModeEnabled;
    setSettings((prev) => ({ ...prev, practiceModeEnabled: updated }));
    if (typeof window !== "undefined") {
      localStorage.setItem("quro_practice_mode", String(updated));
    }
    try {
      await fetch("/api/v1/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceModeEnabled: updated }),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  const handleRemoveBookmark = async (questionId: string) => {
    try {
      await fetch("/api/v1/user/saved-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      setSavedQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[var(--bg-base)] text-[var(--text-muted)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
      </div>
    );
  }

  if (unauthenticated || !profile) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-20 text-center bg-[var(--bg-base)]">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-8 shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
            <LogIn className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">Sign In to View Profile</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Access your saved questions, practice preferences, and XP ledger.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-primary-text)] shadow-xs hover:bg-[var(--accent-primary-hover)] transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] px-5 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs"
            >
              Register Free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full flex-1 space-y-8 px-4 py-8 sm:px-6 bg-[var(--bg-base)] text-[var(--text-main)] transition-colors">
      {/* Profile Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--border-control)] text-[var(--accent-primary)]">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-main)]">{profile.name}</h1>
              <span className="rounded bg-[var(--accent-success-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-success-text)] border border-[var(--accent-success-border)]">
                {profile.role.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{profile.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-5 py-3 shadow-xs">
          <div className="text-right">
            <span className="text-[11px] text-[var(--text-muted)] block uppercase font-medium">Postgres Rank</span>
            <span className="text-xl font-black text-[var(--accent-warning)]">Level {profile.level || 1}</span>
          </div>
          <div className="h-8 w-px bg-[var(--border-color)]" />
          <div>
            <span className="text-[11px] text-[var(--text-muted)] block uppercase font-medium">Accumulated XP</span>
            <span className="text-xl font-black text-[var(--text-main)]">{profile.totalXp || 0} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
              <Sliders className="h-4 w-4 text-[var(--accent-primary)]" />
              <h2 className="text-sm font-bold text-[var(--text-main)]">Editor & Learning Settings</h2>
            </div>

            {/* Practice Mode Toggle */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-[var(--text-main)]">Practice Mode (Anti-Paste)</span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Blocks clipboard paste in the code editor to reinforce muscle memory and syntactic fluency.
                  </p>
                </div>
                <button
                  onClick={handleTogglePracticeMode}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.practiceModeEnabled ? "bg-[var(--accent-primary)]" : "bg-[var(--border-control)]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[var(--bg-panel)] shadow ring-0 transition duration-200 ease-in-out ${
                      settings.practiceModeEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {savedNotice && (
                <span className="text-[11px] text-[var(--accent-success-text)] font-semibold animate-pulse block">
                  Settings updated!
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1">
              <p>• Database: PostgreSQL 16.4 Engine</p>
              <p>• Isolation: Transaction Rollback Sandbox</p>
              <p>• Statements: Single-query AST validation</p>
            </div>
          </div>
        </div>

        {/* Right Column: Saved Questions */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-[var(--accent-primary)]" />
              <h2 className="text-sm font-bold text-[var(--text-main)]">Bookmarked Questions</h2>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{savedQuestions.length} saved</span>
          </div>

          {savedQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] p-8 text-center text-[var(--text-muted)] bg-[var(--bg-panel)]">
              <Bookmark className="h-8 w-8 mb-2 opacity-40 text-[var(--text-muted)]" />
              <p className="text-xs font-medium">No bookmarked questions yet.</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Click the bookmark icon in any question workspace to save it here for later review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedQuestions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 transition hover:border-[var(--border-control)] shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-main)]">{q.title}</span>
                      <span className="rounded bg-[var(--accent-success-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--accent-success-text)] border border-[var(--accent-success-border)]">
                        {q.difficulty}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">+{q.xp} XP available</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemoveBookmark(q.id)}
                      className="rounded border border-[var(--border-control)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-danger)] hover:border-[var(--accent-danger)] transition"
                      title="Remove bookmark"
                    >
                      Remove
                    </button>
                    <Link
                      href={`/practice/${q.slug}`}
                      className="flex items-center gap-1 rounded bg-[var(--accent-primary)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition shadow-xs"
                    >
                      <span>Reopen in Editor</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
