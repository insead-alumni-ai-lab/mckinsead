"use client";

import { useState } from "react";

/**
 * Analysis Panel (§7.10 / Stage 4).
 *
 * Test each leaf hypothesis with the right method:
 * - Descriptive (segmentation, cohort)
 * - Comparative (benchmark, t-test, A/B)
 * - Causal (regression, diff-in-diff, instrumental var.)
 * - Forecasting (scenario, Monte Carlo)
 * - Qualitative (expert interview synthesis)
 *
 * Result: { method, inputs, output, so_what, confidence, limitations }
 */

interface HypothesisLeaf {
  id: string;
  claim: string;
  status: "untested" | "in_testing" | "supported" | "refuted" | "deprioritized";
}

interface AnalysisResult {
  id: string;
  hypothesis_id: string;
  method: string;
  inputs: string[];
  so_what: string;
  confidence: number;
  limitations: string[];
}

const METHODS = [
  { value: "descriptive", label: "Descriptive", icon: "📊", description: "Segmentation, cohort analysis, distributions" },
  { value: "comparative", label: "Comparative", icon: "⚖️", description: "Benchmarking, t-tests, A/B comparison" },
  { value: "causal", label: "Causal", icon: "🔗", description: "Regression, diff-in-diff, instrumental variables" },
  { value: "forecasting", label: "Forecasting", icon: "🔮", description: "Scenario analysis, Monte Carlo simulation" },
  { value: "qualitative", label: "Qualitative", icon: "💬", description: "Expert interviews, thematic synthesis" },
];

const STATUS_COLORS = {
  untested: { bg: "#f3f4f6", text: "#6b7280", label: "Untested" },
  in_testing: { bg: "#dbeafe", text: "#2563eb", label: "Testing" },
  supported: { bg: "#dcfce7", text: "#166534", label: "Supported" },
  refuted: { bg: "#fee2e2", text: "#991b1b", label: "Refuted" },
  deprioritized: { bg: "#f3f4f6", text: "#9ca3af", label: "Skipped" },
};

export function AnalysisPanel() {
  // Demo hypothesis leaves (in real app, pulled from hypothesis tree)
  const [hypotheses] = useState<HypothesisLeaf[]>([
    { id: "h1.1", claim: "EU market acquisition targets exist at <4x revenue", status: "untested" },
    { id: "h1.2", claim: "ACME's R&D advantage transfers to EU product requirements", status: "untested" },
    { id: "h2.1", claim: "Regulatory hurdles are manageable within 12-month timeline", status: "untested" },
    { id: "h2.2", claim: "Integration costs stay below $50M", status: "untested" },
  ]);

  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [activeHypothesis, setActiveHypothesis] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    method: "descriptive",
    inputs: "",
    so_what: "",
    confidence: 0.5,
    limitations: "",
  });

  const activeLeaf = hypotheses.find((h) => h.id === activeHypothesis);
  const activeAnalyses = analyses.filter((a) => a.hypothesis_id === activeHypothesis);

  const submitAnalysis = () => {
    if (!activeHypothesis || !formData.so_what.trim()) return;
    setAnalyses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        hypothesis_id: activeHypothesis,
        method: formData.method,
        inputs: formData.inputs.split(",").map((s) => s.trim()).filter(Boolean),
        so_what: formData.so_what,
        confidence: formData.confidence,
        limitations: formData.limitations.split(",").map((s) => s.trim()).filter(Boolean),
      },
    ]);
    setFormData({ method: "descriptive", inputs: "", so_what: "", confidence: 0.5, limitations: "" });
  };

  const testedCount = new Set(analyses.map((a) => a.hypothesis_id)).size;

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Hypothesis list */}
      <div className="col-span-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-navy-700 mb-3">Leaf Hypotheses</h3>
          <div className="text-xs text-navy-400 mb-3">
            {testedCount}/{hypotheses.length} tested ·{" "}
            {hypotheses.filter((h) => h.status === "untested").length} remaining
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-accent-600 rounded-full transition-all"
              style={{ width: `${(testedCount / hypotheses.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            {hypotheses.map((h) => {
              const hasAnalysis = analyses.some((a) => a.hypothesis_id === h.id);
              const status = hasAnalysis ? STATUS_COLORS.in_testing : STATUS_COLORS[h.status];

              return (
                <button
                  key={h.id}
                  onClick={() => setActiveHypothesis(h.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeHypothesis === h.id
                      ? "border-accent-600 bg-accent-50 ring-1 ring-accent-500"
                      : "border-gray-200 hover:border-navy-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-mono text-navy-400">{h.id}</span>
                      <p className="text-sm text-navy-800 mt-0.5">{h.claim}</p>
                    </div>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded ml-2 whitespace-nowrap"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {hasAnalysis ? `${analyses.filter((a) => a.hypothesis_id === h.id).length} tests` : status.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Analysis editor */}
      <div className="col-span-8">
        {activeLeaf ? (
          <>
            <div className="card mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-mono text-navy-400">{activeLeaf.id}</span>
                  <h3 className="text-lg font-semibold text-navy-900 mt-1">{activeLeaf.claim}</h3>
                </div>
              </div>

              {/* Method selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-navy-700 mb-2">Analysis Method</label>
                <div className="grid grid-cols-5 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setFormData({ ...formData, method: m.value })}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        formData.method === m.value
                          ? "border-accent-600 bg-accent-50 ring-1 ring-accent-500"
                          : "border-gray-200 hover:border-navy-300"
                      }`}
                    >
                      <div className="text-lg">{m.icon}</div>
                      <div className="text-xs font-medium text-navy-700 mt-1">{m.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-navy-400 mt-1">
                  {METHODS.find((m) => m.value === formData.method)?.description}
                </p>
              </div>

              {/* Inputs */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-navy-700 mb-1">Data Inputs</label>
                <input
                  type="text"
                  value={formData.inputs}
                  onChange={(e) => setFormData({ ...formData, inputs: e.target.value })}
                  className="input-field"
                  placeholder="Comma-separated: ERP revenue data, market research report, ..."
                />
              </div>

              {/* So-What (mandatory §2) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  So-What <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.so_what}
                  onChange={(e) => setFormData({ ...formData, so_what: e.target.value })}
                  rows={2}
                  className="input-field"
                  placeholder="The insight from this analysis — what does it mean for the hypothesis?"
                />
              </div>

              {/* Confidence + Limitations */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Confidence</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.confidence * 100}
                      onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) / 100 })}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold text-navy-700 w-12 text-center">
                      {(formData.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Limitations</label>
                  <input
                    type="text"
                    value={formData.limitations}
                    onChange={(e) => setFormData({ ...formData, limitations: e.target.value })}
                    className="input-field"
                    placeholder="Comma-separated limitations..."
                  />
                </div>
              </div>

              <button onClick={submitAnalysis} className="btn-primary" disabled={!formData.so_what.trim()}>
                Submit Analysis
              </button>
            </div>

            {/* Existing analyses for this hypothesis */}
            {activeAnalyses.length > 0 && (
              <div className="card">
                <h4 className="text-sm font-semibold text-navy-700 mb-3">
                  Prior Analyses ({activeAnalyses.length})
                </h4>
                <div className="space-y-3">
                  {activeAnalyses.map((a) => (
                    <div key={a.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{METHODS.find((m) => m.value === a.method)?.icon}</span>
                        <span className="text-sm font-medium text-navy-700">
                          {METHODS.find((m) => m.value === a.method)?.label}
                        </span>
                        <span className="text-xs text-navy-400">·</span>
                        <span className="text-xs text-navy-400">
                          Confidence: {(a.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-navy-800 font-medium">So-what: {a.so_what}</p>
                      {a.limitations.length > 0 && (
                        <p className="text-xs text-navy-400 mt-1">
                          Limitations: {a.limitations.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card text-center py-16 text-navy-300">
            <p className="text-xl mb-2">🔬 Select a hypothesis</p>
            <p className="text-sm">Choose a leaf hypothesis from the left to design and run analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
