"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Dashboard — Lists engagements + Create new engagement.
 * FR-19: Central dashboard with workspace overview.
 */
export default function DashboardPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight">McKinsead</h1>
              <p className="text-navy-300 mt-1">Strategy Cockpit</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary bg-accent-500 hover:bg-accent-600"
            >
              + New Engagement
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Workflow overview */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-navy-800 mb-4">
            The McKinsey-Mirrored Workflow
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { stage: "Scope", icon: "🎯", desc: "Frame the problem (SCQA)" },
              { stage: "Diagnose", icon: "🔍", desc: "Run strategy frameworks" },
              { stage: "Hypothesize", icon: "💡", desc: "Build hypothesis tree" },
              { stage: "Analyze", icon: "📊", desc: "Test each hypothesis" },
              { stage: "Synthesize", icon: "🧩", desc: "Pyramid principle" },
              { stage: "Communicate", icon: "📋", desc: "Build slide deck" },
              { stage: "Export", icon: "📤", desc: "HTML / PPTX / PDF" },
            ].map((s, i) => (
              <div key={s.stage} className="flex items-center">
                {i > 0 && (
                  <div className="text-navy-300 mx-1">→</div>
                )}
                <div className="flex-shrink-0 bg-navy-50 rounded-lg px-4 py-3 text-center min-w-[120px]">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-sm font-semibold text-navy-800">{s.stage}</div>
                  <div className="text-xs text-navy-500 mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagements list placeholder */}
        <div className="card">
          <h2 className="text-lg font-semibold text-navy-800 mb-4">
            Your Engagements
          </h2>
          <div className="text-center py-12 text-navy-400">
            <div className="text-5xl mb-4">🧭</div>
            <p className="text-lg mb-2">No engagements yet</p>
            <p className="text-sm mb-6">
              Create your first strategy engagement to get started
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
            >
              Create Engagement
            </button>
          </div>
        </div>

        {/* Quick-start templates */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy-800 mb-4">
            Quick-Start Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Market Entry",
                desc: "Should we enter a new market? Full PESTEL + Porter analysis.",
                frameworks: ["PESTEL", "Porter 5", "SWOT", "Ansoff"],
              },
              {
                title: "Portfolio Optimization",
                desc: "Which business units to invest, harvest, or divest?",
                frameworks: ["BCG", "Value Chain", "SWOT"],
              },
              {
                title: "Operational Turnaround",
                desc: "Root cause analysis of margin erosion + hypothesis testing.",
                frameworks: ["Root Cause", "SIPOC", "Value Chain", "SWOT"],
              },
            ].map((tpl) => (
              <div
                key={tpl.title}
                className="card hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-accent-500"
              >
                <h3 className="font-semibold text-navy-800">{tpl.title}</h3>
                <p className="text-sm text-navy-500 mt-1">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {tpl.frameworks.map((f) => (
                    <span
                      key={f}
                      className="text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded-full"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create engagement modal (simplified for M0) */}
      {showCreate && (
        <CreateEngagementModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function CreateEngagementModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-8">
        <h2 className="text-xl font-semibold text-navy-800 mb-6">
          New Strategy Engagement
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: Wire to tRPC mutation
            onClose();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="label">Company Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Acme Corp"
                required
              />
            </div>
            <div>
              <label className="label">Industry *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Consumer Electronics"
                required
              />
            </div>
            <div>
              <label className="label">Strategic Question</label>
              <textarea
                className="input-field h-24"
                placeholder="e.g., Should we expand into the European market?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Geographies</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., US, Europe, APAC"
                />
              </div>
              <div>
                <label className="label">Key Competitors</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., CompetitorA, CompetitorB"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Engagement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
