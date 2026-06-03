"use client";

import { useState } from "react";

/**
 * Synthesis Panel (§7.11 / Stage 5).
 *
 * Pyramid Principle (Minto):
 * - One Governing Thought (the answer)
 * - 3-5 Key Lines that prove the governing thought (MECE)
 * - Each Key Line backed by 2-4 analyses
 *
 * Storyline written top-down (answer first), never bottom-up.
 * G4: Pyramid Storyline Approval gate before slides.
 */

interface KeyLine {
  id: string;
  argument: string;
  supports: string[]; // Analysis IDs
}

export function SynthesisPanel() {
  const [governingThought, setGoverningThought] = useState("");
  const [keyLines, setKeyLines] = useState<KeyLine[]>([]);
  const [g4Approved, setG4Approved] = useState(false);

  const addKeyLine = () => {
    setKeyLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), argument: "", supports: [] },
    ]);
  };

  const updateKeyLine = (id: string, argument: string) => {
    setKeyLines((prev) => prev.map((kl) => (kl.id === id ? { ...kl, argument } : kl)));
  };

  const removeKeyLine = (id: string) => {
    setKeyLines((prev) => prev.filter((kl) => kl.id !== id));
  };

  const addSupport = (klId: string, analysisId: string) => {
    setKeyLines((prev) =>
      prev.map((kl) =>
        kl.id === klId ? { ...kl, supports: [...kl.supports, analysisId] } : kl
      )
    );
  };

  const isValid = governingThought.trim() && keyLines.length >= 2 && keyLines.every((kl) => kl.argument.trim());

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Pyramid builder */}
      <div className="col-span-8">
        {/* Governing Thought */}
        <div className="card mb-4 border-l-4 border-l-accent-600">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔺</span>
            <h3 className="text-sm font-semibold text-navy-700">Governing Thought</h3>
            <span className="text-xs text-navy-400">(The one-sentence answer)</span>
          </div>
          <textarea
            value={governingThought}
            onChange={(e) => setGoverningThought(e.target.value)}
            rows={2}
            className="input-field text-lg"
            placeholder="State the answer — what should the decision-maker do and why?"
          />
          <p className="text-xs text-navy-400 mt-1">
            §7.11: Answer first, then prove. Never build bottom-up.
          </p>
        </div>

        {/* Key Lines */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-navy-700">Key Lines</h3>
              <span className="text-xs text-navy-400">
                ({keyLines.length} of 3-5 recommended, must be MECE)
              </span>
            </div>
            <button
              onClick={addKeyLine}
              className="btn-primary text-xs"
              disabled={keyLines.length >= 7}
            >
              + Add Key Line
            </button>
          </div>

          {/* MECE indicator */}
          {keyLines.length >= 2 && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${
              keyLines.length >= 3 && keyLines.length <= 5
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {keyLines.length >= 3 && keyLines.length <= 5
                ? "✓ Good number of key lines. Verify they are MECE — mutually exclusive and collectively exhaustive."
                : keyLines.length < 3
                ? "⚠ Typically need at least 3 key lines for a robust argument."
                : "⚠ More than 5 key lines — consider consolidating for clarity."}
            </div>
          )}

          <div className="space-y-3">
            {keyLines.map((kl, idx) => (
              <div key={kl.id} className="card border-l-4 border-l-navy-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-sm font-bold text-navy-400 mt-2">
                      KL{idx + 1}
                    </span>
                    <div className="flex-1">
                      <textarea
                        value={kl.argument}
                        onChange={(e) => updateKeyLine(kl.id, e.target.value)}
                        rows={2}
                        className="input-field"
                        placeholder="State the argument that supports the governing thought..."
                      />
                      {/* Supporting analyses */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-navy-400">Supported by:</span>
                        {kl.supports.length > 0 ? (
                          kl.supports.map((s) => (
                            <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-navy-300 italic">No analyses linked</span>
                        )}
                        <button
                          onClick={() => addSupport(kl.id, `a_${Math.random().toString(36).slice(2, 6)}`)}
                          className="text-xs text-accent-600 hover:text-accent-800"
                        >
                          + Link analysis
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeKeyLine(kl.id)}
                    className="text-red-400 hover:text-red-600 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {keyLines.length === 0 && (
              <div className="text-center py-8 text-navy-300">
                <p className="text-sm">Add key lines that, taken together, prove the governing thought.</p>
              </div>
            )}
          </div>
        </div>

        {/* G4 Gate */}
        <div className="card border-2 border-dashed border-navy-300">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-navy-700">
                🚪 Gate G4 — Pyramid Storyline Approval
              </h4>
              <p className="text-xs text-navy-500 mt-1">
                §6: The orchestrator must pause and ask for explicit user confirmation before slide rendering.
              </p>
            </div>
            <button
              onClick={() => setG4Approved(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                g4Approved
                  ? "bg-emerald-100 text-emerald-700 cursor-default"
                  : isValid
                  ? "bg-accent-600 text-white hover:bg-accent-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!isValid || g4Approved}
            >
              {g4Approved ? "✓ Approved" : "Approve Pyramid"}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Preview + guidance */}
      <div className="col-span-4">
        {/* Pyramid preview */}
        <div className="card mb-4">
          <h4 className="text-sm font-semibold text-navy-700 mb-3">Pyramid Preview</h4>
          <div className="space-y-2">
            {/* Governing thought triangle */}
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-3 text-center">
              <span className="text-xs text-accent-600 block mb-1">Governing Thought</span>
              <p className="text-sm font-medium text-navy-800">
                {governingThought || "—"}
              </p>
            </div>

            {/* Key lines */}
            {keyLines.length > 0 && (
              <div className="flex gap-1">
                {keyLines.map((kl, idx) => (
                  <div
                    key={kl.id}
                    className="flex-1 bg-navy-50 border border-navy-200 rounded-lg p-2 text-center"
                  >
                    <span className="text-xs text-navy-400 block">KL{idx + 1}</span>
                    <p className="text-xs text-navy-700 mt-1 line-clamp-3">
                      {kl.argument || "—"}
                    </p>
                    <span className="text-xs text-navy-300 mt-1 block">
                      {kl.supports.length} analyses
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guidance */}
        <div className="card bg-blue-50 border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">📐 Pyramid Principle Rules</h4>
          <ul className="space-y-1.5 text-xs text-blue-700">
            <li>✓ Answer first — lead with the governing thought</li>
            <li>✓ 3-5 key lines that are MECE</li>
            <li>✓ Each key line backed by 2-4 analyses</li>
            <li>✓ Every key line carries a so-what</li>
            <li>✗ Never build bottom-up (data → insight)</li>
            <li>✗ Never have unsupported key lines</li>
          </ul>
        </div>

        {/* AI Panel */}
        <div className="card mt-4 bg-accent-50 border-accent-200">
          <h4 className="text-sm font-semibold text-accent-800 mb-2">🤖 AI Assist</h4>
          <div className="space-y-2">
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Generate pyramid from analyses
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              MECE-check key lines
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Sharpen governing thought
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
