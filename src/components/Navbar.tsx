"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Database,
  Terminal,
  BarChart2,
  BookOpen,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Server,
  Zap,
} from "lucide-react";
import { Dialect } from "@/lib/engine/types";
import { useTheme } from "@/lib/theme/ThemeContext";
import ThemeToggle from "@/components/playground/ThemeToggle";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  totalXp: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialectDropdownOpen, setDialectDropdownOpen] = useState(false);

  const activeDialect: Dialect = pathname.startsWith("/mysql") ? "mysql" : "postgresql";
  const isPostgres = activeDialect === "postgresql";

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          {/* Minimalist Logo */}
          <Link href="/" className="flex items-center gap-2 group transition">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs shadow-sm">
              <Database className="h-4 w-4" />
            </div>
            <span className="text-sm tracking-tight font-semibold text-slate-900 dark:text-white">
              SQL<span className="text-blue-600 dark:text-blue-400">Judge</span>
            </span>
          </Link>

          {/* Dialect Selector */}
          <div className="relative">
            <button
              onClick={() => setDialectDropdownOpen(!dialectDropdownOpen)}
              className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Server className="h-3 w-3 text-slate-500" />
              <span>{isPostgres ? "PostgreSQL 16" : "MySQL 8.4"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {dialectDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg z-50 text-xs">
                <button
                  onClick={() => handleSwitchDialect("postgresql")}
                  className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 transition ${
                    isPostgres
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    <span>PostgreSQL 16</span>
                  </div>
                  {isPostgres && <span className="text-[10px] text-blue-600 dark:text-blue-400">Active</span>}
                </button>
                <button
                  onClick={() => handleSwitchDialect("mysql")}
                  className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 transition mt-0.5 ${
                    !isPostgres
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                    <span>MySQL 8.4</span>
                  </div>
                  {!isPostgres && <span className="text-[10px] text-blue-600 dark:text-blue-400">Active</span>}
                </button>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Link
              href={`/${activeDialect}/topics`}
              className={`flex items-center gap-1.5 transition hover:text-slate-900 dark:hover:text-white ${
                pathname.includes("/topics") ? "text-slate-900 dark:text-white font-semibold" : ""
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Curriculum
            </Link>
            <Link
              href={`/${activeDialect}/playground`}
              className={`flex items-center gap-1.5 transition hover:text-slate-900 dark:hover:text-white ${
                pathname.includes("/playground") ? "text-slate-900 dark:text-white font-semibold" : ""
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Playground
            </Link>
            <Link
              href={`/${activeDialect}/dashboard`}
              className={`flex items-center gap-1.5 transition hover:text-slate-900 dark:hover:text-white ${
                pathname.includes("/dashboard") ? "text-slate-900 dark:text-white font-semibold" : ""
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {loading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <Zap className="h-3 w-3 text-amber-500 fill-current" />
                <span>{user.totalXp || 0} XP</span>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <UserIcon className="h-3 w-3 opacity-60" />
                <span className="max-w-[100px] truncate">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded p-1 text-slate-400 hover:text-rose-600 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition shadow-sm"
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
