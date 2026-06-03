"use client";

import { useState } from "react";

/**
 * Porter's Five Forces Canvas (§7.3).
 *
 * For each force: qualitative narrative + 1-5 intensity score + 2-3 quantitative anchors.
 * Visual: radar/pentagon showing all 5 forces + per-force detail cards.
 */

type ForceKey = "rivalry" | "new_entrants" | "substitutes" | "supplier_power" | "buyer_power";

interface QuantAnchor {
  metric: string;
  value: string;
}

interface ForceData {
  narrative: string;
  intensity: number;
  quantitative_anchors: QuantAnchor[];
}

const FORCE_META: Record<ForceKey, { label: string; icon: string; description: string }> = {
  rivalry: {
    label: "Competitive Rivalry",
    icon: "⚔️",
    description: "Intensity of competition among existing firms",
  },
  new_entrants: {
    label: "Threat of New Entrants",
    icon: "🚪",
    description: "Barriers to entry and likelihood of new competitors",
  },
  substitutes: {
    label: "Threat of Substitutes",
    icon: "🔄",
    description: "Availability and attractiveness of alternative products/services",
  },
  supplier_power: {
    label: "Supplier Power",
    icon: "🏭",
    description: "Bargaining power of upstream suppliers",
  },
  buyer_power: {
    label: "Buyer Power",
    icon: "🛒",
    description: "Bargaining power of downstream customers",
  },
};

const INTENSITY_LABELS = ["", "Very Low", "Low", "Moderate", "High", "Very High"];
const INTENSITY_COLORS = ["", "#10b981", "#84cc16", "#eab308", "#f97316", "#ef4444"];

const emptyForce = (): ForceData => ({
  narrative: "",
  intensity: 3,
  quantitative_anchors: [],
});

export function Porter5Canvas() {
  const [forces, setForces] = useState<Record<ForceKey, ForceData>>({
    rivalry: emptyForce(),
    new_entrants: emptyForce(),
    substitutes: emptyForce(),
    supplier_power: emptyForce(),
    buyer_power: emptyForce(),
  });
  const [activeForce, setActiveForce] = useState<ForceKey>("rivalry");

  const updateForce = (key: ForceKey, updates: Partial<ForceData>) => {
    setForces((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const addAnchor = (key: ForceKey) => {
    setForces((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantitative_anchors: [
          ...prev[key].quantitative_anchors,
          { metric: "", value: "" },
        ],
      },
    }));
  };

  const avgIntensity =
    Object.values(forces).reduce((sum, f) => sum + f.intensity, 0) / 5;

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Force pentagon overview */}
      <div className="col-span-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-navy-700 mb-4">Industry Attractiveness</h3>

          {/* Force list */}
          <div className="space-y-2">
            {(Object.keys(FORCE_META) as ForceKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveForce(key)}
                className={`w-full text-left px-3 py-3 rounded-lg border transition-all ${
                  activeForce === key
                    ? "border-accent-600 bg-accent-50"
                    : "border-gray-200 hover:border-navy-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{FORCE_META[key].icon}</span>
                    <span className="text-sm font-medium text-navy-800">
                      {FORCE_META[key].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: INTENSITY_COLORS[forces[key].intensity] }}
                    />
                    <span className="text-xs text-navy-500">
                      {INTENSITY_LABELS[forces[key].intensity]}
                    </span>
                  </div>
                </div>
                {/* Intensity bar */}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(forces[key].intensity / 5) * 100}%`,
                      backgroundColor: INTENSITY_COLORS[forces[key].intensity],
                    }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Overall score */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-navy-600">Overall Intensity</span>
              <span
                className="text-lg font-bold"
                style={{ color: INTENSITY_COLORS[Math.round(avgIntensity)] }}
              >
                {avgIntensity.toFixed(1)} / 5
              </span>
            </div>
            <p className="text-xs text-navy-400 mt-1">
              {avgIntensity <= 2
                ? "Attractive industry — favorable competitive dynamics"
                : avgIntensity <= 3.5
                ? "Moderate — selective opportunities exist"
                : "Challenging — intense competitive pressure"}
            </p>
          </div>
        </div>

        {/* AI Panel */}
        <div className="card mt-4 bg-accent-50 border-accent-200">
          <h4 className="text-sm font-semibold text-accent-800 mb-2">🤖 AI Assist</h4>
          <div className="space-y-2">
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Auto-assess from company profile
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Pull competitor data from filings
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Challenge intensity ratings
            </button>
          </div>
        </div>
      </div>

      {/* Right: Active force detail */}
      <div className="col-span-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{FORCE_META[activeForce].icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-navy-900">
                {FORCE_META[activeForce].label}
              </h3>
              <p className="text-sm text-navy-500">
                {FORCE_META[activeForce].description}
              </p>
            </div>
          </div>

          {/* Intensity slider */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Intensity Rating
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                value={forces[activeForce].intensity}
                onChange={(e) =>
                  updateForce(activeForce, { intensity: parseInt(e.target.value) })
                }
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981, #eab308, #ef4444)`,
                }}
              />
              <span
                className="text-lg font-bold w-24 text-center px-3 py-1 rounded"
                style={{
                  backgroundColor: INTENSITY_COLORS[forces[activeForce].intensity] + "20",
                  color: INTENSITY_COLORS[forces[activeForce].intensity],
                }}
              >
                {INTENSITY_LABELS[forces[activeForce].intensity]}
              </span>
            </div>
          </div>

          {/* Narrative */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Qualitative Narrative
            </label>
            <textarea
              value={forces[activeForce].narrative}
              onChange={(e) => updateForce(activeForce, { narrative: e.target.value })}
              rows={5}
              className="input-field"
              placeholder={`Describe the ${FORCE_META[activeForce].label.toLowerCase()} dynamics in this industry...`}
            />
          </div>

          {/* Quantitative Anchors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy-700">
                Quantitative Anchors (2-3 recommended)
              </label>
              <button
                onClick={() => addAnchor(activeForce)}
                className="text-xs text-accent-600 hover:text-accent-800"
              >
                + Add Anchor
              </button>
            </div>
            <div className="space-y-2">
              {forces[activeForce].quantitative_anchors.map((anchor, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={anchor.metric}
                    onChange={(e) => {
                      const anchors = [...forces[activeForce].quantitative_anchors];
                      anchors[idx] = { ...anchor, metric: e.target.value };
                      updateForce(activeForce, { quantitative_anchors: anchors });
                    }}
                    className="input-field flex-1"
                    placeholder="Metric (e.g., HHI, capex intensity)"
                  />
                  <input
                    type="text"
                    value={anchor.value}
                    onChange={(e) => {
                      const anchors = [...forces[activeForce].quantitative_anchors];
                      anchors[idx] = { ...anchor, value: e.target.value };
                      updateForce(activeForce, { quantitative_anchors: anchors });
                    }}
                    className="input-field w-48"
                    placeholder="Value (e.g., 0.18)"
                  />
                  <button
                    onClick={() => {
                      const anchors = forces[activeForce].quantitative_anchors.filter(
                        (_, i) => i !== idx
                      );
                      updateForce(activeForce, { quantitative_anchors: anchors });
                    }}
                    className="text-red-400 hover:text-red-600 px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              {forces[activeForce].quantitative_anchors.length === 0 && (
                <p className="text-xs text-navy-400 italic py-2">
                  Add quantitative anchors to support the intensity rating (e.g., HHI for rivalry,
                  capex/revenue for barriers to entry)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
