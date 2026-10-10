"use client";

import React, { useState } from "react";
import { Table, Key, ChevronDown, ChevronRight, Eye, Database, X } from "lucide-react";

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
    <div className="flex h-full flex-col border-l border-[var(--border-color)] bg-[var(--bg-panel)] text-[var(--text-main)] transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2.5">
        <Database className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] font-mono truncate">
          Schema: {databaseId}
        </span>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-full animate-pulse rounded bg-[var(--bg-surface)]" />
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
                        ? "bg-[var(--accent-success-bg)] text-[var(--accent-success-text)] font-semibold border-l-2 border-[var(--accent-primary)]"
                        : "hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                      )}
                      <Table className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                      <span className="truncate font-mono">{table.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTable(previewTable === table.name ? null : table.name);
                      }}
                      title="Preview rows"
                      className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)] transition"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Columns list */}
                  {isExpanded && (
                    <div className="my-1 ml-4 space-y-1 border-l border-[var(--border-color)] pl-2">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] py-0.5"
                        >
                          <div className="flex items-center gap-1 truncate text-[var(--text-main)]">
                            {col.isPk ? (
                              <Key className="h-2.5 w-2.5 text-[var(--accent-warning)] shrink-0" />
                            ) : null}
                            <span className={col.isPk ? "text-[var(--accent-warning)] font-semibold" : ""}>
                              {col.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)]">{col.dataType}</span>
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
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] p-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 font-semibold text-[var(--text-main)]">
            <span>Preview: {previewTable}</span>
            <button
              onClick={() => setPreviewTable(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-48 overflow-auto rounded border border-[var(--border-color)] bg-[var(--bg-panel)] shadow-xs">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-[var(--bg-surface)] text-[var(--text-main)] border-b border-[var(--border-color)] sticky top-0">
                <tr>
                  {selectedPreviewData.columns.map((col) => (
                    <th key={col.name} className="px-2 py-1 font-semibold">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selectedPreviewData.previewRows || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-[var(--border-color)]/40 hover:bg-[var(--bg-surface)]">
                    {selectedPreviewData.columns.map((col) => (
                      <td key={col.name} className="px-2 py-0.5 text-[var(--text-main)] truncate max-w-[120px]">
                        {row[col.name] === null ? (
                          <span className="text-[var(--text-muted)] italic">null</span>
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
