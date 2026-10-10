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
    <div className="flex flex-col flex-1 bg-[var(--bg-base)] text-[var(--text-main)] transition-colors min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border-color)] py-16 px-4 sm:px-6 bg-[var(--bg-surface)]/40">
        <div className="mx-auto max-w-5xl text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] shadow-xs">
            <Cpu className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            <span>Dual-Dialect SQL Architecture • Real Execution Engines</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[var(--text-main)]">
            Choose Your SQL Track: <br />
            <span className="text-[var(--accent-warning)]">MySQL</span> or{" "}
            <span className="text-[var(--accent-primary)]">PostgreSQL</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            Practice against authentic relational database engines. Multi-case automated test judging,
            progressive hints, and production scenario challenges tailored to your dialect.
          </p>

          {/* Dual Dialect Selection Cards */}
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 text-left pt-2">
            {/* MySQL Card (First Priority) */}
            <div className="group rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-xs hover:border-[var(--accent-warning)] transition-all hover:shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-warning-bg)] text-[var(--accent-warning-text)] border border-[var(--accent-warning-border)]">
                    <Server className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-[var(--border-control)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                    MySQL 8.4 LTS
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent-warning-text)] transition">
                    MySQL Track
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Master MySQL idioms: Backtick identifier quoting, <code className="rounded bg-[var(--bg-surface)] px-1 py-0.5 font-mono text-xs text-[var(--text-main)] border border-[var(--border-color)]">GROUP_CONCAT</code>,
                    {" "}<code className="rounded bg-[var(--bg-surface)] px-1 py-0.5 font-mono text-xs text-[var(--text-main)] border border-[var(--border-color)]">IFNULL</code>, <code className="rounded bg-[var(--bg-surface)] px-1 py-0.5 font-mono text-xs text-[var(--text-main)] border border-[var(--border-color)]">DATE_FORMAT</code>, and
                    Full Outer Join emulations.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-color)] space-y-4">
                <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[var(--accent-warning)]" />
                    51 Topics
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent-warning)]" />
                    1,632 Questions
                  </span>
                </div>

                <Link
                  href="/mysql/topics"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-primary-text)] shadow-xs transition hover:bg-[var(--accent-primary-hover)]"
                >
                  <span>Practice MySQL</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* PostgreSQL Card (Second Priority) */}
            <div className="group rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-xs hover:border-[var(--accent-primary)] transition-all hover:shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-success-bg)] text-[var(--accent-success-text)] border border-[var(--accent-success-border)]">
                    <Database className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-[var(--border-control)] bg-[var(--bg-surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                    PostgreSQL 16
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition">
                    PostgreSQL Track
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Master Postgres idioms: CTEs, Window Frame specs, <code className="rounded bg-[var(--bg-surface)] px-1 py-0.5 font-mono text-xs text-[var(--text-main)] border border-[var(--border-color)]">FILTER (WHERE ...)</code>,
                    {" "}<code className="rounded bg-[var(--bg-surface)] px-1 py-0.5 font-mono text-xs text-[var(--text-main)] border border-[var(--border-color)]">DISTINCT ON</code>, JSONB operators, and strict ANSI typing.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-color)] space-y-4">
                <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                    51 Topics
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                    1,632 Questions
                  </span>
                </div>

                <Link
                  href="/postgresql/topics"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-primary-text)] shadow-xs transition hover:bg-[var(--accent-primary-hover)]"
                >
                  <span>Practice PostgreSQL</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="border-b border-[var(--border-color)] py-12 px-4 sm:px-6 bg-[var(--bg-base)]">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 space-y-2.5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-success-bg)] text-[var(--accent-success-text)] border border-[var(--accent-success-border)]">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">Genuine SQL Execution</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Queries execute on authentic database engines. Never simulated, mocked, or rewritten behind the scenes.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 space-y-2.5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-info-bg)] text-[var(--accent-info-text)] border border-[var(--accent-info-border)]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">Multi-Dataset Judging</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Every problem evaluates against 1 visible sample and 2 hidden alternate datasets with edge cases and NULLs.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 space-y-2.5 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-warning-bg)] text-[var(--accent-warning-text)] border border-[var(--accent-warning-border)]">
                <Award className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">Separate Dialect Progress</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Independent XP, topic masteries, streaks, and attempt histories for MySQL and PostgreSQL tracks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
