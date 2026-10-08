import Link from "next/link";
import {
  Database,
  ShieldCheck,
  Terminal,
  Award,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  Server,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-background-border bg-gradient-to-b from-background to-background-darker py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-background-card px-3.5 py-1 text-xs font-semibold text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-primary" />
            <span>Dual-Dialect SQL Architecture • Real Execution Engines</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Choose Your SQL Track: <br />
            <span className="text-sky-400">PostgreSQL</span> or{" "}
            <span className="text-teal-400">MySQL</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300">
            Practice against authentic relational database engines. Multi-case automated test judging,
            progressive hints, and production scenario challenges tailored to your dialect.
          </p>

          {/* Dual Dialect Selection Cards */}
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 text-left pt-4">
            {/* PostgreSQL Card */}
            <div className="group relative rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/20 to-background-card p-6 shadow-xl transition hover:border-sky-500 hover:shadow-sky-500/10">
              <div className="flex items-center justify-between pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Database className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-300">
                  PostgreSQL 16
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white group-hover:text-sky-300 transition">
                PostgreSQL Track
              </h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Master Postgres idioms: CTEs, Window Frame specs, <code className="text-sky-300">FILTER (WHERE ...)</code>,
                <code className="text-sky-300">DISTINCT ON</code>, JSONB operators, and strict ANSI typing.
              </p>

              <div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-sky-400" />
                  51 Topics
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  1,632 Practice Questions
                </span>
              </div>

              <div className="mt-6">
                <Link
                  href="/postgresql/topics"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-sky-500"
                >
                  <span>Practice PostgreSQL</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* MySQL Card */}
            <div className="group relative rounded-2xl border border-teal-500/30 bg-gradient-to-b from-teal-950/20 to-background-card p-6 shadow-xl transition hover:border-teal-500 hover:shadow-teal-500/10">
              <div className="flex items-center justify-between pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Server className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-300">
                  MySQL 8.4 LTS
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white group-hover:text-teal-300 transition">
                MySQL Track
              </h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Master MySQL idioms: Backtick identifier quoting, <code className="text-teal-300">GROUP_CONCAT</code>,
                <code className="text-teal-300">IFNULL</code>, <code className="text-teal-300">DATE_FORMAT</code>, and
                Full Outer Join emulations.
              </p>

              <div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-teal-400" />
                  51 Topics
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                  1,632 Practice Questions
                </span>
              </div>

              <div className="mt-6">
                <Link
                  href="/mysql/topics"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-500"
                >
                  <span>Practice MySQL</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="border-b border-background-border py-16 px-4 sm:px-6 bg-background-darker/60">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-slate-800 bg-background-card/50 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Genuine SQL Execution</h3>
              <p className="text-sm text-slate-400">
                Queries execute on authentic database engines. Never simulated, mocked, or rewritten into
                another dialect behind the scenes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-background-card/50 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Dataset Judging</h3>
              <p className="text-sm text-slate-400">
                Every problem evaluates against 1 visible sample and 2 hidden alternate datasets with
                ties, NULLs, and boundary conditions to prevent hardcoded answers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-background-card/50 p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Separate Dialect Progress</h3>
              <p className="text-sm text-slate-400">
                Independent XP, topic masteries, streaks, and attempt histories for MySQL and PostgreSQL.
                Zero accidental mixing of dialect syntaxes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
