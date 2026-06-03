"use client";

import { useState } from "react";

/**
 * SIPOC Canvas (§7.6).
 *
 * Suppliers · Inputs · Process · Outputs · Customers.
 * One row per critical process. Used to scope operational deep-dives.
 */

interface SipocRow {
  id: string;
  process_name: string;
  suppliers: string[];
  inputs: string[];
  process_steps: string[];
  outputs: string[];
  customers: string[];
}

const COLUMNS = [
  { key: "suppliers" as const, label: "Suppliers", color: "#8b5cf6", icon: "🏭" },
  { key: "inputs" as const, label: "Inputs", color: "#2563eb", icon: "📥" },
  { key: "process_steps" as const, label: "Process", color: "#059669", icon: "⚙️" },
  { key: "outputs" as const, label: "Outputs", color: "#d97706", icon: "📤" },
  { key: "customers" as const, label: "Customers", color: "#dc2626", icon: "👥" },
];

const emptyRow = (): SipocRow => ({
  id: crypto.randomUUID(),
  process_name: "",
  suppliers: [],
  inputs: [],
  process_steps: [],
  outputs: [],
  customers: [],
});

export function SipocCanvas() {
  const [rows, setRows] = useState<SipocRow[]>([emptyRow()]);
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; col: keyof SipocRow } | null>(null);
  const [cellInput, setCellInput] = useState("");

  const addRow = () => {
    const row = emptyRow();
    setRows((prev) => [...prev, row]);
    setActiveRow(row.id);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (activeRow === id) setActiveRow(null);
  };

  const updateProcessName = (id: string, name: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, process_name: name } : r)));
  };

  const addCellItem = (rowId: string, col: "suppliers" | "inputs" | "process_steps" | "outputs" | "customers") => {
    if (!cellInput.trim()) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, [col]: [...r[col], cellInput.trim()] } : r
      )
    );
    setCellInput("");
  };

  const removeCellItem = (rowId: string, col: "suppliers" | "inputs" | "process_steps" | "outputs" | "customers", idx: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, [col]: r[col].filter((_, i) => i !== idx) } : r
      )
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-medium text-navy-600">
                {col.icon} {col.label}
              </span>
            </div>
          ))}
        </div>
        <button onClick={addRow} className="btn-primary text-xs">
          + Add Process
        </button>
      </div>

      {/* SIPOC Table */}
      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`card transition-all ${
              activeRow === row.id ? "ring-2 ring-accent-500" : ""
            }`}
            onClick={() => setActiveRow(row.id)}
          >
            {/* Process name header */}
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={row.process_name}
                onChange={(e) => updateProcessName(row.id, e.target.value)}
                className="text-lg font-semibold text-navy-900 bg-transparent border-none outline-none w-full"
                placeholder="Process Name (e.g., Order Fulfillment)"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeRow(row.id);
                }}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                ×
              </button>
            </div>

            {/* SIPOC columns */}
            <div className="grid grid-cols-5 gap-3">
              {COLUMNS.map((col) => {
                const items = row[col.key] as string[];
                const isEditing = editingCell?.rowId === row.id && editingCell?.col === col.key;

                return (
                  <div
                    key={col.key}
                    className="rounded-lg p-3 min-h-[100px]"
                    style={{ backgroundColor: col.color + "08", border: `1px solid ${col.color}30` }}
                  >
                    <h4
                      className="text-xs font-semibold mb-2 flex items-center gap-1"
                      style={{ color: col.color }}
                    >
                      {col.icon} {col.label}
                    </h4>
                    <div className="space-y-1">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-navy-700 bg-white rounded px-2 py-1"
                        >
                          <span>{item}</span>
                          <button
                            onClick={() => removeCellItem(row.id, col.key, idx)}
                            className="text-red-300 hover:text-red-500 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {isEditing ? (
                      <div className="mt-2 flex gap-1">
                        <input
                          type="text"
                          value={cellInput}
                          onChange={(e) => setCellInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addCellItem(row.id, col.key);
                            }
                            if (e.key === "Escape") {
                              setEditingCell(null);
                              setCellInput("");
                            }
                          }}
                          autoFocus
                          className="text-xs border border-gray-300 rounded px-1.5 py-0.5 flex-1 min-w-0"
                          placeholder="Add item..."
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCell({ rowId: row.id, col: col.key });
                          setCellInput("");
                        }}
                        className="mt-2 text-xs opacity-40 hover:opacity-70"
                        style={{ color: col.color }}
                      >
                        + add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* AI Panel */}
      <div className="card mt-6 bg-accent-50 border-accent-200">
        <h4 className="text-sm font-semibold text-accent-800 mb-2">🤖 AI Assist</h4>
        <div className="flex gap-2 flex-wrap">
          <button className="text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
            Auto-populate from ops data
          </button>
          <button className="text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
            Identify bottlenecks
          </button>
          <button className="text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
            Link to Value Chain
          </button>
        </div>
      </div>
    </div>
  );
}
