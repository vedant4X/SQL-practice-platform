"use client";

import React from "react";
import { useTheme } from "@/lib/theme/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle Cyberpunk Dark / Neo-Brutalist Light theme"
      className={`group relative flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 active:translate-x-0.5 active:translate-y-0.5 ${
        isDark
          ? "border-cyber-cyan bg-cyber-void text-cyber-cyan shadow-neon-cyan hover:bg-cyber-surface hover:text-white"
          : "border-black bg-neo-parchment text-black shadow-brutal-black hover:bg-neo-parchmentDark hover:text-neo-cobalt"
      } ${className}`}
    >
      {/* Animated Rotating Glyph Container */}
      <div className="relative h-4 w-4 overflow-hidden">
        {/* Sun Glyph */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute inset-0 h-4 w-4 transform transition-all duration-500 ease-out ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 text-neo-orange"
          }`}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>

        {/* Moon Glyph */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute inset-0 h-4 w-4 transform transition-all duration-500 ease-out ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-cyber-yellow"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          <circle cx="19" cy="5" r="1" fill="#fcee0a" stroke="none" />
          <circle cx="17" cy="9" r="0.75" fill="#39ff14" stroke="none" />
        </svg>
      </div>

      {showLabel && (
        <span className="font-extrabold tracking-widest text-[11px]">
          {isDark ? "DARK VOID" : "ACID POP"}
        </span>
      )}

      {/* Subtle indicator dot */}
      <span
        className={`h-2 w-2 rounded-full transition-all duration-300 ${
          isDark
            ? "bg-cyber-lime shadow-[0_0_8px_#39ff14] animate-pulse"
            : "bg-neo-cobalt shadow-[0_0_6px_#0022ff]"
        }`}
      />
    </button>
  );
}
