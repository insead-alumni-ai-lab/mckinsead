"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";

/**
 * SWOT Analysis Canvas — Interactive 4-quadrant SWOT editor.
 * FR-03 + §7.1: Items with claim, evidence, confidence, magnitude.
 * Includes TOWS cross-strategies (mandatory per AGENTS.md).
 */

interface SwotItem {
  id: string;
  claim: string;
  evidence_ids: string[];
  confidence: number;
  magnitude: "high" | "medium" | "low";
}

interface SwotData {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  cross_strategies: {
    so: string[];
    wo: string[];
    st: string[];
    wt: string[];
  };
}

const QUADRANTS = [
  { key: "strengths" as const, label: "Strengths", color: "bg-green-50 border-green-200", icon: "💪", textColor: "text-green-800" },
  { key: "weaknesses" as const, label: "Weaknesses", color: "bg-red-50 border-red-200", icon: "⚠️", textColor: "text-red-800" },
  { key: "opportunities" as const, label: "Opportunities", color: "bg-blue-50 border-blue-200", icon: "🌟", textColor: "text-blue-800" },
  { key: "threats" as const, label: "Threats", color: "bg-amber-50 border-amber-200", icon: "⚡", textColor: "text-amber-800" },
] as const;

const MAGNITUDE_COLORS = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export function SwotCanvas() {
  const [data, setData] = useState<SwotData>({
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
    cross_strategies: { so: [], wo: [], st: [], wt: [] },
  });

  const [showTows, setShowTows] = useState(false);

  const addItem = (quadrant: keyof Pick<SwotData, "strengths" | "weaknesses" | "opportunities" | "threats">) => {
    const newItem: SwotItem = {
      id: uuid(),
      claim: "",
      evidence_ids: [],
      confidence: 0.5,
      magnitude: "medium",
    };
    setData((prev) => ({
      ...prev,
      [quadrant]: [...prev[quadrant], newItem],
    }));
  };

  const updateItem = (
    quadrant: keyof Pick<SwotData, "strengths" | "weaknesses" | "opportunities" | "threats">,
    id: string,
    updates: Partial<SwotItem>
  ) => {
    setData((prev) => ({
      ...prev,
      [quadrant]: prev[quadrant].map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const removeItem = (
    quadrant: keyof Pick<SwotData, "strengths" | "weaknesses" | "opportunities" | "threats">,
    id: string
  ) => {
    setData((prev) => ({
      ...prev,
      [quadrant]: prev[quadrant].filter((item) => item.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* SWOT 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((q) => (
          <div
            key={q.key}
            className={`card border-2 ${q.color} min-h-[250px]`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${q.textColor} flex items-center gap-2`}>
                <span>{q.icon}</span>
                {q.label}
                <span className="text-xs font-normal opacity-60">
                  ({data[q.key].length})
                </span>
              </h3>
              <button
                onClick={() => addItem(q.key)}
                className="text-xs bg-white/80 hover:bg-white px-2 py-1 rounded border shadow-sm"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {data[q.key].map((item) => (
                <div
                  key={item.id}
                  className="bg-white/70 rounded-md p-2 border border-white/50 group"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-400"
                      placeholder="Enter claim..."
                      value={item.claim}
                      onChange={(e) =>
                        updateItem(q.key, item.id, { claim: e.target.value })
                      }
                    />
                    <button
                      onClick={() => removeItem(q.key, item.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={item.magnitude}
                      onChange={(e) =>
                        updateItem(q.key, item.id, {
                          magnitude: e.target.value as "high" | "medium" | "low",
                        })
                      }
                      className={`text-xs px-1.5 py-0.5 rounded border-0 ${MAGNITUDE_COLORS[item.magnitude]}`}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={item.confidence * 100}
                      onChange={(e) =>
                        updateItem(q.key, item.id, {
                          confidence: parseInt(e.target.value) / 100,
                        })
                      }
                      className="w-16 h-1"
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
              {data[q.key].length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">
                  Click &quot;+ Add&quot; to add items
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TOWS Cross-Strategies (mandatory per §7.1) */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-800">
            TOWS Cross-Strategies
          </h3>
          <button
            onClick={() => setShowTows(!showTows)}
            className="text-sm text-accent-600 hover:text-accent-700"
          >
            {showTows ? "Hide" : "Show"} TOWS Matrix
          </button>
        </div>
        {showTows && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "so" as const, label: "SO Strategies", desc: "Use Strengths to capture Opportunities" },
              { key: "wo" as const, label: "WO Strategies", desc: "Overcome Weaknesses using Opportunities" },
              { key: "st" as const, label: "ST Strategies", desc: "Use Strengths to mitigate Threats" },
              { key: "wt" as const, label: "WT Strategies", desc: "Minimize Weaknesses & avoid Threats" },
            ].map((strat) => (
              <div key={strat.key} className="bg-navy-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-navy-700">
                  {strat.label}
                </h4>
                <p className="text-xs text-navy-500 mb-2">{strat.desc}</p>
                <textarea
                  className="input-field text-sm h-20"
                  placeholder="Enter strategies..."
                  value={data.cross_strategies[strat.key].join("\n")}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      cross_strategies: {
                        ...prev.cross_strategies,
                        [strat.key]: e.target.value
                          .split("\n")
                          .filter(Boolean),
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Assist */}
      <div className="flex gap-3">
        <button className="btn-primary text-sm">
          🤖 AI: Suggest SWOT Items
        </button>
        <button className="btn-secondary text-sm">
          🔍 Challenge Mode
        </button>
        <button className="btn-secondary text-sm">
          📊 Generate TOWS Strategies
        </button>
      </div>
    </div>
  );
}
