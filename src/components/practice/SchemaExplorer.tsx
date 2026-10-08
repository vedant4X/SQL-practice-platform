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
    <div className="flex h-full flex-col border-r border-background-border bg-background-darker/70 text-slate-300">
      <div className="flex items-center gap-2 border-b border-background-border px-3 py-2.5">
        <Database className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white">
          Schema: {databaseId}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-full animate-pulse rounded bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {tables.map((table) => {
              const isExpanded = !!expandedTables[table.name];
              return (
                <div key={table.name} className="rounded border border-transparent hover:border-slate-800">
                  <div
                    onClick={() => toggleTable(table.name)}
                    className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs font-medium transition ${
                      table.isRelevant
                        ? "bg-primary/10 text-primary-light font-semibold"
                        : "hover:bg-slate-800/60 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      )}
                      <Table className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{table.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTable(previewTable === table.name ? null : table.name);
                      }}
                      title="Preview top 10 rows"
                      className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Columns list */}
                  {isExpanded && (
                    <div className="my-1 ml-4 space-y-1 border-l border-slate-700 pl-2">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px] font-mono text-slate-400"
                        >
                          <div className="flex items-center gap-1 truncate">
                            {col.isPk && <Key className="h-2.5 w-2.5 text-amber-400 shrink-0" />}
                            <span className={col.isPk ? "text-amber-300 font-semibold" : ""}>
                              {col.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{col.dataType}</span>
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

      {/* Row Preview Modal / Drawer */}
      {previewTable && selectedPreviewData && (
        <div className="border-t border-background-border bg-background-card/95 p-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 font-semibold text-white">
            <span>Preview: {previewTable} (First 10 Rows)</span>
            <button
              onClick={() => setPreviewTable(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="max-h-48 overflow-auto rounded border border-slate-700 bg-editor-bg">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-800 text-slate-300 sticky top-0">
                <tr>
                  {selectedPreviewData.columns.map((col) => (
                    <th key={col.name} className="px-2 py-1 border-b border-slate-700">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedPreviewData.previewRows || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    {selectedPreviewData.columns.map((col) => (
                      <td key={col.name} className="px-2 py-0.5 text-slate-300 truncate max-w-[120px]">
                        {row[col.name] === null ? (
                          <span className="text-slate-500 italic">null</span>
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
