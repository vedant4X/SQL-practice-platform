/**
 * WCAG 2.1 Contrast Ratio Verification Script
 * Computes exact relative luminance and contrast ratios for Quiet Grove Light and Dark palettes.
 */

function srgbToLinear(val: number): number {
  const c = val / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastCheck {
  theme: "Dark" | "Light";
  foregroundName: string;
  foreground: string;
  backgroundName: string;
  background: string;
  ratio: number;
  minRequired: number;
  passes: boolean;
  type: "text" | "control";
}

const checks: Omit<ContrastCheck, "ratio" | "passes">[] = [
  // --- Dark Mode (Quiet Grove) ---
  // Backgrounds: #202B27 (app), #273630 (panel/editor), #2E3D35 (card/surface)
  { theme: "Dark", foregroundName: "Primary Text (#DDE8DE)", foreground: "#DDE8DE", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Primary Text (#DDE8DE)", foreground: "#DDE8DE", backgroundName: "App BG (#202B27)", background: "#202B27", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Primary Text (#DDE8DE)", foreground: "#DDE8DE", backgroundName: "Card (#2E3D35)", background: "#2E3D35", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Secondary Text (#A8C7B1)", foreground: "#A8C7B1", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Muted Text (#9BB1A1)", foreground: "#9BB1A1", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Placeholder Text (#93A89A)", foreground: "#93A89A", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Control Border (#6F8777)", foreground: "#6F8777", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 3.0, type: "control" },
  { theme: "Dark", foregroundName: "Success Accent (#8FD0A0)", foreground: "#8FD0A0", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Warning Accent (#E5B782)", foreground: "#E5B782", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Error Accent (#F0958D)", foreground: "#F0958D", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 4.5, type: "text" },
  { theme: "Dark", foregroundName: "Info Accent (#91BDE0)", foreground: "#91BDE0", backgroundName: "Panel (#273630)", background: "#273630", minRequired: 4.5, type: "text" },

  // --- Light Mode (Ivory-Green Counterpart) ---
  // Backgrounds: #F4F7F4 (app), #FFFFFF (panel/input), #EBF1EB (card/surface)
  { theme: "Light", foregroundName: "Primary Text (#1B2620)", foreground: "#1B2620", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Primary Text (#1B2620)", foreground: "#1B2620", backgroundName: "App BG (#F4F7F4)", background: "#F4F7F4", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Primary Text (#1B2620)", foreground: "#1B2620", backgroundName: "Card (#EBF1EB)", background: "#EBF1EB", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Secondary Text (#2D4036)", foreground: "#2D4036", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Muted Text (#4E6556)", foreground: "#4E6556", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Placeholder Text (#5F7868)", foreground: "#5F7868", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Control Border (#76927F)", foreground: "#76927F", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 3.0, type: "control" },
  { theme: "Light", foregroundName: "Success Accent (#1B6E32)", foreground: "#1B6E32", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Warning Accent (#8C530A)", foreground: "#8C530A", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Error Accent (#B3261E)", foreground: "#B3261E", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 4.5, type: "text" },
  { theme: "Light", foregroundName: "Info Accent (#155A8A)", foreground: "#155A8A", backgroundName: "Panel (#FFFFFF)", background: "#FFFFFF", minRequired: 4.5, type: "text" },
];

console.log("\n=======================================================");
console.log("   WCAG 2.1 AA / AAA CONTRAST RATIO VERIFICATION");
console.log("=======================================================\n");

let allPassed = true;
const results: ContrastCheck[] = checks.map((c) => {
  const ratio = parseFloat(getContrastRatio(c.foreground, c.background).toFixed(2));
  const passes = ratio >= c.minRequired;
  if (!passes) allPassed = false;
  return {
    ...c,
    ratio,
    passes,
  };
});

console.table(
  results.map((r) => ({
    Theme: r.theme,
    Foreground: r.foregroundName,
    Background: r.backgroundName,
    "Ratio (:1)": r.ratio,
    "Min Required": `${r.minRequired}:1`,
    Status: r.passes ? "PASS (WCAG AA)" : "FAIL",
  }))
);

if (allPassed) {
  console.log("SUCCESS: All tokens pass WCAG 2.1 AA requirements (4.5:1 text, 3:1 controls)!\n");
  process.exit(0);
} else {
  console.error("FAILURE: Some tokens do not meet WCAG contrast requirements.\n");
  process.exit(1);
}
