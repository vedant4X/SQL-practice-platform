"use client";

import React, { useState } from "react";
import { Table, Key, ChevronDown, ChevronRight, Eye, Database } from "lucide-react";

export interface ColumnMeta {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPk?: boolean;
}

export interface TableMeta {
  name: string;
  isRelevant: boolean;
  columns: ColumnMeta[];
  previewRows?: Record<string, unknown>[];
}

interface SchemaExplorerProps {
  databaseId: string;
  tables: TableMeta[];
  isLoading?: boolean;
}

export default function SchemaExplorer({ databaseId, tables, isLoading = false }: SchemaExplorerProps) {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [previewTable, setPreviewTable] = useState<string | null>(null);

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const selectedPreviewData = tables.find((t) => t.name === previewTable);

  return (
    <div className="flex h-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16] text-slate-800 dark:text-slate-200 transition-colors">
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5">
        <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Schema: {databaseId}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {tables.map((table) => {
              const isExpanded = !!expandedTables[table.name];
              return (
                <div key={table.name} className="rounded border border-transparent">
                  <div
                    onClick={() => toggleTable(table.name)}
                    className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs font-medium transition ${
                      table.isRelevant
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      )}
                      <Table className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{table.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTable(previewTable === table.name ? null : table.name);
                      }}
                      title="Preview rows"
                      className="rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Columns list */}
                  {isExpanded && (
                    <div className="my-1 ml-4 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 py-0.5"
                        >
                          <div className="flex items-center gap-1 truncate">
                            {col.isPk && <Key className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
                            <span className={col.isPk ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                              {col.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{col.dataType}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row Preview Drawer */}
      {previewTable && selectedPreviewData && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 p-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <span>Preview: {previewTable}</span>
            <button
              onClick={() => setPreviewTable(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="max-h-48 overflow-auto rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16]">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                <tr>
                  {selectedPreviewData.columns.map((col) => (
                    <th key={col.name} className="px-2 py-1 border-b border-slate-200 dark:border-slate-700 font-semibold">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedPreviewData.previewRows || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    {selectedPreviewData.columns.map((col) => (
                      <td key={col.name} className="px-2 py-0.5 text-slate-800 dark:text-slate-300 truncate max-w-[120px]">
                        {row[col.name] === null ? (
                          <span className="text-slate-400 italic">null</span>
                        ) : (
                          String(row[col.name])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
