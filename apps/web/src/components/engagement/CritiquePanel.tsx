"use client";

import { useState } from "react";

/**
 * Critique Panel (§3.1).
 *
 * CritiqueAgent runs after every other agent as a mandatory quality linter.
 * Checks: MECE, sourcing, so-what, bias, consistency, completeness, actionability.
 * Blocking issues must be resolved before gate passage.
 */

type CheckType = "mece" | "sourcing" | "so_what" | "bias" | "consistency" | "completeness" | "actionability";
type Severity = "blocking" | "warning" | "info";

interface Annotation {
  id: string;
  check: CheckType;
  severity: Severity;
  message: string;
  location: string;
  resolved: boolean;
}

interface CritiqueRun {
  id: string;
  target: string;
  timestamp: string;
  pass: boolean;
  annotations: Annotation[];
}

const CHECK_META: Record<CheckType, { label: string; icon: string; description: string }> = {
  mece: { label: "MECE", icon: "🔀", description: "Mutually exclusive, collectively exhaustive" },
  sourcing: { label: "Sourcing", icon: "📎", description: "Claims must have citations" },
  so_what: { label: "So-What", icon: "💡", description: "Every finding needs a so-what" },
  bias: { label: "Bias", icon: "⚖️", description: "Check for confirmation bias, anchoring" },
  consistency: { label: "Consistency", icon: "🔗", description: "No contradictions across artifacts" },
  completeness: { label: "Completeness", icon: "✅", description: "All required fields populated" },
  actionability: { label: "Actionability", icon: "🎯", description: "Recommendations are concrete" },
};

const SEVERITY_STYLES = {
  blocking: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
};

export function CritiquePanel() {
  const [runs, setRuns] = useState<CritiqueRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState("all");

  const targets = [
    { value: "all", label: "All Artifacts" },
    { value: "scoping", label: "Scoping (SCQA)" },
    { value: "swot", label: "SWOT Analysis" },
    { value: "pestel", label: "PESTEL Analysis" },
    { value: "hypothesis", label: "Hypothesis Tree" },
    { value: "analyses", label: "Analysis Results" },
    { value: "pyramid", label: "Pyramid Storyline" },
    { value: "deck", label: "Slide Deck" },
  ];

  const runCritique = () => {
    setIsRunning(true);
    // Simulate critique run
    setTimeout(() => {
      const annotations: Annotation[] = [
        {
          id: crypto.randomUUID(),
          check: "mece",
          severity: "warning",
          message: "SWOT opportunities and threats overlap on 'regulatory changes' — assign to one or split",
          location: "swot.opportunities[2], swot.threats[1]",
          resolved: false,
        },
        {
          id: crypto.randomUUID(),
          check: "sourcing",
          severity: "blocking",
          message: "Market size claim ($4.2B) has no citation — add source",
          location: "scoping.situation",
          resolved: false,
        },
        {
          id: crypto.randomUUID(),
          check: "so_what",
          severity: "warning",
          message: "PESTEL political signal lacks so-what — what action does this imply?",
          location: "pestel.signals[0]",
          resolved: false,
        },
        {
          id: crypto.randomUUID(),
          check: "completeness",
          severity: "info",
          message: "Porter 5 analysis not yet started — consider adding before synthesis",
          location: "frameworks.porter5",
          resolved: false,
        },
      ];

      const newRun: CritiqueRun = {
        id: crypto.randomUUID(),
        target: selectedTarget,
        timestamp: new Date().toISOString(),
        pass: !annotations.some((a) => a.severity === "blocking"),
        annotations,
      };

      setRuns((prev) => [newRun, ...prev]);
      setIsRunning(false);
    }, 2500);
  };

  const resolveAnnotation = (runId: string, annotationId: string) => {
    setRuns((prev) =>
      prev.map((run) =>
        run.id === runId
          ? {
              ...run,
              annotations: run.annotations.map((a) =>
                a.id === annotationId ? { ...a, resolved: true } : a
              ),
              pass: !run.annotations
                .map((a) => (a.id === annotationId ? { ...a, resolved: true } : a))
                .some((a) => a.severity === "blocking" && !a.resolved),
            }
          : run
      )
    );
  };

  const latestRun = runs[0];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Run critique */}
      <div className="col-span-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-navy-700 mb-3">Run Critique</h3>

          <div className="mb-4">
            <label className="block text-xs text-navy-600 mb-1">Target</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="input-field text-sm"
            >
              {targets.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={runCritique}
            disabled={isRunning}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
              isRunning
                ? "bg-gray-300 text-gray-500 cursor-wait"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isRunning ? "🔍 Running checks..." : "🔍 Run Critique"}
          </button>

          {/* Check types */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-navy-600 mb-2">Quality Checks</h4>
            <div className="space-y-1.5">
              {(Object.keys(CHECK_META) as CheckType[]).map((check) => (
                <div key={check} className="flex items-center gap-2 text-xs text-navy-600">
                  <span>{CHECK_META[check].icon}</span>
                  <span className="font-medium">{CHECK_META[check].label}</span>
                  <span className="text-navy-300">—</span>
                  <span className="text-navy-400">{CHECK_META[check].description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Run history */}
        {runs.length > 0 && (
          <div className="card mt-4">
            <h4 className="text-sm font-semibold text-navy-700 mb-2">History</h4>
            <div className="space-y-1">
              {runs.map((run, idx) => (
                <div
                  key={run.id}
                  className={`flex items-center justify-between text-xs p-2 rounded cursor-pointer ${
                    idx === 0 ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{run.pass ? "✅" : "❌"}</span>
                    <span className="text-navy-600">{run.target}</span>
                  </div>
                  <span className="text-navy-400">
                    {new Date(run.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Annotations */}
      <div className="col-span-8">
        {latestRun ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{latestRun.pass ? "✅" : "❌"}</span>
                <div>
                  <h3 className="text-lg font-semibold text-navy-900">
                    {latestRun.pass ? "Passed" : "Issues Found"}
                  </h3>
                  <p className="text-xs text-navy-500">
                    {latestRun.annotations.filter((a) => a.severity === "blocking" && !a.resolved).length} blocking ·{" "}
                    {latestRun.annotations.filter((a) => a.severity === "warning" && !a.resolved).length} warnings ·{" "}
                    {latestRun.annotations.filter((a) => a.severity === "info").length} info
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {latestRun.annotations.map((ann) => {
                const styles = SEVERITY_STYLES[ann.severity];
                return (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-lg border ${styles.bg} ${styles.border} ${ann.resolved ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${styles.badge}`}>
                            {ann.severity.toUpperCase()}
                          </span>
                          <span className="text-xs font-medium text-navy-700">
                            {CHECK_META[ann.check].icon} {CHECK_META[ann.check].label}
                          </span>
                        </div>
                        <p className={`text-sm ${styles.text}`}>{ann.message}</p>
                        <p className="text-xs text-navy-400 mt-1 font-mono">{ann.location}</p>
                      </div>
                      {!ann.resolved && (
                        <button
                          onClick={() => resolveAnnotation(latestRun.id, ann.id)}
                          className="text-xs px-3 py-1 rounded bg-white border border-gray-300 text-navy-600 hover:bg-gray-50 ml-3"
                        >
                          Resolve
                        </button>
                      )}
                      {ann.resolved && (
                        <span className="text-xs text-emerald-600 ml-3">✓ Resolved</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card text-center py-16 text-navy-300">
            <p className="text-xl mb-2">🔍 No critique results yet</p>
            <p className="text-sm">Run the CritiqueAgent to check your work for quality issues</p>
          </div>
        )}
      </div>
    </div>
  );
}
