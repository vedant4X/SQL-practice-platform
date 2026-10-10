"use client";

import React from "react";
import { AlertCircle, Clock, CheckCircle2, Info } from "lucide-react";
import { QueryExecutionResult } from "@/lib/engine/types";

interface ResultTableProps {
  result: QueryExecutionResult | null;
  isLoading?: boolean;
}

export default function ResultTable({ result, isLoading }: ResultTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2.5 text-[var(--text-muted)]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
        <span className="text-xs font-mono">Executing query in sandbox...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
        <Info className="h-5 w-5 opacity-60" />
        <span className="text-xs">Run or submit a query to view execution results.</span>
      </div>
    );
  }

  if (!result.success && result.error) {
    return (
      <div className="rounded-md border border-[var(--accent-danger)] bg-[var(--accent-danger-bg)] p-3.5 text-xs text-[var(--accent-danger-text)]">
        <div className="flex items-center gap-2 font-semibold mb-1.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-[var(--accent-danger)]" />
          <span>Execution Error {result.error.sqlState ? `(${result.error.sqlState})` : ""}</span>
        </div>
        <p className="font-mono text-[var(--text-main)] mb-2 leading-relaxed whitespace-pre-wrap">
          {result.error.userFacingMessage || result.error.message}
        </p>
        {result.error.hint && (
          <div className="rounded border border-[var(--accent-warning)] bg-[var(--accent-warning-bg)] p-2 text-[var(--accent-warning-text)]">
            <span className="font-semibold">Hint: </span>
            {result.error.hint}
          </div>
        )}
      </div>
    );
  }

  // Determine numeric columns for tabular right-alignment
  const isNumericCol = (colName: string) => {
    if (!result.rows || result.rows.length === 0) return false;
    return result.rows.every(
      (r) => r[colName] === null || typeof r[colName] === "number" || (!isNaN(Number(r[colName])) && r[colName] !== "")
    );
  };

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Metrics Banner */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono font-medium text-[var(--accent-success)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Query OK
          </span>
          <span className="text-[var(--text-main)] font-medium">
            {result.rowCount} {result.rowCount === 1 ? "row" : "rows"} returned
            {result.hasMore ? ` (truncated to ${result.rowCount})` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[var(--text-muted)]">
          <Clock className="h-3 w-3" />
          <span>{result.executionTimeMs} ms</span>
        </div>
      </div>

      {/* Table view */}
      <div className="flex-1 overflow-auto rounded border border-[var(--border-color)] bg-[var(--bg-panel)] max-h-80 shadow-xs">
        {result.rows.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--text-muted)] italic">
            Query returned 0 rows.
          </div>
        ) : (
          <table className="w-full font-mono text-xs border-collapse">
            <thead className="sticky top-0 bg-[var(--bg-surface)] text-[var(--text-main)] border-b border-[var(--border-color)] select-none">
              <tr>
                {result.columns.map((col) => {
                  const num = isNumericCol(col);
                  return (
                    <th
                      key={col}
                      className={`px-3 py-2 font-semibold text-[var(--text-main)] ${
                        num ? "text-right" : "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-[var(--border-color)] transition-colors hover:bg-[var(--bg-surface)]/80 ${
                    i % 2 === 1 ? "bg-[var(--bg-surface)]/30" : "bg-[var(--bg-panel)]"
                  }`}
                >
                  {result.columns.map((col) => {
                    const val = row[col];
                    const num = isNumericCol(col);
                    return (
                      <td
                        key={col}
                        className={`px-3 py-1.5 truncate max-w-[240px] text-[var(--text-main)] ${
                          num ? "text-right tabular-nums" : "text-left"
                        }`}
                      >
                        {val === null ? (
                          <span className="text-[var(--text-faint)] italic font-sans text-[11px]">NULL</span>
                        ) : typeof val === "boolean" ? (
                          <span className="font-semibold">{val ? "TRUE" : "FALSE"}</span>
                        ) : (
                          String(val)
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
  );
}
