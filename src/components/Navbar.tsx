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
  Shield,
} from "lucide-react";
import { Dialect } from "@/lib/engine/types";
import { useTheme } from "@/lib/theme/ThemeContext";
import ThemeToggle from "@/components/playground/ThemeToggle";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  totalXp: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialectDropdownOpen, setDialectDropdownOpen] = useState(false);

  const [activeDialect, setActiveDialect] = useState<Dialect>(() => {
    if (pathname.startsWith("/postgresql")) return "postgresql";
    return "mysql";
  });

  useEffect(() => {
    if (pathname.startsWith("/postgresql")) {
      setActiveDialect("postgresql");
    } else if (pathname.startsWith("/mysql")) {
      setActiveDialect("mysql");
    } else if (typeof document !== "undefined") {
      const match = document.cookie.match(/sql_dialect=(postgresql|mysql)/);
      setActiveDialect(match ? (match[1] as Dialect) : "mysql");
    } else {
      setActiveDialect("mysql");
    }
  }, [pathname]);

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
    <header className="sticky top-0 z-50 w-full border-b border-[var(--glass-border)] glass transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group transition">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold text-xs shadow-xs">
              <Database className="h-4 w-4" />
            </div>
            <span className="text-sm tracking-tight font-semibold text-[var(--text-main)]">
              Qu<span className="text-[var(--accent-primary)]">ro</span>
            </span>
          </Link>

          {/* Dialect Selector */}
          <div className="relative">
            <button
              onClick={() => setDialectDropdownOpen(!dialectDropdownOpen)}
              aria-label="Select database engine"
              className="flex items-center gap-2 rounded-md glass glass-interactive px-2.5 py-1 text-xs font-medium text-[var(--text-main)] transition"
            >
              <Server className="h-3 w-3 text-[var(--text-muted)]" />
              <span>{isPostgres ? "PostgreSQL 16" : "MySQL 8.4"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {dialectDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 rounded-md glass-strong p-1 shadow-card z-50 text-xs">
                {/* MySQL 8.4 (First Priority) */}
                <button
                  onClick={() => handleSwitchDialect("mysql")}
                  className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 transition ${
                    !isPostgres
                      ? "bg-[var(--accent-success-bg)] text-[var(--accent-success-text)] font-semibold"
                      : "text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-success)]" />
                    <span>MySQL 8.4</span>
                  </div>
                  {!isPostgres && <span className="text-[10px] text-[var(--accent-primary)]">Active</span>}
                </button>

                {/* PostgreSQL 16 (Second Priority) */}
                <button
                  onClick={() => handleSwitchDialect("postgresql")}
                  className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 transition mt-0.5 ${
                    isPostgres
                      ? "bg-[var(--accent-success-bg)] text-[var(--accent-success-text)] font-semibold"
                      : "text-[var(--text-main)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                    <span>PostgreSQL 16</span>
                  </div>
                  {isPostgres && <span className="text-[10px] text-[var(--accent-primary)]">Active</span>}
                </button>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-[var(--text-muted)]">
            <Link
              href={`/${activeDialect}/topics`}
              className={`flex items-center gap-1.5 transition hover:text-[var(--text-main)] ${
                pathname.includes("/topics") ? "text-[var(--text-main)] font-semibold" : ""
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Curriculum
            </Link>
            <Link
              href={`/${activeDialect}/playground`}
              className={`flex items-center gap-1.5 transition hover:text-[var(--text-main)] ${
                pathname.includes("/playground") ? "text-[var(--text-main)] font-semibold" : ""
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Playground
            </Link>
            <Link
              href={`/${activeDialect}/dashboard`}
              className={`flex items-center gap-1.5 transition hover:text-[var(--text-main)] ${
                pathname.includes("/dashboard") ? "text-[var(--text-main)] font-semibold" : ""
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 transition text-[var(--accent-warning)] hover:text-[var(--accent-warning-text)] ${
                  pathname.startsWith("/admin") ? "font-bold underline" : "font-medium"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {loading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-[var(--bg-surface)]" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1 rounded bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-warning-text)] transition hover:opacity-85 ${
                    pathname.startsWith("/admin") ? "ring-2 ring-[var(--accent-warning)]" : ""
                  }`}
                  title="Administrator Console"
                >
                  <Shield className="h-3 w-3 text-[var(--accent-warning)]" />
                  <span>Admin</span>
                </Link>
              )}
              <div className="flex items-center gap-1 rounded bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] px-2 py-0.5 text-xs font-medium text-[var(--accent-warning-text)]">
                <Zap className="h-3 w-3 text-[var(--accent-warning)] fill-current" />
                <span>{user.totalXp || 0} XP</span>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 rounded-md glass glass-interactive px-2.5 py-1 text-xs font-medium text-[var(--text-main)] transition shadow-xs"
              >
                <UserIcon className="h-3 w-3 opacity-60" />
                <span className="max-w-[100px] truncate">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[var(--accent-primary)] px-3 py-1 text-xs font-medium text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition shadow-xs"
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
