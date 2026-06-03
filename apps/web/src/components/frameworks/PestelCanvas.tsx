"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";

/**
 * PESTEL Analysis Canvas — Six-factor macro-environmental analysis.
 * FR-04 + §7.2: Signals scored on impact (1-5) and time horizon.
 * Real-time data enrichment via mcp-macro and mcp-news (M0: manual + stubs).
 */

interface PestelSignal {
  id: string;
  category: string;
  claim: string;
  impact: number;
  time_horizon: "0-6m" | "6-24m" | "24m+";
  source: string;
}

const CATEGORIES = [
  { key: "political", label: "Political", icon: "🏛️", color: "bg-red-50 border-red-200 text-red-800" },
  { key: "economic", label: "Economic", icon: "💰", color: "bg-green-50 border-green-200 text-green-800" },
  { key: "social", label: "Social", icon: "👥", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { key: "technological", label: "Technological", icon: "⚙️", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { key: "environmental", label: "Environmental", icon: "🌍", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  { key: "legal", label: "Legal", icon: "⚖️", color: "bg-amber-50 border-amber-200 text-amber-800" },
] as const;

const IMPACT_LABELS = ["", "Very Low", "Low", "Medium", "High", "Very High"];

export function PestelCanvas() {
  const [signals, setSignals] = useState<PestelSignal[]>([]);
  const [activeCategory, setActiveCategory] = useState("political");

  const addSignal = (category: string) => {
    setSignals((prev) => [
      ...prev,
      {
        id: uuid(),
        category,
        claim: "",
        impact: 3,
        time_horizon: "6-24m",
        source: "",
      },
    ]);
  };

  const updateSignal = (id: string, updates: Partial<PestelSignal>) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeSignal = (id: string) => {
    setSignals((prev) => prev.filter((s) => s.id !== id));
  };

  const categorySignals = signals.filter((s) => s.category === activeCategory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left: Category selector */}
      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const count = signals.filter((s) => s.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all
                ${
                  activeCategory === cat.key
                    ? cat.color + " shadow-sm"
                    : "bg-white border-gray-100 hover:border-gray-200"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {cat.icon} {cat.label}
                </span>
                {count > 0 && (
                  <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Impact heat map summary */}
        <div className="card mt-4">
          <h4 className="text-xs font-semibold text-navy-600 mb-2 uppercase tracking-wide">
            Impact Summary
          </h4>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const catSignals = signals.filter((s) => s.category === cat.key);
              const avgImpact =
                catSignals.length > 0
                  ? catSignals.reduce((sum, s) => sum + s.impact, 0) / catSignals.length
                  : 0;
              return (
                <div key={cat.key} className="flex items-center gap-2">
                  <span className="text-xs w-8">{cat.icon}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-accent-500 rounded-full h-2 transition-all"
                      style={{ width: `${(avgImpact / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">
                    {avgImpact ? avgImpact.toFixed(1) : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center: Signal editor */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-navy-800">
            {CATEGORIES.find((c) => c.key === activeCategory)?.icon}{" "}
            {CATEGORIES.find((c) => c.key === activeCategory)?.label} Factors
          </h3>
          <button
            onClick={() => addSignal(activeCategory)}
            className="btn-primary text-sm"
          >
            + Add Signal
          </button>
        </div>

        {categorySignals.map((signal) => (
          <div key={signal.id} className="card group">
            <div className="flex gap-2 mb-2">
              <textarea
                className="flex-1 input-field text-sm h-16"
                placeholder="Describe the signal or factor..."
                value={signal.claim}
                onChange={(e) =>
                  updateSignal(signal.id, { claim: e.target.value })
                }
              />
              <button
                onClick={() => removeSignal(signal.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-navy-500">Impact:</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateSignal(signal.id, { impact: level })}
                      className={`w-6 h-6 rounded text-xs font-bold transition-colors
                        ${
                          signal.impact >= level
                            ? "bg-accent-500 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-navy-400">
                  {IMPACT_LABELS[signal.impact]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-navy-500">Horizon:</label>
                <select
                  value={signal.time_horizon}
                  onChange={(e) =>
                    updateSignal(signal.id, {
                      time_horizon: e.target.value as PestelSignal["time_horizon"],
                    })
                  }
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="0-6m">0-6 months</option>
                  <option value="6-24m">6-24 months</option>
                  <option value="24m+">24+ months</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-navy-500">Source:</label>
                <input
                  type="text"
                  className="text-xs border rounded px-2 py-1 w-32"
                  placeholder="Citation..."
                  value={signal.source}
                  onChange={(e) =>
                    updateSignal(signal.id, { source: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        ))}

        {categorySignals.length === 0 && (
          <div className="text-center py-12 text-navy-300">
            <p className="text-lg mb-2">No signals yet</p>
            <p className="text-sm">
              Add signals manually or use AI to auto-populate from live data
            </p>
          </div>
        )}
      </div>

      {/* Right: AI panel */}
      <div className="space-y-4">
        <div className="card bg-accent-50 border-accent-200">
          <h4 className="text-sm font-semibold text-accent-800 mb-2">
            🤖 AI Enrichment
          </h4>
          <p className="text-xs text-accent-700 mb-3">
            Auto-populate signals from live economic, geopolitical, and market
            data sources for your industry and geography.
          </p>
          <button className="btn-primary w-full text-sm">
            🌐 Enrich from Live Data
          </button>
          <button className="btn-secondary w-full text-sm mt-2">
            📰 Pull Latest News
          </button>
        </div>

        <div className="card">
          <h4 className="text-sm font-semibold text-navy-700 mb-2">
            Data Sources (M0)
          </h4>
          <ul className="text-xs text-navy-500 space-y-1.5">
            <li className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              World Bank / IMF (Macro)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              News API (Sentiment)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              SEC EDGAR (M1)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
              GDELT Geopolitical (M1)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
