"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Database, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (data?.success) {
        // Merge guest progress if stored locally
        try {
          const guestSolvedRaw =
            localStorage.getItem("quro_guest_solved") ||
            localStorage.getItem("sqljudge_guest_solved");
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
          // Continue to dashboard even if guest merge fails
        }

        window.location.href = "/dashboard";
      } else {
        if (data?.error?.code === "ACCOUNT_UNVERIFIED" && data?.error?.details?.email) {
          setUnverifiedEmail(data.error.details.email);
        }
        setError(data?.error?.message || "Invalid credentials.");
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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">Welcome Back</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Sign in to continue your SQL mastery journey.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg border border-[var(--accent-danger)] bg-[var(--accent-danger-bg)] p-3 text-xs text-[var(--accent-danger-text)] font-medium"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--accent-danger)]" />
              <span>{error}</span>
            </div>
            {unverifiedEmail && (
              <div className="mt-1 pl-6">
                <Link
                  href={`/register?email=${encodeURIComponent(unverifiedEmail)}&step=otp`}
                  className="underline font-semibold hover:opacity-80"
                >
                  Click here to complete your email verification
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-identifier" className="block text-xs font-semibold text-[var(--text-main)]">
              Username or Email
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                autoComplete="username email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="username or name@example.com"
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
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-semibold text-[var(--text-main)]">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] py-2.5 text-xs font-semibold text-[var(--accent-primary-text)] shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--border-control)] focus:ring-offset-2 disabled:opacity-50 transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing in...
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-[var(--border-subtle)] pt-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--accent-primary)] hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--border-control)] rounded"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
