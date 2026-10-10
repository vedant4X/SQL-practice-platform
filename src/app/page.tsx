import Link from "next/link";
import {
  Database,
  ShieldCheck,
  Award,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  Server,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 py-16 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-5xl text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
            <Cpu className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Dual-Dialect SQL Architecture • Real Execution Engines</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
            Choose Your SQL Track: <br />
            <span className="text-blue-600 dark:text-blue-400">PostgreSQL</span> or{" "}
            <span className="text-teal-600 dark:text-teal-400">MySQL</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Practice against authentic relational database engines. Multi-case automated test judging,
            progressive hints, and production scenario challenges tailored to your dialect.
          </p>

          {/* Dual Dialect Selection Cards */}
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 text-left pt-2">
            {/* PostgreSQL Card */}
            <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 shadow-sm hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all hover:shadow-md">
              <div className="flex items-center justify-between pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                  <Database className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  PostgreSQL 16
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                PostgreSQL Track
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Master Postgres idioms: CTEs, Window Frame specs, <code className="text-blue-600 dark:text-blue-400 font-mono text-xs">FILTER (WHERE ...)</code>,
                <code className="text-blue-600 dark:text-blue-400 font-mono text-xs">DISTINCT ON</code>, JSONB operators, and strict ANSI typing.
              </p>

              <div className="mt-5 flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  51 Topics
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  1,632 Questions
                </span>
              </div>

              <div className="mt-5">
                <Link
                  href="/postgresql/topics"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <span>Practice PostgreSQL</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* MySQL Card */}
            <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 shadow-sm hover:border-teal-500/60 dark:hover:border-teal-500/60 transition-all hover:shadow-md">
              <div className="flex items-center justify-between pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40">
                  <Server className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                  MySQL 8.4 LTS
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                MySQL Track
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Master MySQL idioms: Backtick identifier quoting, <code className="text-teal-600 dark:text-teal-400 font-mono text-xs">GROUP_CONCAT</code>,
                <code className="text-teal-600 dark:text-teal-400 font-mono text-xs">IFNULL</code>, <code className="text-teal-600 dark:text-teal-400 font-mono text-xs">DATE_FORMAT</code>, and
                Full Outer Join emulations.
              </p>

              <div className="mt-5 flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  51 Topics
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  1,632 Questions
                </span>
              </div>

              <div className="mt-5">
                <Link
                  href="/mysql/topics"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
                >
                  <span>Practice MySQL</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="border-b border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 space-y-2.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Genuine SQL Execution</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Queries execute on authentic database engines. Never simulated, mocked, or rewritten behind the scenes.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 space-y-2.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Multi-Dataset Judging</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every problem evaluates against 1 visible sample and 2 hidden alternate datasets with edge cases and NULLs.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 space-y-2.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Award className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Separate Dialect Progress</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Independent XP, topic masteries, streaks, and attempt histories for MySQL and PostgreSQL tracks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
