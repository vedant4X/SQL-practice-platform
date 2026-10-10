"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`group flex items-center gap-1.5 rounded-md border border-[var(--border-control)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--border-control)] glass-interactive ${className}`}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-[var(--accent-warning)] transition-transform duration-200 group-hover:rotate-45" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-[var(--accent-primary)] transition-transform duration-200 group-hover:-rotate-12" />
      )}
      {showLabel && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
