"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Database,
  Zap,
  Terminal,
  BarChart2,
  BookOpen,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Server,
} from "lucide-react";
import { Dialect } from "@/lib/engine/types";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  totalXp: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialectDropdownOpen, setDialectDropdownOpen] = useState(false);

  // Determine current active dialect from path or cookie
  const activeDialect: Dialect = pathname.startsWith("/mysql") ? "mysql" : "postgresql";

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data?.user) {
          setUser(data.data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  const handleSwitchDialect = (newDialect: Dialect) => {
    setDialectDropdownOpen(false);
    document.cookie = `sql_dialect=${newDialect}; path=/; max-age=31536000`;

    // Map current path to target dialect path
    if (pathname.includes("/topics")) {
      router.push(`/${newDialect}/topics`);
    } else if (pathname.includes("/playground")) {
      router.push(`/${newDialect}/playground`);
    } else if (pathname.includes("/dashboard")) {
      router.push(`/${newDialect}/dashboard`);
    } else if (pathname.includes("/practice")) {
      router.push(`/${newDialect}/topics`);
    } else {
      router.push(`/${newDialect}/topics`);
    }
  };

  const isPostgres = activeDialect === "postgresql";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-background-border bg-background-darker/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-white transition hover:opacity-90">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm text-white ${
                isPostgres ? "bg-sky-600" : "bg-teal-600"
              }`}
            >
              <Database className="h-5 w-5" />
            </div>
            <span className="text-lg tracking-tight font-mono font-semibold">
              SQL<span className={isPostgres ? "text-sky-400" : "text-teal-400"}>JUDGE</span>
            </span>
          </Link>

          {/* Dialect Switcher & Engine Badge */}
          <div className="relative">
            <button
              onClick={() => setDialectDropdownOpen(!dialectDropdownOpen)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isPostgres
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                  : "border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>{isPostgres ? "PostgreSQL 16" : "MySQL 8.4"}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {dialectDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-lg border border-slate-700 bg-background-card p-1 shadow-xl z-50">
                <button
                  onClick={() => handleSwitchDialect("postgresql")}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition ${
                    isPostgres
                      ? "bg-sky-600/20 text-sky-300 font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    <span>PostgreSQL 16</span>
                  </div>
                  {isPostgres && <span className="text-[10px] text-sky-400">Active</span>}
                </button>
                <button
                  onClick={() => handleSwitchDialect("mysql")}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition ${
                    !isPostgres
                      ? "bg-teal-600/20 text-teal-300 font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-400" />
                    <span>MySQL 8.4</span>
                  </div>
                  {!isPostgres && <span className="text-[10px] text-teal-400">Active</span>}
                </button>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
            <Link
              href={`/${activeDialect}/topics`}
              className="flex items-center gap-1.5 transition hover:text-white"
            >
              <BookOpen className="h-4 w-4 text-slate-400" />
              Curriculum
            </Link>
            <Link
              href={`/${activeDialect}/playground`}
              className="flex items-center gap-1.5 transition hover:text-white"
            >
              <Terminal className="h-4 w-4 text-slate-400" />
              SQL Playground
            </Link>
            <Link
              href={`/${activeDialect}/dashboard`}
              className="flex items-center gap-1.5 transition hover:text-white"
            >
              <BarChart2 className="h-4 w-4 text-slate-400" />
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-slate-800" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isPostgres
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                    : "border-teal-500/30 bg-teal-500/10 text-teal-300"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{user.totalXp || 0} XP</span>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-background-card px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              >
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[100px] truncate">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition ${
                  isPostgres
                    ? "bg-sky-600 hover:bg-sky-500"
                    : "bg-teal-600 hover:bg-teal-500"
                }`}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
