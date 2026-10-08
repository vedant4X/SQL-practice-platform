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
  Layers,
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

  // Determine current active dialect from path or cookie
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

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b-2 transition-colors duration-200 backdrop-blur-md ${
        isDark
          ? "border-cyber-cyan/30 bg-cyber-void/85 text-white"
          : "border-black bg-neo-parchment/95 text-black shadow-sm"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          {/* Logo with pulsing query lightning icon */}
          <Link href="/" className="flex items-center gap-2 group transition">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                isDark
                  ? "border-cyber-lime bg-cyber-void text-cyber-lime shadow-[0_0_12px_#39ff14] group-hover:scale-105"
                  : "border-black bg-neo-cobalt text-white shadow-brutal-black-sm group-hover:translate-x-0.5"
              }`}
            >
              <Zap className="h-4 w-4 fill-current animate-pulse" />
            </div>
            <span className="text-lg tracking-tight font-mono font-black">
              SQL<span className={isDark ? "text-cyber-cyan" : "text-neo-cobalt"}>JUDGE</span>
            </span>
          </Link>

          {/* Dialect Switcher & Engine Badge */}
          <div className="relative">
            <button
              onClick={() => setDialectDropdownOpen(!dialectDropdownOpen)}
              className={`flex items-center gap-2 rounded-md border-2 px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase transition active:scale-95 ${
                isDark
                  ? isPostgres
                    ? "border-cyber-cyan bg-cyber-cyan/15 text-cyber-cyan shadow-neon-cyan"
                    : "border-cyber-magenta bg-cyber-magenta/15 text-cyber-magenta shadow-neon-magenta"
                  : isPostgres
                  ? "border-black bg-neo-cobalt text-white shadow-brutal-black-sm"
                  : "border-black bg-neo-orange text-white shadow-brutal-black-sm"
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>{isPostgres ? "PostgreSQL 16" : "MySQL 8.4"}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {dialectDropdownOpen && (
              <div
                className={`absolute left-0 top-full mt-2 w-52 rounded-lg border-2 p-1.5 shadow-2xl z-50 font-mono text-xs ${
                  isDark
                    ? "border-cyber-cyan bg-cyber-void text-white shadow-neon-cyan"
                    : "border-black bg-white text-black shadow-brutal-black"
                }`}
              >
                <button
                  onClick={() => handleSwitchDialect("postgresql")}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 transition font-bold ${
                    isPostgres
                      ? isDark
                        ? "bg-cyber-cyan/20 text-cyber-cyan"
                        : "bg-neo-cobalt text-white"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyber-cyan shadow-[0_0_6px_#00f0ff]" />
                    <span>PostgreSQL 16</span>
                  </div>
                  {isPostgres && <span className="text-[10px] text-cyber-lime font-mono">ACTIVE</span>}
                </button>
                <button
                  onClick={() => handleSwitchDialect("mysql")}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 transition font-bold mt-1 ${
                    !isPostgres
                      ? isDark
                        ? "bg-cyber-magenta/20 text-cyber-magenta"
                        : "bg-neo-orange text-white"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyber-magenta shadow-[0_0_6px_#ff007f]" />
                    <span>MySQL 8.4</span>
                  </div>
                  {!isPostgres && <span className="text-[10px] text-cyber-lime font-mono">ACTIVE</span>}
                </button>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-6 font-mono text-xs font-bold tracking-wider uppercase">
            <Link
              href={`/${activeDialect}/topics`}
              className="flex items-center gap-1.5 transition hover:text-cyber-lime"
            >
              <BookOpen className="h-3.5 w-3.5 opacity-70" />
              Curriculum
            </Link>
            <Link
              href={`/${activeDialect}/playground`}
              className={`flex items-center gap-1.5 transition ${
                pathname.includes("/playground")
                  ? isDark
                    ? "text-cyber-cyan font-black"
                    : "text-neo-cobalt font-black"
                  : "hover:text-cyber-cyan"
              }`}
            >
              <Terminal className="h-3.5 w-3.5 text-cyber-lime" />
              Playground
            </Link>
            <Link
              href={`/${activeDialect}/dashboard`}
              className="flex items-center gap-1.5 transition hover:text-cyber-yellow"
            >
              <BarChart2 className="h-3.5 w-3.5 opacity-70" />
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Theme Toggle */}
          <ThemeToggle showLabel={false} />

          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-slate-800" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-mono font-bold ${
                  isDark
                    ? "border-cyber-yellow/40 bg-cyber-yellow/15 text-cyber-yellow shadow-neon-yellow"
                    : "border-black bg-neo-parchmentDark text-black shadow-brutal-black-sm"
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-cyber-yellow fill-current" />
                <span>{user.totalXp || 0} XP</span>
              </div>
              <Link
                href="/profile"
                className={`flex items-center gap-1.5 rounded-md border-2 px-3 py-1 text-xs font-mono font-bold transition ${
                  isDark
                    ? "border-cyber-cyan/30 bg-cyber-surface hover:border-cyber-cyan"
                    : "border-black bg-white shadow-brutal-black-sm hover:translate-x-0.5"
                }`}
              >
                <UserIcon className="h-3.5 w-3.5 opacity-70" />
                <span className="max-w-[100px] truncate">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg p-1.5 opacity-70 transition hover:opacity-100 hover:text-red-500"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`rounded-md px-3 py-1 text-xs font-mono font-bold uppercase transition ${
                  isDark ? "text-gray-300 hover:text-white" : "text-black hover:opacity-80"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={`rounded-md border-2 px-3.5 py-1 text-xs font-mono font-black uppercase tracking-wider transition ${
                  isDark
                    ? "border-cyber-lime bg-cyber-lime text-black shadow-neon-lime hover:bg-cyber-primary-light"
                    : "border-black bg-neo-orange text-white shadow-brutal-black hover:bg-orange-600"
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
