"use client";

import { useState } from "react";

/**
 * BCG Matrix Canvas (§7.4).
 *
 * Each BU/SKU plotted by market growth (Y) × relative market share (X).
 * Quadrants: Stars, Cash Cows, Question Marks, Dogs.
 * Recommended action per quadrant shown alongside.
 */

interface BcgItem {
  id: string;
  name: string;
  relative_market_share: number; // 0-3 (1 = parity)
  market_growth_rate: number; // -10 to 30 (%)
  revenue: number;
  quadrant: "star" | "cash_cow" | "question_mark" | "dog";
  recommended_action: string;
}

const QUADRANT_META = {
  star: { label: "⭐ Stars", color: "#8b5cf6", bg: "#f5f3ff", action: "Invest / Grow" },
  cash_cow: { label: "🐄 Cash Cows", color: "#059669", bg: "#ecfdf5", action: "Harvest / Maintain" },
  question_mark: { label: "❓ Question Marks", color: "#d97706", bg: "#fffbeb", action: "Invest or Divest" },
  dog: { label: "🐕 Dogs", color: "#dc2626", bg: "#fef2f2", action: "Divest / Liquidate" },
};

function classifyQuadrant(share: number, growth: number): BcgItem["quadrant"] {
  if (share >= 1 && growth >= 10) return "star";
  if (share >= 1 && growth < 10) return "cash_cow";
  if (share < 1 && growth >= 10) return "question_mark";
  return "dog";
}

export function BcgCanvas() {
  const [items, setItems] = useState<BcgItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    relative_market_share: 1.0,
    market_growth_rate: 10,
    revenue: 100,
    recommended_action: "",
  });

  const addItem = () => {
    const quadrant = classifyQuadrant(formData.relative_market_share, formData.market_growth_rate);
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: formData.name,
        relative_market_share: formData.relative_market_share,
        market_growth_rate: formData.market_growth_rate,
        revenue: formData.revenue,
        quadrant,
        recommended_action: formData.recommended_action || QUADRANT_META[quadrant].action,
      },
    ]);
    setFormData({ name: "", relative_market_share: 1.0, market_growth_rate: 10, revenue: 100, recommended_action: "" });
    setShowAddForm(false);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: BCG Matrix visualization */}
      <div className="col-span-7">
        <div className="card">
          <h3 className="text-sm font-semibold text-navy-700 mb-4">BCG Growth-Share Matrix</h3>

          {/* Matrix grid */}
          <div className="relative border-2 border-navy-200 rounded-lg overflow-hidden" style={{ height: 400 }}>
            {/* Quadrant labels */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="flex items-start justify-start p-3 border-r border-b border-navy-100" style={{ backgroundColor: QUADRANT_META.question_mark.bg + "80" }}>
                <span className="text-xs font-medium text-amber-700 opacity-60">❓ Question Marks</span>
              </div>
              <div className="flex items-start justify-end p-3 border-b border-navy-100" style={{ backgroundColor: QUADRANT_META.star.bg + "80" }}>
                <span className="text-xs font-medium text-purple-700 opacity-60">⭐ Stars</span>
              </div>
              <div className="flex items-end justify-start p-3 border-r border-navy-100" style={{ backgroundColor: QUADRANT_META.dog.bg + "80" }}>
                <span className="text-xs font-medium text-red-700 opacity-60">🐕 Dogs</span>
              </div>
              <div className="flex items-end justify-end p-3" style={{ backgroundColor: QUADRANT_META.cash_cow.bg + "80" }}>
                <span className="text-xs font-medium text-emerald-700 opacity-60">🐄 Cash Cows</span>
              </div>
            </div>

            {/* Axis labels */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 -rotate-90 text-xs text-navy-400 font-medium whitespace-nowrap">
              Market Growth Rate (%)
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-xs text-navy-400 font-medium">
              Relative Market Share →
            </div>

            {/* Plotted items */}
            {items.map((item) => {
              // Map share (0-3) to x position (0-100%), inverted so high share is right
              const x = Math.min(95, Math.max(5, (item.relative_market_share / 3) * 100));
              // Map growth (-10 to 30) to y position (100-0%)
              const y = Math.min(95, Math.max(5, 100 - ((item.market_growth_rate + 10) / 40) * 100));
              // Bubble size based on revenue
              const size = Math.max(20, Math.min(60, (item.revenue / (totalRevenue || 1)) * 120 + 20));

              return (
                <div
                  key={item.id}
                  className="absolute rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer transition-transform hover:scale-110"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: size,
                    height: size,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: QUADRANT_META[item.quadrant].color,
                    border: "2px solid white",
                  }}
                  title={`${item.name}\nShare: ${item.relative_market_share}x\nGrowth: ${item.market_growth_rate}%\nRevenue: $${item.revenue}M`}
                >
                  {item.name.slice(0, 3)}
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-navy-300">
                <p className="text-sm">Add business units or products to plot</p>
              </div>
            )}
          </div>

          <p className="text-xs text-navy-400 mt-2 text-center">
            Bubble size = relative revenue · X = relative market share · Y = market growth rate
          </p>
        </div>
      </div>

      {/* Right: Items list + add form */}
      <div className="col-span-5">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy-700">Business Units / Products</h3>
            <button onClick={() => setShowAddForm(true)} className="btn-primary text-xs !py-1.5">
              + Add
            </button>
          </div>

          {showAddForm && (
            <div className="mb-4 p-4 bg-navy-50 rounded-lg border border-navy-200">
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Name (e.g., EU Retail)"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-navy-600">Rel. Share</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="3"
                      value={formData.relative_market_share}
                      onChange={(e) => setFormData({ ...formData, relative_market_share: parseFloat(e.target.value) || 0 })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-navy-600">Growth %</label>
                    <input
                      type="number"
                      step="1"
                      min="-10"
                      max="30"
                      value={formData.market_growth_rate}
                      onChange={(e) => setFormData({ ...formData, market_growth_rate: parseInt(e.target.value) || 0 })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-navy-600">Revenue ($M)</label>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: parseInt(e.target.value) || 0 })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addItem} className="btn-primary text-xs flex-1" disabled={!formData.name}>
                    Add to Matrix
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Items by quadrant */}
          {(["star", "cash_cow", "question_mark", "dog"] as const).map((q) => {
            const qItems = items.filter((i) => i.quadrant === q);
            if (qItems.length === 0) return null;
            return (
              <div key={q} className="mb-4">
                <h4 className="text-xs font-semibold mb-1" style={{ color: QUADRANT_META[q].color }}>
                  {QUADRANT_META[q].label} — {QUADRANT_META[q].action}
                </h4>
                <div className="space-y-1">
                  {qItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: QUADRANT_META[q].bg }}
                    >
                      <div>
                        <span className="font-medium text-navy-800">{item.name}</span>
                        <span className="text-xs text-navy-500 ml-2">
                          Share: {item.relative_market_share}x · Growth: {item.market_growth_rate}% · ${item.revenue}M
                        </span>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {items.length === 0 && !showAddForm && (
            <p className="text-sm text-navy-400 text-center py-8">
              Add business units or products to analyze portfolio positioning
            </p>
          )}
        </div>

        {/* AI Panel */}
        <div className="card mt-4 bg-accent-50 border-accent-200">
          <h4 className="text-sm font-semibold text-accent-800 mb-2">🤖 AI Assist</h4>
          <div className="space-y-2">
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Auto-populate from ERP data
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Recommend actions per quadrant
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Link to Ansoff growth strategies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
