"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read current applied theme from DOM or localStorage
    try {
      const stored = (localStorage.getItem("quro_theme") || localStorage.getItem("sqljudge_theme")) as ThemeMode | null;
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        const isLight = document.documentElement.classList.contains("light");
        const initialTheme: ThemeMode = isLight ? "light" : "dark";
        setThemeState(initialTheme);
        applyTheme(initialTheme);
      }
    } catch {
      // Fallback to dark
      applyTheme("dark");
    }
    setMounted(true);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(mode);
    try {
      localStorage.setItem("quro_theme", mode);
      localStorage.setItem("sqljudge_theme", mode);
    } catch {
      // Ignore storage errors in sandboxes
    }
    window.dispatchEvent(new CustomEvent("quro-theme-change", { detail: { theme: mode } }));
    window.dispatchEvent(new CustomEvent("sqljudge-theme-change", { detail: { theme: mode } }));
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
