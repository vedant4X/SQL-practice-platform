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
          DEFAULT: "var(--bg-base)",
          panel: "var(--bg-panel)",
          surface: "var(--bg-surface)",
          border: "var(--border-color)",
          darker: "#0a0a12",
          card: "#12121f",
        },
        cyber: {
          void: "#0a0a12",
          surface: "#12121f",
          lime: "#39ff14",
          yellow: "#fcee0a",
          magenta: "#ff007f",
          cyan: "#00f0ff",
        },
        neo: {
          parchment: "#fbf9f5",
          parchmentDark: "#f4f0ea",
          cobalt: "#0022ff",
          orange: "#ff4d00",
          uv: "#7928ca",
          black: "#000000",
        },
        primary: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-primary-hover)",
          light: "var(--accent-primary-light)",
        },
      },
      boxShadow: {
        "brutal-black": "4px 4px 0px #000000",
        "brutal-black-sm": "2px 2px 0px #000000",
        "brutal-cobalt": "4px 4px 0px #0022ff",
        "brutal-orange": "4px 4px 0px #ff4d00",
        "neon-cyan": "0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.2)",
        "neon-magenta": "0 0 15px rgba(255, 0, 127, 0.5), 0 0 30px rgba(255, 0, 127, 0.2)",
        "neon-lime": "0 0 15px rgba(57, 255, 20, 0.5), 0 0 30px rgba(57, 255, 20, 0.2)",
        "neon-yellow": "0 0 15px rgba(252, 238, 10, 0.5), 0 0 30px rgba(252, 238, 10, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
