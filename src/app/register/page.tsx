"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Database, Lock, Mail, User, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        window.location.href = "/dashboard";
      } else {
        setError(data?.error?.message || "Registration failed.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-background-card/60 p-8 shadow-2xl backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <Database className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Your Account</h1>
          <p className="text-xs text-slate-400">
            Start mastering PostgreSQL 16 with zero setup.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Full Name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-lg border border-slate-700 bg-background-dark py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full rounded-lg border border-slate-700 bg-background-dark py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-slate-700 bg-background-dark py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-hover disabled:opacity-50 transition"
          >
            <span>{loading ? "Registering..." : "Start Learning Free"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary-light hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
