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
      <div className="flex h-48 flex-col items-center justify-center gap-2.5 text-slate-500 dark:text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span className="text-xs font-mono">Executing query in sandbox...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Info className="h-5 w-5 opacity-60" />
        <span className="text-xs">Run or submit a query to view execution results.</span>
      </div>
    );
  }

  if (!result.success && result.error) {
    return (
      <div className="rounded-md border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-3.5 text-xs text-rose-900 dark:text-rose-200">
        <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-400 mb-1.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Execution Error {result.error.sqlState ? `(${result.error.sqlState})` : ""}</span>
        </div>
        <p className="font-mono text-slate-800 dark:text-slate-200 mb-2 leading-relaxed whitespace-pre-wrap">
          {result.error.userFacingMessage || result.error.message}
        </p>
        {result.error.hint && (
          <div className="rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-2 text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Hint: </span>
            {result.error.hint}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Metrics Banner */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Query OK
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {result.rowCount} {result.rowCount === 1 ? "row" : "rows"} returned
            {result.hasMore ? ` (truncated to ${result.rowCount})` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          <span>{result.executionTimeMs} ms</span>
        </div>
      </div>

      {/* Table view */}
      <div className="flex-1 overflow-auto rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16] max-h-80 shadow-sm">
        {result.rows.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 italic">
            Query returned 0 rows.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {result.columns.map((col) => (
                  <th key={col} className="px-3 py-1.5 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {result.columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-1.5 text-slate-800 dark:text-slate-200 truncate max-w-[220px]"
                    >
                      {row[col] === null ? (
                        <span className="text-slate-400 italic">null</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
