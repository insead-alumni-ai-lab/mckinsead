"use client";

import { useState } from "react";

/**
 * Ansoff Matrix Canvas (§7.5).
 *
 * 2×2: (existing/new market) × (existing/new product).
 * Each cell holds candidate moves linked back to BCG cash cows / stars.
 */

interface AnsoffMove {
  id: string;
  description: string;
  linked_bcg_ids: string[];
  feasibility: number; // 0-1
  attractiveness: number; // 0-1
}

type CellKey = "market_penetration" | "product_development" | "market_development" | "diversification";

const CELL_META: Record<CellKey, { label: string; row: string; col: string; color: string; bg: string; risk: string }> = {
  market_penetration: {
    label: "Market Penetration",
    row: "Existing Market",
    col: "Existing Product",
    color: "#059669",
    bg: "#ecfdf5",
    risk: "Low Risk",
  },
  product_development: {
    label: "Product Development",
    row: "Existing Market",
    col: "New Product",
    color: "#2563eb",
    bg: "#eff6ff",
    risk: "Medium Risk",
  },
  market_development: {
    label: "Market Development",
    row: "New Market",
    col: "Existing Product",
    color: "#d97706",
    bg: "#fffbeb",
    risk: "Medium Risk",
  },
  diversification: {
    label: "Diversification",
    row: "New Market",
    col: "New Product",
    color: "#dc2626",
    bg: "#fef2f2",
    risk: "High Risk",
  },
};

export function AnsoffCanvas() {
  const [cells, setCells] = useState<Record<CellKey, AnsoffMove[]>>({
    market_penetration: [],
    product_development: [],
    market_development: [],
    diversification: [],
  });
  const [activeCell, setActiveCell] = useState<CellKey | null>(null);
  const [newMove, setNewMove] = useState("");

  const addMove = (cell: CellKey) => {
    if (!newMove.trim()) return;
    setCells((prev) => ({
      ...prev,
      [cell]: [
        ...prev[cell],
        {
          id: crypto.randomUUID(),
          description: newMove.trim(),
          linked_bcg_ids: [],
          feasibility: 0.5,
          attractiveness: 0.5,
        },
      ],
    }));
    setNewMove("");
  };

  const removeMove = (cell: CellKey, id: string) => {
    setCells((prev) => ({
      ...prev,
      [cell]: prev[cell].filter((m) => m.id !== id),
    }));
  };

  const updateMove = (cell: CellKey, id: string, updates: Partial<AnsoffMove>) => {
    setCells((prev) => ({
      ...prev,
      [cell]: prev[cell].map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const totalMoves = Object.values(cells).reduce((sum, c) => sum + c.length, 0);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: 2×2 Matrix */}
      <div className="col-span-7">
        <div className="card">
          <h3 className="text-sm font-semibold text-navy-700 mb-4">Ansoff Growth Matrix</h3>

          {/* Matrix headers */}
          <div className="grid grid-cols-[80px_1fr_1fr] gap-0">
            <div /> {/* corner */}
            <div className="text-center text-xs font-semibold text-navy-600 pb-2">Existing Product</div>
            <div className="text-center text-xs font-semibold text-navy-600 pb-2">New Product</div>
          </div>

          <div className="grid grid-cols-[80px_1fr_1fr] gap-0">
            {/* Row 1: Existing Market */}
            <div className="flex items-center justify-center text-xs font-semibold text-navy-600 -rotate-0 pr-2" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}>
              Existing Market
            </div>
            {(["market_penetration", "product_development"] as CellKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveCell(activeCell === key ? null : key)}
                className={`p-4 border border-navy-200 rounded-lg m-1 text-left transition-all min-h-[140px] ${
                  activeCell === key ? "ring-2 ring-accent-500 shadow-md" : "hover:shadow"
                }`}
                style={{ backgroundColor: CELL_META[key].bg }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: CELL_META[key].color }}>
                    {CELL_META[key].label}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: CELL_META[key].color + "20", color: CELL_META[key].color }}>
                    {CELL_META[key].risk}
                  </span>
                </div>
                <div className="space-y-1">
                  {cells[key].slice(0, 3).map((move) => (
                    <div key={move.id} className="text-xs text-navy-600 truncate">• {move.description}</div>
                  ))}
                  {cells[key].length > 3 && (
                    <div className="text-xs text-navy-400">+{cells[key].length - 3} more</div>
                  )}
                  {cells[key].length === 0 && (
                    <div className="text-xs text-navy-300 italic">Click to add moves</div>
                  )}
                </div>
                <div className="mt-2 text-xs text-navy-400">{cells[key].length} moves</div>
              </button>
            ))}

            {/* Row 2: New Market */}
            <div className="flex items-center justify-center text-xs font-semibold text-navy-600 pr-2" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}>
              New Market
            </div>
            {(["market_development", "diversification"] as CellKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveCell(activeCell === key ? null : key)}
                className={`p-4 border border-navy-200 rounded-lg m-1 text-left transition-all min-h-[140px] ${
                  activeCell === key ? "ring-2 ring-accent-500 shadow-md" : "hover:shadow"
                }`}
                style={{ backgroundColor: CELL_META[key].bg }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: CELL_META[key].color }}>
                    {CELL_META[key].label}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: CELL_META[key].color + "20", color: CELL_META[key].color }}>
                    {CELL_META[key].risk}
                  </span>
                </div>
                <div className="space-y-1">
                  {cells[key].slice(0, 3).map((move) => (
                    <div key={move.id} className="text-xs text-navy-600 truncate">• {move.description}</div>
                  ))}
                  {cells[key].length > 3 && (
                    <div className="text-xs text-navy-400">+{cells[key].length - 3} more</div>
                  )}
                  {cells[key].length === 0 && (
                    <div className="text-xs text-navy-300 italic">Click to add moves</div>
                  )}
                </div>
                <div className="mt-2 text-xs text-navy-400">{cells[key].length} moves</div>
              </button>
            ))}
          </div>

          <p className="text-xs text-navy-400 mt-3 text-center">
            {totalMoves} growth strategies identified across 4 quadrants
          </p>
        </div>
      </div>

      {/* Right: Detail panel for active cell */}
      <div className="col-span-5">
        {activeCell ? (
          <div className="card" style={{ borderColor: CELL_META[activeCell].color + "40" }}>
            <h3 className="text-lg font-semibold mb-1" style={{ color: CELL_META[activeCell].color }}>
              {CELL_META[activeCell].label}
            </h3>
            <p className="text-xs text-navy-500 mb-4">
              {CELL_META[activeCell].row} × {CELL_META[activeCell].col}
            </p>

            {/* Add move */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newMove}
                onChange={(e) => setNewMove(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMove(activeCell)}
                className="input-field flex-1"
                placeholder="Describe a growth move..."
              />
              <button onClick={() => addMove(activeCell)} className="btn-primary text-xs" disabled={!newMove.trim()}>
                Add
              </button>
            </div>

            {/* Moves list */}
            <div className="space-y-3">
              {cells[activeCell].map((move) => (
                <div key={move.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-navy-800">{move.description}</p>
                    <button onClick={() => removeMove(activeCell, move.id)} className="text-red-400 hover:text-red-600 ml-2">
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-navy-500">Feasibility</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={move.feasibility * 100}
                        onChange={(e) => updateMove(activeCell, move.id, { feasibility: parseInt(e.target.value) / 100 })}
                        className="w-full h-1.5"
                      />
                      <span className="text-xs text-navy-400">{(move.feasibility * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <label className="text-xs text-navy-500">Attractiveness</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={move.attractiveness * 100}
                        onChange={(e) => updateMove(activeCell, move.id, { attractiveness: parseInt(e.target.value) / 100 })}
                        className="w-full h-1.5"
                      />
                      <span className="text-xs text-navy-400">{(move.attractiveness * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-center py-12 text-navy-300">
            <p className="text-lg mb-2">Click a quadrant</p>
            <p className="text-sm">Select a quadrant in the matrix to add and manage growth strategies</p>
          </div>
        )}

        {/* AI Panel */}
        <div className="card mt-4 bg-accent-50 border-accent-200">
          <h4 className="text-sm font-semibold text-accent-800 mb-2">🤖 AI Assist</h4>
          <div className="space-y-2">
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Generate moves from BCG analysis
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Score feasibility from market data
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Identify whitespace opportunities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
