"use client";

import { useState } from "react";

/**
 * Value Chain Canvas — Porter (§7.7).
 *
 * Primary: inbound logistics, operations, outbound logistics, marketing & sales, service.
 * Support: firm infrastructure, HR, technology, procurement.
 * Each tagged with cost share %, differentiation contribution, margin gap vs benchmark.
 */

interface Activity {
  name: string;
  description: string;
  cost_share_pct: number;
  differentiation_contribution: "high" | "medium" | "low";
  margin_gap_vs_benchmark: number; // negative = below, positive = above benchmark
}

const PRIMARY_KEYS = [
  "inbound_logistics",
  "operations",
  "outbound_logistics",
  "marketing_sales",
  "service",
] as const;

const SUPPORT_KEYS = [
  "firm_infrastructure",
  "hr_management",
  "technology_development",
  "procurement",
] as const;

const PRIMARY_META: Record<string, { label: string; icon: string }> = {
  inbound_logistics: { label: "Inbound Logistics", icon: "📦" },
  operations: { label: "Operations", icon: "🏭" },
  outbound_logistics: { label: "Outbound Logistics", icon: "🚚" },
  marketing_sales: { label: "Marketing & Sales", icon: "📢" },
  service: { label: "Service", icon: "🛠️" },
};

const SUPPORT_META: Record<string, { label: string; icon: string }> = {
  firm_infrastructure: { label: "Firm Infrastructure", icon: "🏢" },
  hr_management: { label: "HR Management", icon: "👥" },
  technology_development: { label: "Technology Dev.", icon: "💻" },
  procurement: { label: "Procurement", icon: "🛒" },
};

const DIFF_COLORS = {
  high: { bg: "#dcfce7", text: "#166534", label: "High" },
  medium: { bg: "#fef9c3", text: "#854d0e", label: "Medium" },
  low: { bg: "#fee2e2", text: "#991b1b", label: "Low" },
};

const defaultActivity = (name: string): Activity => ({
  name,
  description: "",
  cost_share_pct: 0,
  differentiation_contribution: "medium",
  margin_gap_vs_benchmark: 0,
});

export function ValueChainCanvas() {
  const [primary, setPrimary] = useState<Record<string, Activity>>(() =>
    Object.fromEntries(PRIMARY_KEYS.map((k) => [k, defaultActivity(PRIMARY_META[k].label)]))
  );
  const [support, setSupport] = useState<Record<string, Activity>>(() =>
    Object.fromEntries(SUPPORT_KEYS.map((k) => [k, defaultActivity(SUPPORT_META[k].label)]))
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"primary" | "support">("primary");

  const allActivities = { ...primary, ...support };
  const activeActivity = activeKey ? allActivities[activeKey] : null;

  const updateActivity = (key: string, updates: Partial<Activity>) => {
    if (key in primary) {
      setPrimary((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
    } else {
      setSupport((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
    }
  };

  const totalCostPrimary = Object.values(primary).reduce((s, a) => s + a.cost_share_pct, 0);
  const totalCostSupport = Object.values(support).reduce((s, a) => s + a.cost_share_pct, 0);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Value Chain visualization */}
      <div className="col-span-7">
        <div className="card">
          <h3 className="text-sm font-semibold text-navy-700 mb-4">Porter Value Chain</h3>

          {/* Support activities (top band) */}
          <div className="mb-2">
            <div className="text-xs font-semibold text-navy-500 mb-1">Support Activities</div>
            <div className="grid grid-cols-4 gap-1">
              {SUPPORT_KEYS.map((key) => {
                const act = support[key];
                const diff = DIFF_COLORS[act.differentiation_contribution];
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveKey(key); setActiveType("support"); }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      activeKey === key ? "ring-2 ring-accent-500 shadow-md" : "hover:shadow"
                    }`}
                    style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                  >
                    <div className="text-xs">
                      <span>{SUPPORT_META[key].icon}</span>{" "}
                      <span className="font-semibold text-navy-700">{SUPPORT_META[key].label}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: diff.bg, color: diff.text }}>
                        {diff.label}
                      </span>
                      {act.cost_share_pct > 0 && (
                        <span className="text-xs text-navy-400">{act.cost_share_pct}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary activities (main arrow) */}
          <div>
            <div className="text-xs font-semibold text-navy-500 mb-1">Primary Activities</div>
            <div className="flex gap-0 relative">
              {PRIMARY_KEYS.map((key, idx) => {
                const act = primary[key];
                const diff = DIFF_COLORS[act.differentiation_contribution];
                const isLast = idx === PRIMARY_KEYS.length - 1;

                return (
                  <button
                    key={key}
                    onClick={() => { setActiveKey(key); setActiveType("primary"); }}
                    className={`flex-1 p-4 border text-left transition-all min-h-[120px] ${
                      isLast ? "rounded-r-xl" : ""
                    } ${idx === 0 ? "rounded-l-lg" : ""} ${
                      activeKey === key ? "ring-2 ring-accent-500 shadow-md z-10" : "hover:shadow"
                    }`}
                    style={{
                      backgroundColor: act.margin_gap_vs_benchmark >= 0 ? "#f0fdf4" : "#fef2f2",
                      borderColor: "#e2e8f0",
                      clipPath: isLast
                        ? undefined
                        : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                    }}
                  >
                    <div className="text-xs">
                      <span>{PRIMARY_META[key].icon}</span>{" "}
                      <span className="font-semibold text-navy-700">{PRIMARY_META[key].label}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: diff.bg, color: diff.text }}>
                          {diff.label}
                        </span>
                      </div>
                      {act.cost_share_pct > 0 && (
                        <div className="text-xs text-navy-400">{act.cost_share_pct}% cost</div>
                      )}
                      {act.margin_gap_vs_benchmark !== 0 && (
                        <div className={`text-xs font-medium ${act.margin_gap_vs_benchmark >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {act.margin_gap_vs_benchmark > 0 ? "+" : ""}{act.margin_gap_vs_benchmark}pp vs bench
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Margin arrow */}
              <div className="flex items-center justify-center pl-2">
                <div className="bg-navy-800 text-white px-3 py-6 rounded-r-xl text-xs font-bold" style={{ writingMode: "vertical-lr" }}>
                  MARGIN
                </div>
              </div>
            </div>
          </div>

          {/* Cost summary */}
          <div className="mt-4 flex gap-4 text-xs text-navy-500">
            <span>Primary cost: {totalCostPrimary}%</span>
            <span>Support cost: {totalCostSupport}%</span>
            <span className={totalCostPrimary + totalCostSupport > 100 ? "text-red-500 font-medium" : ""}>
              Total: {totalCostPrimary + totalCostSupport}%
            </span>
          </div>
        </div>
      </div>

      {/* Right: Activity detail editor */}
      <div className="col-span-5">
        {activeActivity && activeKey ? (
          <div className="card">
            <h3 className="text-lg font-semibold text-navy-900 mb-1">{activeActivity.name}</h3>
            <p className="text-xs text-navy-400 mb-4">{activeType === "primary" ? "Primary" : "Support"} Activity</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Description</label>
                <textarea
                  value={activeActivity.description}
                  onChange={(e) => updateActivity(activeKey, { description: e.target.value })}
                  rows={3}
                  className="input-field"
                  placeholder="Describe this activity and its role in the value chain..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Cost Share (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={activeActivity.cost_share_pct}
                  onChange={(e) => updateActivity(activeKey, { cost_share_pct: parseInt(e.target.value) || 0 })}
                  className="input-field w-32"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Differentiation Contribution</label>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => updateActivity(activeKey, { differentiation_contribution: level })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeActivity.differentiation_contribution === level
                          ? "ring-2 ring-offset-1"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        backgroundColor: DIFF_COLORS[level].bg,
                        color: DIFF_COLORS[level].text,
                        ringColor: DIFF_COLORS[level].text,
                      }}
                    >
                      {DIFF_COLORS[level].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Margin Gap vs Benchmark (pp)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    value={activeActivity.margin_gap_vs_benchmark}
                    onChange={(e) => updateActivity(activeKey, { margin_gap_vs_benchmark: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className={`text-sm font-bold w-16 text-center ${
                    activeActivity.margin_gap_vs_benchmark >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {activeActivity.margin_gap_vs_benchmark > 0 ? "+" : ""}
                    {activeActivity.margin_gap_vs_benchmark}pp
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12 text-navy-300">
            <p className="text-lg mb-2">Select an activity</p>
            <p className="text-sm">Click any activity in the value chain to edit its details</p>
          </div>
        )}

        {/* AI Panel */}
        <div className="card mt-4 bg-accent-50 border-accent-200">
          <h4 className="text-sm font-semibold text-accent-800 mb-2">🤖 AI Assist</h4>
          <div className="space-y-2">
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Auto-populate from P&L / cost data
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Benchmark against industry peers
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Identify margin improvement opportunities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
