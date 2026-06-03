"use client";

import { useState } from "react";
import { WorkflowStepper } from "@/components/layout/WorkflowStepper";
import { ScopingPanel } from "@/components/engagement/ScopingPanel";
import { SwotCanvas } from "@/components/frameworks/SwotCanvas";
import { PestelCanvas } from "@/components/frameworks/PestelCanvas";
import { HypothesisTreeView } from "@/components/engagement/HypothesisTreeView";

/**
 * Engagement Detail Page — The main cockpit view.
 * FR-20: 3-panel layout pattern per framework module.
 * §5: McKinsey-mirrored state machine drives the workflow.
 */

type Stage =
  | "scoping"
  | "frameworks"
  | "hypothesis"
  | "analysis"
  | "synthesis"
  | "communication"
  | "export";

type FrameworkTab = "swot" | "pestel" | "porter5" | "bcg" | "ansoff" | "sipoc" | "value_chain" | "root_cause";

export default function EngagementPage() {
  const [currentStage, setCurrentStage] = useState<Stage>("scoping");
  const [activeFramework, setActiveFramework] = useState<FrameworkTab>("swot");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-navy-900 text-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-lg font-light tracking-tight opacity-80 hover:opacity-100">
              McKinsead
            </a>
            <span className="text-navy-400">|</span>
            <span className="text-sm">Strategy Engagement</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-navy-300">v0 · Last saved: just now</span>
            <button className="btn-secondary text-xs !bg-navy-800 !text-white !border-navy-600">
              ↗ Export
            </button>
          </div>
        </div>
      </header>

      {/* Workflow Stepper */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <WorkflowStepper
          currentStage={currentStage}
          onStageClick={(stage) => setCurrentStage(stage as Stage)}
        />
      </div>

      {/* Stage Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {currentStage === "scoping" && (
          <div>
            <StageHeader
              title="1. Scope"
              description="Frame the problem using SCQA (Situation–Complication–Question–Answer). Define success criteria and constraints."
            />
            <ScopingPanel />
          </div>
        )}

        {currentStage === "frameworks" && (
          <div>
            <StageHeader
              title="2. Diagnose"
              description="Run strategy frameworks to build a comprehensive picture of the external environment and internal capabilities."
            />

            {/* Framework tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
              {[
                { id: "swot" as const, label: "SWOT", m0: true },
                { id: "pestel" as const, label: "PESTEL", m0: true },
                { id: "porter5" as const, label: "Porter's 5", m0: false },
                { id: "bcg" as const, label: "BCG Matrix", m0: false },
                { id: "ansoff" as const, label: "Ansoff", m0: false },
                { id: "sipoc" as const, label: "SIPOC", m0: false },
                { id: "value_chain" as const, label: "Value Chain", m0: false },
                { id: "root_cause" as const, label: "Root Cause", m0: false },
              ].map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setActiveFramework(fw.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      activeFramework === fw.id
                        ? "bg-accent-600 text-white"
                        : fw.m0
                        ? "bg-white text-navy-700 hover:bg-navy-50 border border-navy-200"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  disabled={!fw.m0}
                >
                  {fw.label}
                  {!fw.m0 && (
                    <span className="text-xs ml-1 opacity-50">(M1)</span>
                  )}
                </button>
              ))}
            </div>

            {/* Active framework canvas */}
            {activeFramework === "swot" && <SwotCanvas />}
            {activeFramework === "pestel" && <PestelCanvas />}
            {!["swot", "pestel"].includes(activeFramework) && (
              <div className="card text-center py-16 text-navy-300">
                <p className="text-xl mb-2">Coming in M1</p>
                <p className="text-sm">
                  This framework will be available in the next milestone.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStage === "hypothesis" && (
          <div>
            <StageHeader
              title="3. Hypothesize"
              description="Build a MECE hypothesis tree. Each leaf must be falsifiable — name the data and the test that would refute it."
            />
            <HypothesisTreeView />
          </div>
        )}

        {currentStage === "analysis" && (
          <div>
            <StageHeader
              title="4. Analyze"
              description="Test each leaf hypothesis with the right method: descriptive, comparative, causal, forecasting, or qualitative."
            />
            <div className="card text-center py-16 text-navy-300">
              <p className="text-xl mb-2">🔬 Analysis Engine</p>
              <p className="text-sm">
                Full analysis agent coming in M1. For M0, test hypotheses
                manually and record results.
              </p>
            </div>
          </div>
        )}

        {currentStage === "synthesis" && (
          <div>
            <StageHeader
              title="5. Synthesize"
              description="Roll findings into a Pyramid Principle narrative: one governing thought, 3-5 MECE key lines."
            />
            <div className="card text-center py-16 text-navy-300">
              <p className="text-xl mb-2">🧩 Pyramid Builder</p>
              <p className="text-sm">
                Structure your findings top-down (answer first) following the
                Minto Pyramid Principle.
              </p>
            </div>
          </div>
        )}

        {currentStage === "communication" && (
          <div>
            <StageHeader
              title="6. Communicate"
              description="Build the slide deck. Every slide: action title (≤14 words), one message, footer sources."
            />
            <div className="card text-center py-16 text-navy-300">
              <p className="text-xl mb-2">📋 Slide Builder</p>
              <p className="text-sm">
                HTML slide deck generator with consulting-style formatting.
              </p>
            </div>
          </div>
        )}

        {currentStage === "export" && (
          <div>
            <StageHeader
              title="7. Export"
              description="Export your strategy deck as HTML, PPTX, or PDF. Share with stakeholders."
            />
            <div className="card text-center py-16 text-navy-300">
              <p className="text-xl mb-2">📤 Export Center</p>
              <div className="flex justify-center gap-4 mt-4">
                <button className="btn-primary">Download HTML</button>
                <button className="btn-secondary" disabled>
                  PPTX (M1)
                </button>
                <button className="btn-secondary" disabled>
                  PDF (M1)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-light text-navy-900">{title}</h2>
      <p className="text-sm text-navy-500 mt-1">{description}</p>
    </div>
  );
}
