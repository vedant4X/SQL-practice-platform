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
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs font-mono">Executing query in PostgreSQL 16 sandbox...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-500">
        <Info className="h-5 w-5" />
        <span className="text-xs">Run or submit a query to view results here.</span>
      </div>
    );
  }

  if (!result.success && result.error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-red-400 mb-2">
          <AlertCircle className="h-4 w-4" />
          <span>PostgreSQL Error {result.error.sqlState ? `(${result.error.sqlState})` : ""}</span>
        </div>
        <p className="text-slate-200 font-mono mb-2">{result.error.userFacingMessage}</p>
        {result.error.hint && (
          <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-amber-300">
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
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Query OK
          </span>
          <span>
            {result.rowCount} {result.rowCount === 1 ? "row" : "rows"} returned
            {result.hasMore ? ` (truncated to ${result.rowCount})` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 font-mono">
          <Clock className="h-3 w-3" />
          <span>{result.executionTimeMs} ms</span>
        </div>
      </div>

      {/* Table view */}
      <div className="flex-1 overflow-auto rounded border border-slate-800 bg-editor-bg max-h-80">
        {result.rows.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 italic">
            Query returned 0 rows.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-slate-800 text-slate-300 border-b border-slate-700">
              <tr>
                {result.columns.map((col) => (
                  <th key={col} className="px-3 py-1.5 font-semibold text-slate-200">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                  {result.columns.map((col) => (
                    <td key={col} className="px-3 py-1.5 text-slate-300 truncate max-w-[200px]">
                      {row[col] === null ? (
                        <span className="text-slate-500 italic">null</span>
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
