"use client";

import { useState } from "react";
import { WorkflowStepper } from "@/components/layout/WorkflowStepper";
import { ScopingPanel } from "@/components/engagement/ScopingPanel";
import { SwotCanvas } from "@/components/frameworks/SwotCanvas";
import { PestelCanvas } from "@/components/frameworks/PestelCanvas";
import { Porter5Canvas } from "@/components/frameworks/Porter5Canvas";
import { BcgCanvas } from "@/components/frameworks/BcgCanvas";
import { AnsoffCanvas } from "@/components/frameworks/AnsoffCanvas";
import { SipocCanvas } from "@/components/frameworks/SipocCanvas";
import { ValueChainCanvas } from "@/components/frameworks/ValueChainCanvas";
import { RootCauseCanvas } from "@/components/frameworks/RootCauseCanvas";
import { HypothesisTreeView } from "@/components/engagement/HypothesisTreeView";
import { AnalysisPanel } from "@/components/engagement/AnalysisPanel";
import { SynthesisPanel } from "@/components/engagement/SynthesisPanel";
import { CommunicationPanel } from "@/components/engagement/CommunicationPanel";
import { CritiquePanel } from "@/components/engagement/CritiquePanel";
import { ExportPanel } from "@/components/engagement/ExportPanel";

/**
 * Engagement Detail Page — The main cockpit view (M1 complete).
 * FR-20: 3-panel layout pattern per framework module.
 * §5: McKinsey-mirrored state machine drives the workflow.
 * All 10 frameworks + analysis, synthesis, communication, critique, export.
 */

type Stage =
  | "scoping"
  | "frameworks"
  | "hypothesis"
  | "analysis"
  | "synthesis"
  | "communication"
  | "critique"
  | "export";

type FrameworkTab = "swot" | "pestel" | "porter5" | "bcg" | "ansoff" | "sipoc" | "value_chain" | "root_cause";

const FRAMEWORK_TABS: Array<{ id: FrameworkTab; label: string; icon: string }> = [
  { id: "swot", label: "SWOT", icon: "🎯" },
  { id: "pestel", label: "PESTEL", icon: "🌍" },
  { id: "porter5", label: "Porter's 5", icon: "⚔️" },
  { id: "bcg", label: "BCG Matrix", icon: "📊" },
  { id: "ansoff", label: "Ansoff", icon: "📈" },
  { id: "sipoc", label: "SIPOC", icon: "⚙️" },
  { id: "value_chain", label: "Value Chain", icon: "🔗" },
  { id: "root_cause", label: "Root Cause", icon: "🔍" },
];

export default function EngagementPage() {
  const [currentStage, setCurrentStage] = useState<Stage>("scoping");
  const [activeFramework, setActiveFramework] = useState<FrameworkTab>("swot");

  const renderFramework = () => {
    switch (activeFramework) {
      case "swot": return <SwotCanvas />;
      case "pestel": return <PestelCanvas />;
      case "porter5": return <Porter5Canvas />;
      case "bcg": return <BcgCanvas />;
      case "ansoff": return <AnsoffCanvas />;
      case "sipoc": return <SipocCanvas />;
      case "value_chain": return <ValueChainCanvas />;
      case "root_cause": return <RootCauseCanvas />;
    }
  };

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
            <span className="text-xs text-navy-300">M1 · Last saved: just now</span>
            <button
              className="btn-secondary text-xs !bg-navy-800 !text-white !border-navy-600"
              onClick={() => setCurrentStage("export")}
            >
              ↗ Export
            </button>
            <button
              className="text-xs px-3 py-1.5 rounded bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30"
              onClick={() => setCurrentStage("critique")}
            >
              🔍 Critique
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

            {/* Framework tabs — all 10 active in M1 */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
              {FRAMEWORK_TABS.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setActiveFramework(fw.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      activeFramework === fw.id
                        ? "bg-accent-600 text-white"
                        : "bg-white text-navy-700 hover:bg-navy-50 border border-navy-200"
                    }`}
                >
                  {fw.icon} {fw.label}
                </button>
              ))}
            </div>

            {/* Active framework canvas */}
            {renderFramework()}
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
            <AnalysisPanel />
          </div>
        )}

        {currentStage === "synthesis" && (
          <div>
            <StageHeader
              title="5. Synthesize"
              description="Roll findings into a Pyramid Principle narrative: one governing thought, 3-5 MECE key lines, each backed by analyses."
            />
            <SynthesisPanel />
          </div>
        )}

        {currentStage === "communication" && (
          <div>
            <StageHeader
              title="6. Communicate"
              description="Build the slide deck. Every slide: action title (≤14 words), one message, footer sources."
            />
            <CommunicationPanel />
          </div>
        )}

        {currentStage === "critique" && (
          <div>
            <StageHeader
              title="Quality — CritiqueAgent"
              description="Mandatory quality linter. Checks MECE, sourcing, so-what, bias, consistency, completeness, and actionability."
            />
            <CritiquePanel />
          </div>
        )}

        {currentStage === "export" && (
          <div>
            <StageHeader
              title="7. Export"
              description="Export your strategy deck as HTML, PPTX, or PDF. Share with stakeholders."
            />
            <ExportPanel />
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
