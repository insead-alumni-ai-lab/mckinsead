"use client";

import { useState } from "react";

/**
 * Root Cause Analysis Canvas (§7.8).
 *
 * Two tools:
 * 1. 5 Whys — iterative "why?" chains to drill to root cause.
 * 2. Ishikawa (Fishbone) — 6M categories (Man, Machine, Material, Method, Measurement, Mother Nature).
 *
 * Output feeds directly into the Hypothesis Tree.
 */

interface FiveWhyChain {
  id: string;
  problem: string;
  whys: string[];
  root_cause: string;
}

interface IshikawaCategory {
  category: "man" | "machine" | "material" | "method" | "measurement" | "mother_nature";
  causes: string[];
}

const ISHIKAWA_META: Record<string, { label: string; icon: string; color: string }> = {
  man: { label: "Man (People)", icon: "👤", color: "#8b5cf6" },
  machine: { label: "Machine (Equipment)", icon: "⚙️", color: "#2563eb" },
  material: { label: "Material", icon: "🧱", color: "#059669" },
  method: { label: "Method (Process)", icon: "📋", color: "#d97706" },
  measurement: { label: "Measurement", icon: "📏", color: "#dc2626" },
  mother_nature: { label: "Mother Nature (Environment)", icon: "🌍", color: "#0d9488" },
};

const ALL_CATEGORIES = Object.keys(ISHIKAWA_META) as IshikawaCategory["category"][];

export function RootCauseCanvas() {
  const [activeTab, setActiveTab] = useState<"five_whys" | "ishikawa">("five_whys");
  const [problemStatement, setProblemStatement] = useState("");

  // 5 Whys state
  const [whyChains, setWhyChains] = useState<FiveWhyChain[]>([]);

  // Ishikawa state
  const [ishikawa, setIshikawa] = useState<IshikawaCategory[]>(
    ALL_CATEGORIES.map((cat) => ({ category: cat, causes: [] }))
  );
  const [newCauseInput, setNewCauseInput] = useState<Record<string, string>>(
    Object.fromEntries(ALL_CATEGORIES.map((c) => [c, ""]))
  );

  // ─── 5 Whys ──────────────────────────────────────────────────────

  const addWhyChain = () => {
    setWhyChains((prev) => [
      ...prev,
      { id: crypto.randomUUID(), problem: problemStatement || "Problem", whys: [""], root_cause: "" },
    ]);
  };

  const updateWhy = (chainId: string, whyIdx: number, value: string) => {
    setWhyChains((prev) =>
      prev.map((c) =>
        c.id === chainId
          ? { ...c, whys: c.whys.map((w, i) => (i === whyIdx ? value : w)) }
          : c
      )
    );
  };

  const addWhy = (chainId: string) => {
    setWhyChains((prev) =>
      prev.map((c) =>
        c.id === chainId && c.whys.length < 7 ? { ...c, whys: [...c.whys, ""] } : c
      )
    );
  };

  const setRootCause = (chainId: string, value: string) => {
    setWhyChains((prev) =>
      prev.map((c) => (c.id === chainId ? { ...c, root_cause: value } : c))
    );
  };

  const removeChain = (chainId: string) => {
    setWhyChains((prev) => prev.filter((c) => c.id !== chainId));
  };

  // ─── Ishikawa ────────────────────────────────────────────────────

  const addCause = (category: string) => {
    const input = newCauseInput[category]?.trim();
    if (!input) return;
    setIshikawa((prev) =>
      prev.map((cat) =>
        cat.category === category ? { ...cat, causes: [...cat.causes, input] } : cat
      )
    );
    setNewCauseInput((prev) => ({ ...prev, [category]: "" }));
  };

  const removeCause = (category: string, idx: number) => {
    setIshikawa((prev) =>
      prev.map((cat) =>
        cat.category === category
          ? { ...cat, causes: cat.causes.filter((_, i) => i !== idx) }
          : cat
      )
    );
  };

  const totalCauses = ishikawa.reduce((sum, cat) => sum + cat.causes.length, 0);

  return (
    <div>
      {/* Problem statement */}
      <div className="card mb-4">
        <label className="block text-sm font-medium text-navy-700 mb-1">Problem Statement</label>
        <input
          type="text"
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          className="input-field"
          placeholder="What is the problem you're investigating? (e.g., 'EBIT margin declined 3pp YoY')"
        />
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("five_whys")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "five_whys"
              ? "bg-accent-600 text-white"
              : "bg-white text-navy-700 hover:bg-navy-50 border border-navy-200"
          }`}
        >
          🔍 5 Whys ({whyChains.length} chains)
        </button>
        <button
          onClick={() => setActiveTab("ishikawa")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "ishikawa"
              ? "bg-accent-600 text-white"
              : "bg-white text-navy-700 hover:bg-navy-50 border border-navy-200"
          }`}
        >
          🐟 Ishikawa / Fishbone ({totalCauses} causes)
        </button>
      </div>

      {/* 5 Whys Tab */}
      {activeTab === "five_whys" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-navy-500">
              Start with the problem and ask "Why?" iteratively until you reach the root cause.
            </p>
            <button onClick={addWhyChain} className="btn-primary text-xs">
              + New Chain
            </button>
          </div>

          <div className="space-y-4">
            {whyChains.map((chain) => (
              <div key={chain.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-navy-800">
                    Problem: {chain.problem || problemStatement || "—"}
                  </h4>
                  <button onClick={() => removeChain(chain.id)} className="text-red-400 hover:text-red-600 text-sm">
                    ×
                  </button>
                </div>

                <div className="space-y-2 ml-2 border-l-2 border-navy-200 pl-4">
                  {chain.whys.map((why, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-accent-600 mt-2 min-w-[50px]">
                        Why {idx + 1}?
                      </span>
                      <input
                        type="text"
                        value={why}
                        onChange={(e) => updateWhy(chain.id, idx, e.target.value)}
                        className="input-field flex-1"
                        placeholder={idx === 0 ? "Why is this happening?" : "Why is that?"}
                      />
                    </div>
                  ))}
                  {chain.whys.length < 7 && (
                    <button
                      onClick={() => addWhy(chain.id)}
                      className="text-xs text-accent-600 hover:text-accent-800 ml-14"
                    >
                      + Ask another Why
                    </button>
                  )}
                </div>

                {/* Root cause */}
                <div className="mt-3 pt-3 border-t border-navy-200">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-emerald-600 mt-2 min-w-[80px]">Root Cause:</span>
                    <input
                      type="text"
                      value={chain.root_cause}
                      onChange={(e) => setRootCause(chain.id, e.target.value)}
                      className="input-field flex-1 !border-emerald-300"
                      placeholder="The identified root cause..."
                    />
                  </div>
                </div>
              </div>
            ))}

            {whyChains.length === 0 && (
              <div className="card text-center py-12 text-navy-300">
                <p className="text-lg mb-2">No 5 Why chains yet</p>
                <p className="text-sm">Add a chain to start drilling into root causes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ishikawa / Fishbone Tab */}
      {activeTab === "ishikawa" && (
        <div>
          <p className="text-sm text-navy-500 mb-4">
            Organize potential causes into 6M categories. Each category helps ensure you're looking at the
            problem from all angles.
          </p>

          {/* Fishbone visualization */}
          <div className="card mb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 border-2 border-red-400 rounded-lg px-6 py-3 text-center">
                <span className="text-sm font-bold text-red-700">
                  {problemStatement || "Problem Statement"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {ishikawa.map((cat) => {
                const meta = ISHIKAWA_META[cat.category];
                return (
                  <div
                    key={cat.category}
                    className="rounded-lg p-4 border"
                    style={{ borderColor: meta.color + "40", backgroundColor: meta.color + "08" }}
                  >
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1" style={{ color: meta.color }}>
                      {meta.icon} {meta.label}
                    </h4>

                    <div className="space-y-1 mb-2">
                      {cat.causes.map((cause, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5"
                        >
                          <span className="text-navy-700">{cause}</span>
                          <button
                            onClick={() => removeCause(cat.category, idx)}
                            className="text-red-300 hover:text-red-500 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newCauseInput[cat.category] || ""}
                        onChange={(e) =>
                          setNewCauseInput((prev) => ({ ...prev, [cat.category]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addCause(cat.category)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 flex-1 min-w-0"
                        placeholder="Add cause..."
                      />
                      <button
                        onClick={() => addCause(cat.category)}
                        className="text-xs px-2 py-1 rounded text-white"
                        style={{ backgroundColor: meta.color }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Panel */}
      <div className="card bg-accent-50 border-accent-200">
        <h4 className="text-sm font-semibold text-accent-800 mb-2">🤖 AI Assist</h4>
        <div className="flex gap-2 flex-wrap">
          <button className="text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
            Generate 5 Whys from problem
          </button>
          <button className="text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
            Populate Ishikawa from SWOT/PESTEL
          </button>
          <button className="text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
            Convert root causes → hypothesis tree
          </button>
        </div>
      </div>
    </div>
  );
}
