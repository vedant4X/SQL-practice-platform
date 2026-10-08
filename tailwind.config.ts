import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0f172a", // Dark charcoal slate
          darker: "#0a0f1d",
          card: "#1e293b",
          border: "#334155",
        },
        primary: {
          DEFAULT: "#3b82f6", // Vibrant blue
          hover: "#2563eb",
          light: "#60a5fa",
        },
        success: {
          DEFAULT: "#10b981", // Emerald green
          light: "#34d399",
        },
        warning: {
          DEFAULT: "#f59e0b", // Amber
          light: "#fbbf24",
        },
        danger: {
          DEFAULT: "#ef4444", // Crimson red
          light: "#f87171",
        },
        editor: {
          bg: "#0d1117",
          line: "#161b22",
        }
      },
    },
  },
  plugins: [],
};
export default config;
