"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  User as UserIcon,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  RefreshCw,
  Trash2,
  Lock,
  Mail,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  Layers,
} from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";

interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  passwordPlain: string | null;
  passwordHash: string;
  totalXp: number;
  solvedCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const { theme } = useTheme();

  // Auth & Session
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Login form state (if not admin)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Users data
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  // Visibility state for passwords & hashes (key: userId)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [revealedHashes, setRevealedHashes] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<AdminUserRecord | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordActionFeedback, setPasswordActionFeedback] = useState<string | null>(null);

  // Load session
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    setLoadingSession(true);
    try {
      const res = await fetch("/api/v1/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.data?.user) {
          setCurrentUser(data.data.user);
          if (data.data.user.role === "admin") {
            loadUsers();
          }
        }
      }
    } catch {
      // Unauthenticated
    } finally {
      setLoadingSession(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/v1/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.data?.users) {
          setUsers(data.data.users);
        }
      }
    } catch (err) {
      console.error("Failed to load admin users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Quick fill helper
  const handleQuickFillAdmin = () => {
    setLoginEmail("admin@sqljudge.com");
    setLoginPassword("admin123");
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (data?.success) {
        if (data.data.user.role !== "admin") {
          setLoginError("Signed in successfully, but this account does not have administrator privileges.");
          setCurrentUser(data.data.user);
        } else {
          setCurrentUser(data.data.user);
          await loadUsers();
        }
      } else {
        setLoginError(data?.error?.message || "Invalid credentials.");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleHashReveal = (userId: string) => {
    setRevealedHashes((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenResetModal = (user: AdminUserRecord) => {
    setResetModalUser(user);
    setNewPasswordInput("");
    setPasswordActionFeedback(null);
  };

  const handleSavePassword = async () => {
    if (!resetModalUser || !newPasswordInput.trim()) return;
    setIsSavingPassword(true);
    setPasswordActionFeedback(null);

    try {
      const res = await fetch("/api/v1/admin/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetModalUser.id, newPassword: newPasswordInput.trim() }),
      });
      const data = await res.json();

      if (data?.success) {
        setPasswordActionFeedback("Password updated successfully!");
        // Update user in local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === resetModalUser.id ? { ...u, passwordPlain: newPasswordInput.trim() } : u
          )
        );
        setTimeout(() => {
          setResetModalUser(null);
          setPasswordActionFeedback(null);
        }, 1200);
      } else {
        setPasswordActionFeedback(data?.error?.message || "Failed to update password");
      }
    } catch {
      setPasswordActionFeedback("Network error. Could not save password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: "user" | "admin") => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    if (userId === currentUser?.id && nextRole === "user") {
      alert("You cannot revoke your own administrator status.");
      return;
    }

    try {
      const res = await fetch("/api/v1/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own administrator account.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate platform metrics
  const totalAdminCount = users.filter((u) => u.role === "admin").length;
  const totalPlatformXp = users.reduce((acc, u) => acc + (u.totalXp || 0), 0);
  const totalSolvedCount = users.reduce((acc, u) => acc + (u.solvedCount || 0), 0);

  // If loading session
  if (loadingSession) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[var(--bg-base)] text-[var(--text-muted)]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-[var(--accent-primary)]" />
          <p className="text-sm font-medium">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not admin -> Show Admin Login
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12 bg-[var(--bg-base)] transition-colors">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-8 shadow-card backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-warning)] text-white shadow-xs">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
              Admin Portal
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Restricted management console. Sign in with administrator credentials.
            </p>
          </div>

          {/* Quick Fill Box */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text-main)]">Default System Admin:</span>
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="rounded bg-[var(--accent-primary)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition"
              >
                Auto-Fill
              </button>
            </div>
            <div className="font-mono text-[11px] text-[var(--text-secondary)] space-y-0.5">
              <div>Email: <span className="font-semibold text-[var(--text-main)]">admin@sqljudge.com</span></div>
              <div>Password: <span className="font-semibold text-[var(--text-main)]">admin123</span></div>
            </div>
          </div>

          {loginError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-[var(--accent-danger)] bg-[var(--accent-danger-bg)] p-3 text-xs text-[var(--accent-danger-text)] font-medium"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--accent-danger)]" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-semibold text-[var(--text-main)]">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@sqljudge.com"
                  className="w-full rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] py-2 pl-9 pr-3 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-pass" className="block text-xs font-semibold text-[var(--text-main)]">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  id="admin-pass"
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] py-2 pl-9 pr-9 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] py-2.5 text-xs font-semibold text-[var(--accent-primary-text)] shadow-xs hover:bg-[var(--accent-primary-hover)] transition disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Authenticate as Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text-main)] transition underline">
              Return to Practice Curriculum
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="mx-auto max-w-7xl w-full flex-1 space-y-8 px-4 py-8 sm:px-6 bg-[var(--bg-base)] text-[var(--text-main)] transition-colors min-h-[calc(100vh-3.5rem)]">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] text-[var(--accent-warning-text)] shadow-xs">
            <Shield className="h-6 w-6 text-[var(--accent-warning)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
                Admin Control Console
              </h1>
              <span className="rounded bg-[var(--accent-warning-bg)] border border-[var(--accent-warning-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-warning-text)]">
                SUPERADMIN
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              View registered users, inspect credentials, reset passwords, and manage platform roles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
            <span>Signed in as: </span>
            <span className="font-semibold text-[var(--text-main)]">{currentUser.name}</span>
          </div>
          <button
            onClick={loadUsers}
            disabled={isLoadingUsers}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs disabled:opacity-50"
            title="Refresh user data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Total Accounts</span>
            <UserIcon className="h-4 w-4 text-[var(--accent-primary)]" />
          </div>
          <p className="text-2xl font-extrabold text-[var(--text-main)]">{users.length}</p>
          <span className="text-[11px] text-[var(--text-secondary)]">Active registered users</span>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Admin Users</span>
            <Shield className="h-4 w-4 text-[var(--accent-warning)]" />
          </div>
          <p className="text-2xl font-extrabold text-[var(--accent-warning)]">{totalAdminCount}</p>
          <span className="text-[11px] text-[var(--text-secondary)]">Privileged administrator roles</span>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Platform XP</span>
            <Zap className="h-4 w-4 text-[var(--accent-warning)] fill-current" />
          </div>
          <p className="text-2xl font-extrabold text-[var(--text-main)]">{totalPlatformXp} XP</p>
          <span className="text-[11px] text-[var(--text-secondary)]">Total XP earned by all users</span>
        </div>

        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Solves Recorded</span>
            <Award className="h-4 w-4 text-[var(--accent-success)]" />
          </div>
          <p className="text-2xl font-extrabold text-[var(--text-main)]">{totalSolvedCount}</p>
          <span className="text-[11px] text-[var(--text-secondary)]">Across PostgreSQL & MySQL</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] py-2 pl-9 pr-3 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] p-1 text-xs">
          <button
            onClick={() => setRoleFilter("all")}
            className={`rounded px-2.5 py-1 font-medium transition ${
              roleFilter === "all"
                ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`rounded px-2.5 py-1 font-medium transition ${
              roleFilter === "admin"
                ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            }`}
          >
            Admins ({totalAdminCount})
          </button>
          <button
            onClick={() => setRoleFilter("user")}
            className={`rounded px-2.5 py-1 font-medium transition ${
              roleFilter === "user"
                ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            }`}
          >
            Standard ({users.length - totalAdminCount})
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold">
            <tr>
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Name & Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Password Credentials</th>
              <th className="py-3 px-4 text-center">Progress</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[var(--text-muted)] italic">
                  No user accounts match the current query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isPwRevealed = !!revealedPasswords[user.id];
                const isHashRevealed = !!revealedHashes[user.id];

                return (
                  <tr key={user.id} className="hover:bg-[var(--bg-surface)]/50 transition">
                    {/* User ID */}
                    <td className="py-3 px-4 font-mono font-medium text-[var(--text-secondary)] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]" title={user.id}>
                          {user.id}
                        </span>
                        <button
                          onClick={() => handleCopy(user.id, `id-${user.id}`)}
                          className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                          title="Copy ID"
                        >
                          {copiedKey === `id-${user.id}` ? (
                            <Check className="h-3 w-3 text-[var(--accent-success)]" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Name & Email */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-main)]">{user.name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <span>{user.email}</span>
                        <button
                          onClick={() => handleCopy(user.email, `email-${user.id}`)}
                          className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                          title="Copy Email"
                        >
                          {copiedKey === `email-${user.id}` ? (
                            <Check className="h-2.5 w-2.5 text-[var(--accent-success)]" />
                          ) : (
                            <Copy className="h-2.5 w-2.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleRole(user.id, user.role)}
                        title="Click to toggle role between User and Admin"
                        className={`rounded px-2 py-0.5 text-[10px] font-bold transition border ${
                          user.role === "admin"
                            ? "bg-[var(--accent-warning-bg)] border-[var(--accent-warning-border)] text-[var(--accent-warning-text)] hover:opacity-80"
                            : "bg-[var(--accent-success-bg)] border-[var(--accent-success-border)] text-[var(--accent-success-text)] hover:opacity-80"
                        }`}
                      >
                        {user.role.toUpperCase()}
                      </button>
                    </td>

                    {/* Password Credentials */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {user.passwordPlain ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)]">
                              {isPwRevealed ? user.passwordPlain : "••••••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordReveal(user.id)}
                              className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                              title={isPwRevealed ? "Hide password" : "Show password"}
                            >
                              {isPwRevealed ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(user.passwordPlain!, `pw-${user.id}`)}
                              className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                              title="Copy password"
                            >
                              {copiedKey === `pw-${user.id}` ? (
                                <Check className="h-3.5 w-3.5 text-[var(--accent-success)]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[var(--text-muted)] italic">
                              Hashed only
                            </span>
                            <button
                              onClick={() => handleOpenResetModal(user)}
                              className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline"
                            >
                              Set Password
                            </button>
                          </div>
                        )}

                        {/* Collapsible Scrypt Hash */}
                        <div>
                          <button
                            onClick={() => toggleHashReveal(user.id)}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline decoration-dotted"
                          >
                            {isHashRevealed ? "Hide Scrypt Hash" : "Inspect Hash"}
                          </button>
                          {isHashRevealed && (
                            <div className="mt-1 flex items-center gap-1.5 rounded bg-[var(--bg-base)] p-1.5 font-mono text-[10px] text-[var(--text-muted)] border border-[var(--border-color)] max-w-xs break-all">
                              <span className="truncate">{user.passwordHash}</span>
                              <button
                                onClick={() => handleCopy(user.passwordHash, `hash-${user.id}`)}
                                className="shrink-0 rounded p-0.5 hover:text-[var(--text-main)]"
                                title="Copy full hash"
                              >
                                {copiedKey === `hash-${user.id}` ? (
                                  <Check className="h-3 w-3 text-[var(--accent-success)]" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="font-semibold text-[var(--text-main)]">
                        {user.solvedCount} Solved
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">{user.totalXp} XP</div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenResetModal(user)}
                          className="rounded border border-[var(--border-control)] bg-[var(--bg-panel)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition shadow-xs"
                          title="Change or reset password"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={user.id === currentUser?.id}
                          className="rounded border border-[var(--border-control)] p-1 text-[var(--text-muted)] hover:text-[var(--accent-danger)] hover:border-[var(--accent-danger)] disabled:opacity-30 disabled:pointer-events-none transition"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Set User Password
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Updating credentials for <span className="font-semibold">{resetModalUser.name}</span> ({resetModalUser.email})
                </p>
              </div>
            </div>

            {passwordActionFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  passwordActionFeedback.includes("successfully")
                    ? "bg-[var(--accent-success-bg)] text-[var(--accent-success-text)] border border-[var(--accent-success-border)]"
                    : "bg-[var(--accent-danger-bg)] text-[var(--accent-danger-text)] border border-[var(--accent-danger-border)]"
                }`}
              >
                {passwordActionFeedback}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-main)]">
                New Plaintext Password
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Enter new password (min 6 characters)"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] p-2 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)]"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                This password will be hashed with scrypt for login, and saved in plaintext so you can view it in the admin table.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                disabled={isSavingPassword}
                className="rounded-lg border border-[var(--border-control)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={isSavingPassword || !newPasswordInput.trim()}
                className="rounded-lg bg-[var(--accent-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] transition disabled:opacity-50"
              >
                {isSavingPassword ? "Saving..." : "Save Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
