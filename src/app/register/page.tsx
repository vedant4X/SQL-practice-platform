"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Database, Lock, Mail, User, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (data?.success) {
        // Merge guest progress if stored locally
        try {
          const guestSolvedRaw = localStorage.getItem("quro_guest_solved") || localStorage.getItem("sqljudge_guest_solved");
          if (guestSolvedRaw) {
            const guestSolved = JSON.parse(guestSolvedRaw);
            if (Array.isArray(guestSolved) && guestSolved.length > 0) {
              await fetch("/api/v1/user/merge-guest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ solvedQuestionIds: guestSolved }),
              });
              localStorage.removeItem("quro_guest_solved");
              localStorage.removeItem("sqljudge_guest_solved");
            }
          }
        } catch {
          // Ignore guest merge errors
        }

        window.location.href = "/dashboard";
      } else {
        setError(data?.error?.message || "Registration failed.");
      }
    } catch {
      setError("Network connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12 bg-[var(--bg-base)] transition-colors">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-8 shadow-card backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-sm">
            <Database className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">Create Your Account</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Start mastering MySQL 8.4 & PostgreSQL 16 with authentic engines.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-[var(--accent-danger)] bg-[var(--accent-danger-bg)] p-3 text-xs text-[var(--accent-danger-text)] font-medium"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--accent-danger)]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reg-name" className="block text-xs font-semibold text-[var(--text-main)]">
              Full Name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                style={{
                  color: "var(--text-main)",
                  backgroundColor: "var(--bg-panel)",
                  caretColor: "var(--text-main)",
                  WebkitTextFillColor: "var(--text-main)",
                }}
                className="w-full rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] py-2.5 pl-10 pr-3 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)] focus:ring-offset-1 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="block text-xs font-semibold text-[var(--text-main)]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                style={{
                  color: "var(--text-main)",
                  backgroundColor: "var(--bg-panel)",
                  caretColor: "var(--text-main)",
                  WebkitTextFillColor: "var(--text-main)",
                }}
                className="w-full rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] py-2.5 pl-10 pr-3 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)] focus:ring-offset-1 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-password" className="block text-xs font-semibold text-[var(--text-main)]">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
              <input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={{
                  color: "var(--text-main)",
                  backgroundColor: "var(--bg-panel)",
                  caretColor: "var(--text-main)",
                  WebkitTextFillColor: "var(--text-main)",
                }}
                className="w-full rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] py-2.5 pl-10 pr-10 text-xs text-[var(--text-main)] placeholder-[var(--text-faint)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)] focus:ring-offset-1 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-2.5 top-2.5 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)] transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] py-2.5 text-xs font-bold text-[var(--accent-primary-text)] shadow-sm hover:bg-[var(--accent-primary-hover)] active:opacity-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--border-control)] focus:ring-offset-2 transition"
          >
            <span>{loading ? "Registering..." : "Start Learning Free"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent-primary)] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
