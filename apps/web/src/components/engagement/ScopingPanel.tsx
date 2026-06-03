"use client";

import { useState } from "react";

/**
 * Scoping Panel — SCQA problem framing.
 * FR-01 + §5 Stage 1: Frame the strategic question.
 */

interface ScopingData {
  situation: string;
  complication: string;
  question: string;
  answerHypothesis: string;
  decisionMaker: string;
  deadline: string;
  successCriteria: string[];
  outOfScope: string[];
}

interface Props {
  data?: ScopingData;
  onSave?: (data: ScopingData) => void;
  onApproveGate?: () => void;
}

export function ScopingPanel({ data, onSave, onApproveGate }: Props) {
  const [form, setForm] = useState<ScopingData>(
    data ?? {
      situation: "",
      complication: "",
      question: "",
      answerHypothesis: "",
      decisionMaker: "",
      deadline: "",
      successCriteria: [""],
      outOfScope: [""],
    }
  );

  const update = (key: keyof ScopingData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: SCQA Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <span className="text-accent-600">SCQA</span> Problem Frame
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">Situation</label>
              <textarea
                className="input-field h-20"
                placeholder="What is the current state of affairs? Set the scene for the reader..."
                value={form.situation}
                onChange={(e) => update("situation", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Complication</label>
              <textarea
                className="input-field h-20"
                placeholder="What changed? What is the problem or tension?"
                value={form.complication}
                onChange={(e) => update("complication", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Question</label>
              <textarea
                className="input-field h-16"
                placeholder="What strategic question must be answered?"
                value={form.question}
                onChange={(e) => update("question", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Answer Hypothesis</label>
              <textarea
                className="input-field h-16"
                placeholder="What is your initial hypothesis for the answer?"
                value={form.answerHypothesis}
                onChange={(e) => update("answerHypothesis", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-navy-800 mb-4">
            Engagement Parameters
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Decision Maker</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., CEO, Board of Directors"
                value={form.decisionMaker}
                onChange={(e) => update("decisionMaker", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Deadline</label>
              <input
                type="date"
                className="input-field"
                value={form.deadline}
                onChange={(e) => update("deadline", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right: AI Assistant Panel */}
      <div className="space-y-4">
        <div className="card bg-accent-50 border-accent-200">
          <h4 className="text-sm font-semibold text-accent-800 mb-2">
            🤖 AI Assistant
          </h4>
          <p className="text-sm text-accent-700 mb-3">
            I can help you frame your strategic question. Describe your
            situation and I&apos;ll suggest a structured SCQA framing.
          </p>
          <button className="btn-primary w-full text-sm">
            Generate SCQA Suggestions
          </button>
        </div>

        <div className="card">
          <h4 className="text-sm font-semibold text-navy-700 mb-2">
            Gate G1: Problem Statement Lock
          </h4>
          <p className="text-xs text-navy-500 mb-3">
            Once approved, the problem statement is locked. You can pivot later
            but it requires explicit action.
          </p>
          <button
            onClick={onApproveGate}
            className="btn-primary w-full text-sm bg-green-600 hover:bg-green-700"
          >
            ✓ Approve Problem Statement
          </button>
        </div>

        <div className="card">
          <h4 className="text-sm font-semibold text-navy-700 mb-2">
            Best Practices
          </h4>
          <ul className="text-xs text-navy-500 space-y-1.5">
            <li>• The question should be answerable with "yes/no" or a clear choice</li>
            <li>• The hypothesis should be falsifiable</li>
            <li>• Keep the scope bounded — list what&apos;s out of scope</li>
            <li>• Name the decision maker and the deadline</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
