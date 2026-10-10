"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { format } from "sql-formatter";
import {
  Play,
  AlignLeft,
  Trash2,
  Terminal,
  Clock,
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  Key,
  Database,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Copy,
  Link2,
  AlertCircle,
  Info,
  Server,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";
import { Button } from "@/components/ui/Button";
import { Dialect } from "@/lib/engine/types";

// Dynamic Monaco Editor (SSR false)
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-panel)] font-mono text-xs text-[var(--text-muted)]">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
        <span>Initializing SQL Editor...</span>
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
  getDefaultQuery: (dialect: Dialect) => string;
}

const SCHEMAS: Record<string, SchemaWorkspace> = {
  ecommerce_db: {
    id: "ecommerce_db",
    label: "e-commerce_db",
    badge: "E-Commerce",
    getDefaultQuery: () => `-- E-Commerce Customer Spend & Order Breakdown
SELECT 
    c.customer_name,
    c.loyalty_tier,
    COUNT(o.order_id) AS total_orders,
    ROUND(SUM(o.total_amount), 2) AS lifetime_spend,
    RANK() OVER (ORDER BY SUM(o.total_amount) DESC) AS customer_rank
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
        rowCount: 5,
        columns: [
          { name: "customer_id", type: "INT", isPk: true },
          { name: "customer_name", type: "VARCHAR" },
          { name: "loyalty_tier", type: "VARCHAR" },
          { name: "signup_timestamp", type: "TIMESTAMP" },
        ],
      },
      {
        name: "orders",
        rowCount: 8,
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
        rowCount: 4,
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
    badge: "Analytics",
    getDefaultQuery: (dialect: Dialect) =>
      dialect === "mysql"
        ? `-- Telemetry Event Stream Analytics (MySQL 8.4)
SELECT 
    e.event_name,
    DATE_FORMAT(e.occurred_at, '%Y-%m-%d %H:00:00') AS event_window,
    COUNT(DISTINCT e.user_id) AS active_users,
    ROUND(AVG(e.duration_ms), 3) AS avg_latency_ms
FROM telemetry_events e
GROUP BY e.event_name, DATE_FORMAT(e.occurred_at, '%Y-%m-%d %H:00:00')
ORDER BY event_window DESC, active_users DESC
LIMIT 10;`
        : `-- Telemetry Event Stream Analytics (PostgreSQL 16)
SELECT 
    e.event_name,
    DATE_TRUNC('hour', e.occurred_at) AS event_window,
    COUNT(DISTINCT e.user_id) AS active_users,
    ROUND(AVG(e.duration_ms), 3) AS avg_latency_ms
FROM telemetry_events e
GROUP BY e.event_name, DATE_TRUNC('hour', e.occurred_at)
ORDER BY event_window DESC, active_users DESC
LIMIT 10;`,
    tables: [
      {
        name: "telemetry_events",
        rowCount: 5,
        columns: [
          { name: "event_id", type: "BIGINT", isPk: true },
          { name: "user_id", type: "INT" },
          { name: "event_name", type: "VARCHAR" },
          { name: "duration_ms", type: "DECIMAL" },
          { name: "occurred_at", type: "TIMESTAMP" },
        ],
      },
      {
        name: "user_sessions",
        rowCount: 3,
        columns: [
          { name: "session_id", type: "VARCHAR", isPk: true },
          { name: "user_id", type: "INT" },
          { name: "ip_address", type: "VARCHAR" },
          { name: "device_type", type: "VARCHAR" },
        ],
      },
    ],
  },
  fintech_core: {
    id: "fintech_core",
    label: "fintech_core",
    badge: "Fintech",
    getDefaultQuery: () => `-- Double-Entry Ledger Reconciliation
SELECT 
    a.account_number,
    a.currency,
    SUM(CASE WHEN t.direction = 'CREDIT' THEN t.amount ELSE -t.amount END) AS calculated_balance,
    a.stated_balance,
    ABS(SUM(CASE WHEN t.direction = 'CREDIT' THEN t.amount ELSE -t.amount END) - a.stated_balance) AS discrepancy
FROM accounts a
LEFT JOIN ledger_transactions t ON a.account_id = t.account_id
GROUP BY a.account_id, a.account_number, a.currency, a.stated_balance
ORDER BY calculated_balance DESC;`,
    tables: [
      {
        name: "accounts",
        rowCount: 3,
        columns: [
          { name: "account_id", type: "INT", isPk: true },
          { name: "account_number", type: "VARCHAR" },
          { name: "currency", type: "VARCHAR" },
          { name: "stated_balance", type: "DECIMAL" },
        ],
      },
      {
        name: "ledger_transactions",
        rowCount: 5,
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
  sandbox_notes: {
    id: "sandbox_notes",
    label: "sandbox_notes",
    badge: "Scratchpad",
    getDefaultQuery: () => `-- Scratchpad Sandbox Notes
SELECT * FROM demo_notes ORDER BY id ASC;`,
    tables: [
      {
        name: "demo_notes",
        rowCount: 2,
        columns: [
          { name: "id", type: "INT", isPk: true },
          { name: "title", type: "VARCHAR" },
          { name: "content", type: "TEXT" },
          { name: "created_at", type: "TIMESTAMP" },
        ],
      },
    ],
  },
};

/* ==========================================================================
   2. MAIN PLAYGROUND WORKBENCH COMPONENT
   ========================================================================== */

interface ArcadePlaygroundProps {
  initialDialect?: Dialect;
}

export default function ArcadePlayground({ initialDialect = "postgresql" }: ArcadePlaygroundProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const pathname = usePathname();

  // State: Dialect & Schema
  const [dialect, setDialect] = useState<Dialect>(initialDialect);
  const [selectedSchemaKey, setSelectedSchemaKey] = useState<string>("ecommerce_db");
  const currentSchema = SCHEMAS[selectedSchemaKey] || SCHEMAS.ecommerce_db;

  // State: Editor & Execution
  const [sql, setSql] = useState<string>(currentSchema.getDefaultQuery(dialect));
  const [activeLine, setActiveLine] = useState<number>(1);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    customers: true,
    orders: true,
    telemetry_events: true,
    accounts: true,
    demo_notes: true,
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    columns: string[];
    rows: Record<string, any>[];
    rowCount: number;
    execTimeMs: number;
    error?: {
      message: string;
      sqlState?: string;
      hint?: string;
      userFacingMessage?: string;
    };
  } | null>(null);

  const editorRef = useRef<any>(null);

  // Sync dialect from URL if pathname changes
  useEffect(() => {
    if (pathname.startsWith("/mysql")) {
      setDialect("mysql");
    } else {
      setDialect("postgresql");
    }
  }, [pathname]);

  // Keyboard shortcut listener for Ctrl/Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleExecuteWorkload();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sql, dialect]);

  // Switch schema quick selector
  const handleSelectSchema = (key: string) => {
    setSelectedSchemaKey(key);
    const target = SCHEMAS[key];
    if (target) {
      setSql(target.getDefaultQuery(dialect));
      setExecutionResult(null);
    }
  };

  // Switch dialect
  const handleSwitchDialect = (newDialect: Dialect) => {
    if (newDialect === dialect) return;
    setDialect(newDialect);
    document.cookie = `sql_dialect=${newDialect}; path=/; max-age=31536000`;

    // Navigate to dialect-scoped route
    if (newDialect === "mysql") {
      router.push("/mysql/playground");
    } else {
      router.push("/playground");
    }

    // Refresh query template for newly active dialect
    const schema = SCHEMAS[selectedSchemaKey];
    if (schema) {
      setSql(schema.getDefaultQuery(newDialect));
    }
    setExecutionResult(null);
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const handleInsertTableQuery = (tableName: string) => {
    setSql((prev) => `${prev.trim()}\n\n-- Inspect table [${tableName}]\nSELECT * FROM ${tableName} LIMIT 10;`);
  };

  const handleFormat = () => {
    try {
      const formatted = format(sql, {
        language: dialect === "mysql" ? "mysql" : "postgresql",
        keywordCase: "upper",
        linesBetweenQueries: 2,
      });
      setSql(formatted);
    } catch {
      // Retain existing text if parse fails
    }
  };

  /* ==========================================================================
     EXECUTION PIPELINE (Zero-Mock Authentic Engine Call)
     ========================================================================== */
  const handleExecuteWorkload = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      const res = await fetch(`/api/v1/${dialect}/playground/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });

      const data = await res.json();
      if (data?.success && data?.data?.result) {
        const r = data.data.result;
        setExecutionResult({
          success: !!r.success,
          columns: r.columns || [],
          rows: r.rows || [],
          rowCount: r.rowCount ?? (r.rows?.length || 0),
          execTimeMs: r.executionTimeMs || 1,
          error: r.error,
        });
      } else {
        const errMessage = data?.error?.message || "Execution request failed";
        setExecutionResult({
          success: false,
          columns: [],
          rows: [],
          rowCount: 0,
          execTimeMs: 0,
          error: { message: errMessage, userFacingMessage: errMessage },
        });
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        columns: [],
        rows: [],
        rowCount: 0,
        execTimeMs: 0,
        error: {
          message: err?.message || "Network error communicating with SQL engine",
          userFacingMessage: "Failed to reach playground execution engine. Please verify server status.",
        },
      });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, sql, dialect]);

  // Reset database sandbox handler
  const handleResetDatabase = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setResetMessage(null);

    try {
      const res = await fetch(`/api/v1/${dialect}/playground/reset`, {
        method: "POST",
      });
      const data = await res.json();
      if (data?.success) {
        setResetMessage(`${dialect === "mysql" ? "MySQL 8.4" : "PostgreSQL 16"} sandbox reset to initial state.`);
        setTimeout(() => setResetMessage(null), 4000);
        setExecutionResult(null);
      }
    } catch {
      setResetMessage("Failed to reset database.");
      setTimeout(() => setResetMessage(null), 3000);
    } finally {
      setIsResetting(false);
    }
  };

  /* ==========================================================================
     MONACO EDITOR SETUP (Calibrated to Quiet Grove Theme)
     ========================================================================== */
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Define Quiet Grove Dark
    monaco.editor.defineTheme("quietgrove-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "8FD0A0", fontStyle: "bold" },
        { token: "string", foreground: "E5B782" },
        { token: "number", foreground: "91BDE0" },
        { token: "comment", foreground: "9BB1A1", fontStyle: "italic" },
        { token: "identifier", foreground: "DDE8DE" },
      ],
      colors: {
        "editor.background": "#273630",
        "editor.lineHighlightBackground": "#202B27",
        "editorCursor.foreground": "#8FD0A0",
        "editorWhitespace.foreground": "#45574B",
        "editorLineNumber.foreground": "#6F8777",
        "editorLineNumber.activeForeground": "#DDE8DE",
      },
    });

    // Define Quiet Grove Light
    monaco.editor.defineTheme("quietgrove-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "1B6E32", fontStyle: "bold" },
        { token: "string", foreground: "8C530A" },
        { token: "number", foreground: "155A8A" },
        { token: "comment", foreground: "4E6556", fontStyle: "italic" },
        { token: "identifier", foreground: "1B2620" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.lineHighlightBackground": "#F4F7F4",
        "editorCursor.foreground": "#1B6E32",
        "editorWhitespace.foreground": "#D6E0D8",
        "editorLineNumber.foreground": "#76927F",
        "editorLineNumber.activeForeground": "#1B2620",
      },
    });

    monaco.editor.setTheme(isDark ? "quietgrove-dark" : "quietgrove-light");

    editor.onDidChangeCursorPosition((e: any) => {
      setActiveLine(e.position.lineNumber);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteWorkload();
    });
  };

  useEffect(() => {
    if (editorRef.current && (window as any).monaco) {
      (window as any).monaco.editor.setTheme(isDark ? "quietgrove-dark" : "quietgrove-light");
    }
  }, [isDark]);

  // Determine numeric columns for tabular-nums right alignment
  const isNumericCol = (colName: string) => {
    if (!executionResult?.rows || executionResult.rows.length === 0) return false;
    return executionResult.rows.every(
      (r) =>
        r[colName] === null ||
        typeof r[colName] === "number" ||
        (!isNaN(Number(r[colName])) && r[colName] !== "")
    );
  };

  return (
    <div className="flex-1 flex flex-col font-sans bg-[var(--bg-base)] text-[var(--text-main)] transition-colors min-h-[calc(100vh-3.5rem)]">
      {/* Reset Notification Banner */}
      {resetMessage && (
        <div className="bg-[var(--accent-info-bg)] border-b border-[var(--accent-info-border)] text-[var(--accent-info-text)] px-4 py-2 text-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>{resetMessage}</span>
          </div>
          <button
            onClick={() => setResetMessage(null)}
            className="text-xs hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Playground Control Bar */}
      <header className="sticky top-14 z-30 flex flex-wrap items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2.5 gap-3 shadow-xs transition-colors">
        {/* Left: Workbench Identifier & Schemas */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold text-xs shadow-xs">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
                SQL Workbench
              </span>
              <span className="hidden md:inline ml-2 text-xs font-mono text-[var(--text-muted)]">
                ({dialect === "mysql" ? "MySQL 8.4" : "PostgreSQL 16"})
              </span>
            </div>
          </div>

          {/* Schema Selector Tabs */}
          <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-3 overflow-x-auto">
            <span className="text-xs text-[var(--text-muted)] mr-1 hidden sm:inline">Schema:</span>
            {Object.keys(SCHEMAS).map((key) => {
              const sc = SCHEMAS[key];
              const isSelected = selectedSchemaKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectSchema(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                    isSelected
                      ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-transparent"
                  }`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Engine Switch & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dialect Toggle */}
          <div className="flex items-center rounded-md border border-[var(--border-control)] bg-[var(--bg-panel)] p-0.5 text-xs">
            <button
              onClick={() => handleSwitchDialect("postgresql")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                dialect === "postgresql"
                  ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              }`}
            >
              Postgres
            </button>
            <button
              onClick={() => handleSwitchDialect("mysql")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                dialect === "mysql"
                  ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              }`}
            >
              MySQL
            </button>
          </div>

          {/* Reset Sandbox */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetDatabase}
            isLoading={isResetting}
            title="Reset sandbox database tables to defaults"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Reset DB</span>
          </Button>

          {/* Format Query */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFormat}
            title="Format SQL query"
            leftIcon={<AlignLeft className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Format</span>
          </Button>

          {/* Clear Editor */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSql("");
              setExecutionResult(null);
            }}
            title="Clear SQL Editor"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">Clear</span>
          </Button>

          {/* RUN QUERY BUTTON */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecuteWorkload}
            isLoading={isRunning}
            leftIcon={<Play className="h-3.5 w-3.5 fill-current" />}
            rightIcon={
              <kbd className="ml-1 hidden font-mono text-[10px] opacity-75 sm:inline">
                Ctrl+↵
              </kbd>
            }
          >
            Run Query
          </Button>
        </div>
      </header>

      {/* Main 3-Column Split View */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[640px]">
        {/* ====================================================================
            COLUMN 1: SCHEMA EXPLORER SIDEBAR (3 cols on lg)
            ==================================================================== */}
        <aside className="lg:col-span-3 border-r border-[var(--border-color)] bg-[var(--bg-panel)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-3.5 py-2.5 text-xs font-semibold text-[var(--text-main)]">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--accent-primary)]" />
              <span>Database Explorer</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {currentSchema.tables.length} tables
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {currentSchema.tables.map((table) => {
              const isExpanded = !!expandedTables[table.name];
              return (
                <div
                  key={table.name}
                  className="rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden transition-colors"
                >
                  <div
                    onClick={() => toggleTable(table.name)}
                    className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--border-color)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                      )}
                      <TableIcon className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                      <span className="font-semibold truncate font-mono">{table.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] shrink-0">
                      <span>{table.rowCount} rows</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertTableQuery(table.name);
                        }}
                        title={`Insert query for ${table.name}`}
                        className="rounded p-1 hover:bg-[var(--border-control)]/30 hover:text-[var(--text-main)] transition"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2 space-y-1 text-xs">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px] py-1 font-mono border-b border-[var(--border-color)]/40 last:border-0"
                        >
                          <div className="flex items-center gap-1.5 truncate text-[var(--text-main)]">
                            {col.isPk ? (
                              <span title="Primary Key" className="inline-flex">
                                <Key className="h-3 w-3 text-[var(--accent-warning)] shrink-0" />
                              </span>
                            ) : col.isFk ? (
                              <span title="Foreign Key" className="inline-flex">
                                <Link2 className="h-3 w-3 text-[var(--accent-info)] shrink-0" />
                              </span>
                            ) : (
                              <span className="w-3" />
                            )}
                            <span className={col.isPk ? "font-semibold text-[var(--accent-warning)]" : ""}>
                              {col.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)]">{col.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-[var(--border-color)] p-3 text-xs text-[var(--text-muted)] flex items-center justify-between bg-[var(--bg-panel)]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[var(--accent-success)]" />
              <span>Isolated Sandbox</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-[var(--accent-success)]">Active</span>
          </div>
        </aside>

        {/* ====================================================================
            COLUMN 2: SQL EDITOR (5 cols on lg)
            ==================================================================== */}
        <main className="lg:col-span-5 border-r border-[var(--border-color)] flex flex-col h-full overflow-hidden bg-[var(--bg-panel)]">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-panel)] px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] font-mono text-[11px]">
              <span className="font-semibold text-[var(--text-main)]">SQL Editor</span>
              <span>• Line {activeLine}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
              <span>{dialect.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-[380px]">
            <Editor
              height="100%"
              language={dialect === "mysql" ? "mysql" : "pgsql"}
              value={sql}
              onChange={(val) => setSql(val || "")}
              onMount={handleEditorDidMount}
              theme={isDark ? "quietgrove-dark" : "quietgrove-light"}
              options={{
                fontSize: 13,
                fontFamily: "'IBM Plex Mono', 'JetBrains Mono', Consolas, monospace",
                lineNumbers: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                padding: { top: 10, bottom: 10 },
              }}
            />
          </div>
        </main>

        {/* ====================================================================
            COLUMN 3: RESULTS OUTPUT CONSOLE (4 cols on lg)
            ==================================================================== */}
        <section className="lg:col-span-4 flex flex-col h-full overflow-hidden bg-[var(--bg-panel)]">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-panel)] px-3.5 py-2 text-xs font-semibold text-[var(--text-main)]">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-[var(--text-muted)]" />
              <span>Query Results</span>
            </div>

            {executionResult && executionResult.success && (
              <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                  <Clock className="h-3 w-3" />
                  {executionResult.execTimeMs} ms
                </span>
                <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[var(--text-main)] border border-[var(--border-color)]">
                  {executionResult.rowCount} rows
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-3">
            {isRunning ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center space-y-2 text-xs text-[var(--text-muted)]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
                <span className="font-mono">Executing query in sandbox...</span>
              </div>
            ) : executionResult ? (
              executionResult.success ? (
                <div className="flex flex-col h-full space-y-3">
                  {/* Success metrics */}
                  <div className="border border-[var(--accent-success-border)] bg-[var(--accent-success-bg)] p-2.5 rounded-md flex items-center justify-between text-xs text-[var(--accent-success-text)]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Query OK</span>
                    </div>
                    <span className="font-mono">{executionResult.rowCount} rows returned</span>
                  </div>

                  {/* Results table */}
                  <div className="flex-1 overflow-auto rounded-md border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-xs">
                    {executionResult.rows.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--text-muted)] italic">
                        Query returned 0 rows.
                      </div>
                    ) : (
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead className="sticky top-0 bg-[var(--bg-surface)] text-[var(--text-main)] border-b border-[var(--border-color)] select-none">
                          <tr>
                            {executionResult.columns.map((col) => {
                              const num = isNumericCol(col);
                              return (
                                <th
                                  key={col}
                                  className={`px-3 py-2 font-semibold ${num ? "text-right" : "text-left"}`}
                                >
                                  {col}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {executionResult.rows.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-[var(--border-color)]/40 hover:bg-[var(--bg-surface)] transition-colors"
                            >
                              {executionResult.columns.map((col) => {
                                const num = isNumericCol(col);
                                return (
                                  <td
                                    key={col}
                                    className={`px-3 py-1.5 text-[var(--text-main)] truncate max-w-[200px] ${
                                      num ? "text-right font-variant-numeric tabular-nums" : "text-left"
                                    }`}
                                  >
                                    {row[col] === null ? (
                                      <span className="text-[var(--text-muted)] italic">null</span>
                                    ) : (
                                      String(row[col])
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                /* Execution Error Box */
                <div className="rounded-md border border-[var(--accent-danger)] bg-[var(--accent-danger-bg)] p-3.5 text-xs text-[var(--accent-danger-text)] space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[var(--accent-danger)]" />
                    <span>
                      Execution Error {executionResult.error?.sqlState ? `(${executionResult.error.sqlState})` : ""}
                    </span>
                  </div>
                  <p className="font-mono text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                    {executionResult.error?.userFacingMessage || executionResult.error?.message}
                  </p>
                  {executionResult.error?.hint && (
                    <div className="rounded border border-[var(--accent-warning)] bg-[var(--accent-warning-bg)] p-2 text-[var(--accent-warning-text)]">
                      <span className="font-semibold">Hint: </span>
                      {executionResult.error.hint}
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Idle Empty State */
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center p-6 space-y-3 text-[var(--text-muted)]">
                <div className="h-12 w-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
                  <Database className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[var(--text-main)]">
                    No results to display
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                    Write an SQL query and press <kbd className="border border-[var(--border-control)] bg-[var(--bg-surface)] text-[var(--text-main)] rounded px-1 text-[10px]">Ctrl+Enter</kbd> or click <strong>Run Query</strong> to execute.
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
