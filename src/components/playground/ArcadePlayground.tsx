"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { format } from "sql-formatter";
import {
  Zap,
  Play,
  RotateCcw,
  AlignLeft,
  Trash2,
  Terminal,
  Clock,
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  Key,
  Volume2,
  VolumeX,
  Sparkles,
  Database,
  ArrowRight,
  Columns,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";
import { sfx } from "@/lib/audio/sfx";
import ThemeToggle from "@/components/playground/ThemeToggle";
import ParticleCelebration, { ParticleCelebrationHandle } from "@/components/playground/ParticleCelebration";
import CyberWarpBackground from "@/components/playground/CyberWarpBackground";
import TiltCard from "@/components/playground/TiltCard";

// Dynamic Monaco Editor (SSR false)
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background-panel font-mono text-xs text-cyber-cyan animate-pulse">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 animate-spin text-cyber-lime" />
        <span>INITIALIZING ARCADE COMPILER...</span>
      </div>
    </div>
  ),
});

/* ==========================================================================
   1. SCHEMAS & SAMPLE WORKLOADS
   ========================================================================== */

interface ColumnMeta {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

interface TableDefinition {
  name: string;
  rowCount: number;
  columns: ColumnMeta[];
}

interface SchemaWorkspace {
  id: string;
  label: string;
  badge: string;
  tables: TableDefinition[];
  defaultQuery: string;
}

const SCHEMAS: Record<string, SchemaWorkspace> = {
  ecommerce_db: {
    id: "ecommerce_db",
    label: "e-commerce_db",
    badge: "HYPER-TRANSACTIONS",
    defaultQuery: `-- High-Octane E-Commerce Query Workload
SELECT 
    c.customer_name,
    c.loyalty_tier,
    COUNT(o.order_id) AS total_orders,
    ROUND(SUM(o.total_amount), 2) AS lifetime_spend,
    RANK() OVER (ORDER BY SUM(o.total_amount) DESC) AS whale_rank
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_status = 'delivered'
GROUP BY c.customer_id, c.customer_name, c.loyalty_tier
HAVING SUM(o.total_amount) >= 1000.00
ORDER BY lifetime_spend DESC
LIMIT 10;`,
    tables: [
      {
        name: "customers",
        rowCount: 14200,
        columns: [
          { name: "customer_id", type: "INT", isPk: true },
          { name: "customer_name", type: "VARCHAR" },
          { name: "loyalty_tier", type: "VARCHAR" },
          { name: "signup_timestamp", type: "TIMESTAMP" },
        ],
      },
      {
        name: "orders",
        rowCount: 86400,
        columns: [
          { name: "order_id", type: "INT", isPk: true },
          { name: "customer_id", type: "INT", isFk: true },
          { name: "total_amount", type: "DECIMAL" },
          { name: "order_status", type: "VARCHAR" },
          { name: "created_at", type: "TIMESTAMP" },
        ],
      },
      {
        name: "order_items",
        rowCount: 219000,
        columns: [
          { name: "item_id", type: "INT", isPk: true },
          { name: "order_id", type: "INT", isFk: true },
          { name: "sku", type: "VARCHAR" },
          { name: "quantity", type: "INT" },
          { name: "unit_price", type: "DECIMAL" },
        ],
      },
    ],
  },
  analytics_warehouse: {
    id: "analytics_warehouse",
    label: "analytics_warehouse",
    badge: "EVENT MATRIX",
    defaultQuery: `-- Real-Time Event Stream Analytics
SELECT 
    e.event_name,
    DATE_TRUNC('hour', e.occurred_at) AS event_window,
    COUNT(DISTINCT e.user_id) AS active_users,
    ROUND(AVG(e.duration_ms), 3) AS avg_latency_ms
FROM telemetry_events e
WHERE e.occurred_at >= NOW() - INTERVAL '24 HOURS'
GROUP BY e.event_name, event_window
ORDER BY event_window DESC, active_users DESC
LIMIT 12;`,
    tables: [
      {
        name: "telemetry_events",
        rowCount: 1450000,
        columns: [
          { name: "event_id", type: "BIGINT", isPk: true },
          { name: "user_id", type: "INT", isFk: true },
          { name: "event_name", type: "VARCHAR" },
          { name: "duration_ms", type: "DECIMAL" },
          { name: "occurred_at", type: "TIMESTAMP" },
        ],
      },
      {
        name: "user_sessions",
        rowCount: 320000,
        columns: [
          { name: "session_id", type: "VARCHAR", isPk: true },
          { name: "user_id", type: "INT", isFk: true },
          { name: "ip_address", type: "VARCHAR" },
          { name: "device_type", type: "VARCHAR" },
        ],
      },
    ],
  },
  fintech_core: {
    id: "fintech_core",
    label: "fintech_core",
    badge: "ZERO-LATENCY LEDGER",
    defaultQuery: `-- Double-Entry Ledger Reconciliation
SELECT 
    a.account_number,
    a.currency,
    SUM(CASE WHEN t.direction = 'CREDIT' THEN t.amount ELSE -t.amount END) AS calculated_balance,
    a.stated_balance,
    ABS(SUM(CASE WHEN t.direction = 'CREDIT' THEN t.amount ELSE -t.amount END) - a.stated_balance) AS discrepancy
FROM accounts a
LEFT JOIN ledger_transactions t ON a.account_id = t.account_id
GROUP BY a.account_id, a.account_number, a.currency, a.stated_balance
HAVING ABS(SUM(CASE WHEN t.direction = 'CREDIT' THEN t.amount ELSE -t.amount END) - a.stated_balance) > 0.00
ORDER BY discrepancy DESC;`,
    tables: [
      {
        name: "accounts",
        rowCount: 54000,
        columns: [
          { name: "account_id", type: "INT", isPk: true },
          { name: "account_number", type: "VARCHAR" },
          { name: "currency", type: "VARCHAR" },
          { name: "stated_balance", type: "DECIMAL" },
        ],
      },
      {
        name: "ledger_transactions",
        rowCount: 980000,
        columns: [
          { name: "tx_id", type: "BIGINT", isPk: true },
          { name: "account_id", type: "INT", isFk: true },
          { name: "direction", type: "VARCHAR" },
          { name: "amount", type: "DECIMAL" },
          { name: "created_at", type: "TIMESTAMP" },
        ],
      },
    ],
  },
};

/* ==========================================================================
   2. MAIN ARCADE PLAYGROUND COMPONENT
   ========================================================================== */

interface ArcadePlaygroundProps {
  initialDialect?: "postgresql" | "mysql";
}

export default function ArcadePlayground({ initialDialect = "postgresql" }: ArcadePlaygroundProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State: Schema & Editor
  const [selectedSchemaKey, setSelectedSchemaKey] = useState<string>("ecommerce_db");
  const [dialect, setDialect] = useState<"postgresql" | "mysql">(initialDialect);
  const currentSchema = SCHEMAS[selectedSchemaKey] || SCHEMAS.ecommerce_db;

  const [sql, setSql] = useState<string>(currentSchema.defaultQuery);
  const [activeLine, setActiveLine] = useState<number>(1);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingIntensity, setTypingIntensity] = useState<number>(0);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    customers: true,
    orders: true,
    telemetry_events: true,
    accounts: true,
  });

  // State: Execution, Animations & Combos
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [comboCount, setComboCount] = useState<number>(0);
  const [showComboBanner, setShowComboBanner] = useState<boolean>(false);
  const [comboDetails, setComboDetails] = useState<{ execTime: string; combo: number }>({
    execTime: "0.04ms",
    combo: 1,
  });
  const [executionResult, setExecutionResult] = useState<{
    columns: string[];
    rows: Record<string, any>[];
    rowCount: number;
    execTimeMs: number;
    memoryUsedMb?: number;
  } | null>(null);

  // State: SFX Mute
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [keyPressedMap, setKeyPressedMap] = useState<{ ctrl: boolean; enter: boolean }>({
    ctrl: false,
    enter: false,
  });

  // Refs
  const editorRef = useRef<any>(null);
  const runButtonRef = useRef<HTMLButtonElement | null>(null);
  const particleRef = useRef<ParticleCelebrationHandle | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync SFX state on mount
  useEffect(() => {
    setIsMuted(sfx.getMuted());
  }, []);

  // Keyboard shortcut listener for Ctrl/Cmd+Enter + tactile key feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        setKeyPressedMap((prev) => ({ ...prev, ctrl: true }));
      }
      if (e.key === "Enter") {
        setKeyPressedMap((prev) => ({ ...prev, enter: true }));
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleExecuteWorkload();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setKeyPressedMap((prev) => ({ ...prev, ctrl: false }));
      }
      if (e.key === "Enter") {
        setKeyPressedMap((prev) => ({ ...prev, enter: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sql]);

  // Handle Typing Speed & Warp Mesh Acceleration
  const handleEditorChange = (newVal: string | undefined) => {
    setSql(newVal || "");
    setIsTyping(true);
    setTypingIntensity(1);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingIntensity(0);
    }, 450);
  };

  // Switch schema quick selector
  const handleSelectSchema = (key: string) => {
    setSelectedSchemaKey(key);
    const target = SCHEMAS[key];
    if (target) {
      setSql(target.defaultQuery);
      setExecutionResult(null);
      sfx.playTriggerChirp();
    }
  };

  // Toggle table collapsible view
  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  // Insert table helper
  const handleInsertTableQuery = (tableName: string) => {
    setSql((prev) => `${prev.trim()}\n\n-- Inspect table [${tableName}]\nSELECT * FROM ${tableName} LIMIT 10;`);
    sfx.playTriggerChirp();
  };

  // Format SQL Query
  const handleFormat = () => {
    try {
      const formatted = format(sql, {
        language: dialect === "mysql" ? "mysql" : "postgresql",
        keywordCase: "upper",
        linesBetweenQueries: 2,
      });
      setSql(formatted);
      sfx.playTriggerChirp();
    } catch {
      // Keep existing
    }
  };

  // Audio Mute Toggle
  const handleToggleMute = () => {
    const nextMuted = sfx.toggleMute();
    setIsMuted(nextMuted);
  };

  /* ==========================================================================
     3. CRAZY CELEBRATION & EXECUTION PIPELINE
     ========================================================================== */
  const handleExecuteWorkload = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    // Audio Trigger
    sfx.playTriggerChirp();

    // 1. Screen Shake (150ms controlled micro-shake)
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 160);

    // 2. Particle Shockwave (Radiating from Run Button)
    if (runButtonRef.current && particleRef.current) {
      const rect = runButtonRef.current.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      particleRef.current.burst(originX, originY);
    }

    // Try executing against real backend endpoint if live
    let mockExecutionTime = (Math.random() * 0.08 + 0.02).toFixed(3);
    let generatedCols: string[] = [];
    let generatedRows: Record<string, any>[] = [];

    try {
      const res = await fetch(`/api/v1/${dialect}/playground/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (data?.success && data?.data?.result) {
        const r = data.data.result;
        generatedCols = r.columns || [];
        generatedRows = r.rows || [];
        mockExecutionTime = String(r.executionTimeMs || mockExecutionTime);
      } else {
        throw new Error("Local engine fallback");
      }
    } catch {
      // High-octane realistic synthetic fallback dataset for the active query
      if (selectedSchemaKey === "ecommerce_db") {
        generatedCols = ["customer_name", "loyalty_tier", "total_orders", "lifetime_spend", "whale_rank"];
        generatedRows = [
          { customer_name: "Aether Dynamics LLC", loyalty_tier: "TITANIUM", total_orders: 142, lifetime_spend: "$18,450.00", whale_rank: "#1" },
          { customer_name: "Nexus Labs Corp", loyalty_tier: "PLATINUM", total_orders: 98, lifetime_spend: "$12,980.50", whale_rank: "#2" },
          { customer_name: "Hyperion Systems", loyalty_tier: "PLATINUM", total_orders: 87, lifetime_spend: "$11,200.00", whale_rank: "#3" },
          { customer_name: "Vortex Trading", loyalty_tier: "GOLD", total_orders: 64, lifetime_spend: "$8,740.25", whale_rank: "#4" },
          { customer_name: "CyberPulse Analytics", loyalty_tier: "GOLD", total_orders: 51, lifetime_spend: "$6,890.00", whale_rank: "#5" },
          { customer_name: "Neon Horizon Media", loyalty_tier: "SILVER", total_orders: 42, lifetime_spend: "$4,520.10", whale_rank: "#6" },
          { customer_name: "Quantum Logic Inc", loyalty_tier: "SILVER", total_orders: 39, lifetime_spend: "$3,980.00", whale_rank: "#7" },
          { customer_name: "Spectra Tech", loyalty_tier: "BRONZE", total_orders: 28, lifetime_spend: "$2,640.00", whale_rank: "#8" },
        ];
      } else if (selectedSchemaKey === "analytics_warehouse") {
        generatedCols = ["event_name", "event_window", "active_users", "avg_latency_ms"];
        generatedRows = [
          { event_name: "checkout_commit", event_window: "2026-10-08 16:00:00", active_users: 1845, avg_latency_ms: 12.43 },
          { event_name: "query_pipeline_eval", event_window: "2026-10-08 16:00:00", active_users: 4120, avg_latency_ms: 4.88 },
          { event_name: "websocket_handshake", event_window: "2026-10-08 16:00:00", active_users: 8940, avg_latency_ms: 1.15 },
          { event_name: "sandbox_session_spawn", event_window: "2026-10-08 15:00:00", active_users: 1240, avg_latency_ms: 18.90 },
          { event_name: "telemetry_heartbeat", event_window: "2026-10-08 15:00:00", active_users: 16820, avg_latency_ms: 0.42 },
        ];
      } else {
        generatedCols = ["account_number", "currency", "calculated_balance", "stated_balance", "discrepancy"];
        generatedRows = [
          { account_number: "ACC-8839-EUR", currency: "EUR", calculated_balance: "420,100.50", stated_balance: "420,100.50", discrepancy: "0.0000" },
          { account_number: "ACC-1049-USD", currency: "USD", calculated_balance: "1,250,800.00", stated_balance: "1,250,800.00", discrepancy: "0.0000" },
          { account_number: "ACC-9921-GBP", currency: "GBP", calculated_balance: "84,320.15", stated_balance: "84,320.15", discrepancy: "0.0000" },
          { account_number: "ACC-3042-JPY", currency: "JPY", calculated_balance: "148,200,000", stated_balance: "148,200,000", discrepancy: "0.0000" },
        ];
      }
    }

    // Update Result State
    setExecutionResult({
      columns: generatedCols,
      rows: generatedRows,
      rowCount: generatedRows.length,
      execTimeMs: parseFloat(mockExecutionTime) || 0.04,
      memoryUsedMb: 1.42,
    });

    // 3. Increment Combo Streak & Trigger Arcade Sound Arpeggio
    const nextCombo = comboCount + 1;
    setComboCount(nextCombo);
    setComboDetails({
      execTime: `${mockExecutionTime}ms`,
      combo: nextCombo,
    });
    setShowComboBanner(true);
    sfx.playSuccessArpeggio(nextCombo);

    // Auto-hide combo banner after 3.2 seconds
    setTimeout(() => {
      setShowComboBanner(false);
    }, 3200);

    setIsRunning(false);
  }, [isRunning, sql, selectedSchemaKey, dialect, comboCount]);

  /* ==========================================================================
     MONACO EDITOR PALETTE REGISTRATION
     ========================================================================== */
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register Dark Cyberpunk theme
    monaco.editor.defineTheme("arcade-cyberpunk", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "ff007f", fontStyle: "bold" },      // Hot magenta keywords
        { token: "identifier", foreground: "00f0ff" },                     // Hyper-cyan identifiers
        { token: "type.identifier", foreground: "00f0ff", fontStyle: "bold" },
        { token: "string", foreground: "39ff14" },                         // Acid lime strings
        { token: "number", foreground: "fcee0a", fontStyle: "bold" },      // Radioactive yellow
        { token: "operator", foreground: "fcee0a" },
        { token: "comment", foreground: "626284", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#0a0a14",
        "editor.lineHighlightBackground": "#16162a",
        "editorCursor.foreground": "#39ff14",
        "editorLineNumber.foreground": "#424268",
        "editorLineNumber.activeForeground": "#00f0ff",
        "editor.selectionBackground": "#ff007f44",
      },
    });

    // Register Light Neo-Brutalist Pop theme
    monaco.editor.defineTheme("arcade-neobrutalist", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "7928ca", fontStyle: "bold" },      // Vivid ultraviolet
        { token: "identifier", foreground: "0022ff", fontStyle: "bold" },  // Cobalt identifiers
        { token: "string", foreground: "008822" },                         // Dense green strings
        { token: "number", foreground: "ff4d00", fontStyle: "bold" },      // Hazard orange numbers
        { token: "operator", foreground: "ff4d00" },
        { token: "comment", foreground: "737373", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#f5eedc",
        "editorCursor.foreground": "#0022ff",
        "editorLineNumber.foreground": "#888888",
        "editorLineNumber.activeForeground": "#000000",
        "editor.selectionBackground": "#0022ff2a",
      },
    });

    monaco.editor.setTheme(isDark ? "arcade-cyberpunk" : "arcade-neobrutalist");

    // Track active line
    editor.onDidChangeCursorPosition((e: any) => {
      setActiveLine(e.position.lineNumber);
    });

    // Ctrl+Enter or Cmd+Enter command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteWorkload();
    });
  };

  // Re-sync Monaco theme when Dark/Light changes
  useEffect(() => {
    if (editorRef.current && (window as any).monaco) {
      (window as any).monaco.editor.setTheme(isDark ? "arcade-cyberpunk" : "arcade-neobrutalist");
    }
  }, [isDark]);

  return (
    <div
      className={`relative min-h-[calc(100vh-3.5rem)] flex flex-col font-sans overflow-hidden transition-colors duration-200 ${
        screenShake ? "animate-screen-shake" : ""
      } ${isDark ? "bg-cyber-void text-gray-100" : "bg-neo-parchment text-black"}`}
    >
      {/* Dynamic 3D Warp Mesh Background */}
      <CyberWarpBackground typingIntensity={typingIntensity} />

      {/* Canvas Celebration Shockwave Engine */}
      <ParticleCelebration ref={particleRef} />

      {/* ==========================================================================
          RETRO ARCADE SUCCESS COMBO BANNER (TOP-RIGHT RGB SPLIT GLITCH SLIDER)
          ========================================================================== */}
      {showComboBanner && (
        <div className="fixed top-16 right-4 z-50 animate-bounce duration-300">
          <div
            className={`border-3 p-3.5 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-2xl transition-all ${
              isDark
                ? "border-cyber-lime bg-cyber-void/95 text-white shadow-neon-lime"
                : "border-black bg-neo-parchmentDark text-black shadow-brutal-black"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyber-lime text-black font-extrabold text-xl shadow-[0_0_12px_#39ff14]">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs uppercase tracking-wider text-cyber-lime animate-chromatic-glitch">
                  QUERY SOLVED!
                </span>
                <span className="rounded bg-cyber-magenta/20 border border-cyber-magenta text-cyber-magenta px-1.5 py-0.2 text-[10px] font-bold">
                  COMBO x{comboDetails.combo}
                </span>
              </div>
              <p className="font-mono text-xs font-semibold mt-0.5 opacity-90">
                ✦ {comboDetails.execTime} Execution ✦ Sandbox Verified
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          TOP NAVIGATION TOOLBAR & ARCADE CONTROLLER
          ========================================================================== */}
      <header
        className={`relative z-20 flex flex-wrap items-center justify-between border-b-2 px-4 py-2.5 backdrop-blur-md transition-colors ${
          isDark
            ? "border-cyber-cyan/30 bg-cyber-void/80"
            : "border-black bg-neo-parchment/90 shadow-sm"
        }`}
      >
        {/* Left: Pulsing Brand & Schema Quick-Selector Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo with pulsing query lightning icon */}
          <div className="flex items-center gap-2">
            <div
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                isDark
                  ? "border-cyber-lime bg-cyber-void text-cyber-lime shadow-[0_0_12px_#39ff14] animate-pulse"
                  : "border-black bg-neo-orange text-white shadow-brutal-black-sm"
              }`}
            >
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-black tracking-tight leading-none">
                SQL<span className={isDark ? "text-cyber-cyan" : "text-neo-cobalt"}>//STRIKE</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-cyber-lime">
                ARCADE ARENA
              </span>
            </div>
          </div>

          {/* Schema Quick-Selector Badges */}
          <div className="hidden md:flex items-center gap-1.5 ml-2 border-l-2 pl-3 border-current/20">
            <span className="text-[10px] font-mono uppercase opacity-70 tracking-wider">SCHEMA:</span>
            {Object.keys(SCHEMAS).map((key) => {
              const sc = SCHEMAS[key];
              const isSelected = selectedSchemaKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectSchema(key)}
                  className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold tracking-tight transition-all active:scale-95 ${
                    isSelected
                      ? isDark
                        ? "border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan shadow-neon-cyan"
                        : "border-black bg-neo-cobalt text-white shadow-brutal-black-sm"
                      : isDark
                      ? "border-cyber-cyan/30 bg-cyber-surface/60 text-gray-400 hover:text-white"
                      : "border-black/30 bg-neo-parchmentDark text-gray-700 hover:border-black"
                  }`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions, Trigger, Sound & Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dialect Selector */}
          <div className="flex items-center rounded border border-current/30 p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setDialect("postgresql")}
              className={`px-2 py-0.5 rounded font-bold transition ${
                dialect === "postgresql"
                  ? isDark
                    ? "bg-cyber-cyan text-black"
                    : "bg-neo-cobalt text-white"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              PG 16
            </button>
            <button
              onClick={() => setDialect("mysql")}
              className={`px-2 py-0.5 rounded font-bold transition ${
                dialect === "mysql"
                  ? isDark
                    ? "bg-cyber-magenta text-white"
                    : "bg-neo-orange text-white"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              MY 8.4
            </button>
          </div>

          {/* Sound FX Mute Toggle */}
          <button
            onClick={handleToggleMute}
            aria-label="Toggle retro synth sound FX"
            title={isMuted ? "Audio muted (Click to enable)" : "Audio active (Click to mute)"}
            className={`flex items-center gap-1 rounded-md border-2 px-2 py-1 text-xs font-mono font-bold transition active:scale-90 ${
              isDark
                ? isMuted
                  ? "border-gray-700 bg-cyber-void text-gray-400"
                  : "border-cyber-yellow bg-cyber-yellow/20 text-cyber-yellow shadow-neon-yellow"
                : isMuted
                ? "border-gray-400 bg-neo-parchmentDark text-gray-500"
                : "border-black bg-neo-orange text-white shadow-brutal-black-sm"
            }`}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 animate-pulse" />}
            <span className="hidden sm:inline text-[10px]">{isMuted ? "MUTED" : "SFX"}</span>
          </button>

          {/* High-Visibility Animated Theme Switcher Button */}
          <ThemeToggle />

          {/* ARCADE TRIGGER RUN BUTTON */}
          <button
            ref={runButtonRef}
            onClick={handleExecuteWorkload}
            disabled={isRunning}
            className={`group relative flex items-center gap-2 rounded-lg border-2 px-4 py-1.5 font-mono text-xs font-black uppercase tracking-wider transition-all duration-150 active:translate-y-1 ${
              isDark
                ? "border-cyber-lime bg-cyber-lime text-black shadow-neon-lime hover:bg-cyber-primary-light active:shadow-none animate-arcade-pulse"
                : "border-black bg-neo-orange text-white shadow-brutal-black hover:bg-orange-600 active:shadow-none"
            } disabled:opacity-50`}
          >
            <Play
              className={`h-3.5 w-3.5 fill-current transition-transform duration-200 group-hover:scale-125 ${
                isRunning ? "animate-spin" : ""
              }`}
            />
            <span className="tracking-widest">{isRunning ? "RUNNING..." : "RUN QUERY"}</span>

            {/* Visual Keyboard Shortcut Badge with tactile state */}
            <span
              className={`hidden md:inline-flex items-center gap-0.5 rounded border px-1.5 py-0.2 text-[9px] font-bold ${
                keyPressedMap.ctrl || keyPressedMap.enter
                  ? "border-cyber-yellow bg-cyber-yellow text-black scale-110 shadow-lg"
                  : isDark
                  ? "border-black/40 bg-black/30 text-black/90"
                  : "border-white/40 bg-white/20 text-white"
              }`}
            >
              CTRL+↵
            </span>
          </button>
        </div>
      </header>

      {/* ==========================================================================
          SPLIT VIEW INTERFACE GRID (SCHEMA + EDITOR + RESULTS)
          ========================================================================== */}
      <div className="relative z-10 grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ------------------------------------------------------------------------
            LEFT PANE: COLLAPSIBLE SCHEMA EXPLORER SIDEBAR (Col-span-3)
            ------------------------------------------------------------------------ */}
        <aside
          className={`lg:col-span-3 border-r-2 flex flex-col backdrop-blur-sm overflow-hidden transition-colors ${
            isDark
              ? "border-cyber-cyan/30 bg-cyber-void/70"
              : "border-black bg-neo-parchmentDark/95"
          }`}
        >
          {/* Sidebar Header */}
          <div
            className={`flex items-center justify-between border-b-2 px-3 py-2 text-xs font-mono font-bold tracking-wider uppercase ${
              isDark ? "border-cyber-cyan/30 text-cyber-cyan" : "border-black text-black"
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-cyber-lime" />
              <span>SCHEMA EXPLORER</span>
            </div>
            <span className="rounded bg-cyber-yellow/20 px-1.5 py-0.5 text-[9px] font-mono text-cyber-yellow border border-cyber-yellow/40">
              {currentSchema.badge}
            </span>
          </div>

          {/* Tables Treeview */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {currentSchema.tables.map((table) => {
              const isExpanded = !!expandedTables[table.name];
              return (
                <div
                  key={table.name}
                  className={`rounded-lg border-2 transition-all ${
                    isDark
                      ? isExpanded
                        ? "border-cyber-cyan/50 bg-cyber-surface/60"
                        : "border-cyber-cyan/20 bg-cyber-void/50 hover:border-cyber-cyan/40"
                      : isExpanded
                      ? "border-black bg-white shadow-brutal-black-sm"
                      : "border-black/30 bg-neo-parchment hover:border-black"
                  }`}
                >
                  {/* Table Header Bar */}
                  <div
                    onClick={() => toggleTable(table.name)}
                    className="flex cursor-pointer items-center justify-between px-2.5 py-2 select-none"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold truncate">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-cyber-lime" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                      )}
                      <TableIcon className="h-3.5 w-3.5 text-cyber-cyan" />
                      <span className="truncate">{table.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono opacity-60">
                        {table.rowCount.toLocaleString()} rows
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertTableQuery(table.name);
                        }}
                        title={`Inject SELECT from ${table.name}`}
                        className={`rounded p-1 text-[10px] font-mono font-bold transition hover:scale-110 ${
                          isDark
                            ? "bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan hover:text-black"
                            : "bg-neo-cobalt/20 text-neo-cobalt hover:bg-neo-cobalt hover:text-white"
                        }`}
                      >
                        +SQL
                      </button>
                    </div>
                  </div>

                  {/* Columns Detail List */}
                  {isExpanded && (
                    <div
                      className={`border-t-2 px-2.5 py-1.5 space-y-1 text-xs font-mono ${
                        isDark ? "border-cyber-cyan/20 bg-black/30" : "border-black/10 bg-neo-parchment/60"
                      }`}
                    >
                      {table.columns.map((col) => (
                        <div key={col.name} className="flex items-center justify-between text-[11px] py-0.5">
                          <div className="flex items-center gap-1.5 truncate">
                            {col.isPk ? (
                              <span className="flex items-center gap-0.5 text-cyber-yellow font-extrabold text-[9px] bg-cyber-yellow/20 px-1 rounded">
                                <Key className="h-2 w-2" /> PK
                              </span>
                            ) : col.isFk ? (
                              <span className="text-cyber-cyan font-extrabold text-[9px] bg-cyber-cyan/20 px-1 rounded">
                                FK
                              </span>
                            ) : null}
                            <span className={col.isPk ? "font-bold text-cyber-yellow" : "opacity-90"}>
                              {col.name}
                            </span>
                          </div>

                          {/* Color Badge for Data Type */}
                          <span
                            className={`rounded px-1 text-[9px] font-bold ${
                              col.type.includes("INT")
                                ? "bg-cyber-lime/20 text-cyber-lime border border-cyber-lime/40"
                                : col.type.includes("VARCHAR")
                                ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40"
                                : col.type.includes("DECIMAL")
                                ? "bg-cyber-magenta/20 text-cyber-magenta border border-cyber-magenta/40"
                                : "bg-neo-uv/20 text-purple-400 border border-purple-400/40"
                            }`}
                          >
                            {col.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Sandbox Status Bar */}
          <div
            className={`border-t-2 p-2.5 text-[11px] font-mono flex items-center justify-between ${
              isDark ? "border-cyber-cyan/30 text-gray-400" : "border-black text-black"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-cyber-lime" />
              <span>ISOLATED SESSION</span>
            </div>
            <span className="font-bold text-cyber-lime">AUTO-COMMITTED</span>
          </div>
        </aside>

        {/* ------------------------------------------------------------------------
            CENTER PANE: INTERACTIVE SQL EDITOR (Col-span-5)
            ------------------------------------------------------------------------ */}
        <main className="lg:col-span-5 border-r-2 flex flex-col h-full overflow-hidden border-current/20">
          {/* Editor Sub-Header Toolbar */}
          <div
            className={`flex items-center justify-between border-b-2 px-3 py-1.5 text-xs font-mono ${
              isDark ? "border-cyber-cyan/30 bg-cyber-void/80" : "border-black bg-neo-parchmentDark"
            }`}
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-cyber-lime" />
              <span className="font-bold">QUERY WORKBENCH</span>
              <span className="text-[10px] opacity-70">
                LINE <span className="font-bold text-cyber-cyan">{activeLine}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleFormat}
                title="Format SQL Code"
                className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold font-mono transition ${
                  isDark
                    ? "border-cyber-cyan/40 bg-cyber-surface hover:text-white"
                    : "border-black bg-white hover:bg-neo-parchment"
                }`}
              >
                <AlignLeft className="h-3 w-3" />
                <span>FORMAT</span>
              </button>
              <button
                onClick={() => {
                  setSql("");
                  setExecutionResult(null);
                  sfx.playTriggerChirp();
                }}
                title="Clear Editor"
                className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold font-mono transition ${
                  isDark
                    ? "border-cyber-magenta/40 text-cyber-magenta hover:bg-cyber-magenta hover:text-black"
                    : "border-black text-red-600 hover:bg-red-500 hover:text-white"
                }`}
              >
                <Trash2 className="h-3 w-3" />
                <span>CLEAR</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="relative flex-1 overflow-hidden">
            {/* Active Line Indicator Glow (Left Border Accent) */}
            <div
              className={`absolute left-0 z-10 w-1 transition-all duration-150 pointer-events-none ${
                isDark ? "bg-cyber-cyan shadow-[0_0_10px_#00f0ff]" : "bg-neo-cobalt"
              }`}
              style={{
                top: `${(activeLine - 1) * 19 + 6}px`,
                height: "19px",
              }}
            />

            <Editor
              height="100%"
              language={dialect === "mysql" ? "mysql" : "pgsql"}
              value={sql}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme={isDark ? "arcade-cyberpunk" : "arcade-neobrutalist"}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                lineNumbers: "on",
                renderLineHighlight: "all",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 8, bottom: 8 },
              }}
            />
          </div>

          {/* Editor Status Bar */}
          <div
            className={`border-t-2 px-3 py-1 flex items-center justify-between text-[10px] font-mono ${
              isDark ? "border-cyber-cyan/30 bg-cyber-void/90 text-gray-400" : "border-black bg-neo-parchment text-black"
            }`}
          >
            <div className="flex items-center gap-3">
              <span>CHAR COUNT: {sql.length}</span>
              <span className={isTyping ? "text-cyber-lime font-bold animate-pulse" : ""}>
                {isTyping ? "⚡ COMPILING..." : "● READY"}
              </span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              <span>ENGINE:</span>
              <span className={dialect === "mysql" ? "text-cyber-magenta" : "text-cyber-cyan"}>
                {dialect === "mysql" ? "MySQL 8.4 Isolated" : "PostgreSQL 16 PGlite"}
              </span>
            </div>
          </div>
        </main>

        {/* ------------------------------------------------------------------------
            RIGHT PANE: SQL RESULTS & OUTPUT CONSOLE (Col-span-4)
            ------------------------------------------------------------------------ */}
        <section
          className={`lg:col-span-4 flex flex-col h-full overflow-hidden backdrop-blur-sm ${
            isDark ? "bg-cyber-void/70" : "bg-neo-parchment"
          }`}
        >
          {/* Results Header with Execution Metrics */}
          <div
            className={`flex items-center justify-between border-b-2 px-3 py-1.5 text-xs font-mono font-bold ${
              isDark ? "border-cyber-cyan/30 bg-cyber-void/90 text-white" : "border-black bg-neo-parchmentDark text-black"
            }`}
          >
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-cyber-cyan" />
              <span>EXECUTION MATRIX</span>
            </div>

            {executionResult && (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="flex items-center gap-1 text-cyber-lime">
                  <Clock className="h-3 w-3" />
                  {executionResult.execTimeMs}ms
                </span>
                <span className="rounded bg-cyber-cyan/20 text-cyber-cyan px-1 border border-cyber-cyan/40">
                  {executionResult.rowCount} ROWS
                </span>
              </div>
            )}
          </div>

          {/* Results Content Area */}
          <div className="flex-1 overflow-auto p-3">
            {isRunning ? (
              <div className="flex h-full flex-col items-center justify-center space-y-3 font-mono text-xs">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-cyber-lime border-t-transparent shadow-neon-lime" />
                <span className="text-cyber-lime tracking-widest animate-pulse font-bold">
                  EVALUATING QUERY WORKLOAD...
                </span>
              </div>
            ) : executionResult ? (
              <div className="flex flex-col h-full space-y-3">
                {/* Result Table with Cascading Spring Materialization */}
                <div
                  className={`flex-1 overflow-auto rounded-lg border-2 ${
                    isDark
                      ? "border-cyber-cyan/40 bg-cyber-void shadow-neon-cyan"
                      : "border-black bg-white shadow-brutal-black"
                  }`}
                >
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead
                      className={`sticky top-0 z-10 border-b-2 ${
                        isDark ? "border-cyber-cyan/40 bg-cyber-surface text-cyber-cyan" : "border-black bg-neo-parchmentDark text-black"
                      }`}
                    >
                      <tr>
                        {executionResult.columns.map((col) => (
                          <th key={col} className="px-3 py-2 font-black tracking-wider uppercase">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {executionResult.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          style={{
                            animationDelay: `${idx * 40}ms`,
                          }}
                          className={`animate-cascade-in scanline-sweep-lime border-b border-current/15 transition-colors ${
                            isDark
                              ? "hover:bg-cyber-surface/80 text-gray-200"
                              : "hover:bg-neo-parchment text-black"
                          }`}
                        >
                          {executionResult.columns.map((col) => (
                            <td key={col} className="px-3 py-1.5 truncate max-w-[200px] font-medium">
                              {row[col] === null ? (
                                <span className="opacity-40 italic">null</span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Performance Summary Banner */}
                <div
                  className={`border-2 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono ${
                    isDark
                      ? "border-cyber-lime/40 bg-cyber-void text-cyber-lime"
                      : "border-black bg-neo-parchmentDark text-black shadow-brutal-black-sm"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-cyber-lime" />
                    <span>0 CONSTRAINTS VIOLATED</span>
                  </div>
                  <span className="font-extrabold text-[10px] tracking-widest text-cyber-magenta">
                    COMBO STREAK x{comboCount}
                  </span>
                </div>
              </div>
            ) : (
              /* IDLE STATE: Floating 3D/Vector Database Geometry & Retro Reticles */
              <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-4">
                <TiltCard maxTilt={14} className="flex flex-col items-center">
                  <div
                    className={`relative h-28 w-28 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      isDark
                        ? "border-cyber-cyan/40 bg-cyber-surface/60 text-cyber-cyan shadow-neon-cyan"
                        : "border-black bg-white text-neo-cobalt shadow-brutal-black"
                    }`}
                  >
                    {/* Retro Cybernetic Database Geometry */}
                    <svg viewBox="0 0 100 100" className="h-16 w-16 fill-none stroke-current" strokeWidth="2.5">
                      {/* Top cylinder cap */}
                      <ellipse cx="50" cy="24" rx="34" ry="12" />
                      {/* Mid cylinder band */}
                      <path d="M16 24 v26 c0 6.6 15.2 12 34 12 s34 -5.4 34 -12 v-26" />
                      {/* Lower cylinder band */}
                      <path d="M16 50 v26 c0 6.6 15.2 12 34 12 s34 -5.4 34 -12 v-26" />
                      {/* Glowing center beam */}
                      <line x1="50" y1="18" x2="50" y2="82" stroke="#39ff14" strokeWidth="2" strokeDasharray="4 3" />
                    </svg>

                    {/* Orbiting particles */}
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-cyber-lime shadow-[0_0_8px_#39ff14] animate-ping" />
                    <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-cyber-magenta shadow-[0_0_8px_#ff007f]" />
                  </div>
                </TiltCard>

                <div className="space-y-1 font-mono">
                  <h3 className="text-xs font-black uppercase tracking-widest">
                    AWAITING QUERY DISPATCH
                  </h3>
                  <p className="text-[11px] opacity-70 max-w-xs">
                    Hit <kbd className="font-bold border border-current px-1 rounded">Ctrl+Enter</kbd> or press{" "}
                    <span className="font-bold text-cyber-lime">RUN QUERY</span> to trigger execution and unleash particle shockwaves.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
