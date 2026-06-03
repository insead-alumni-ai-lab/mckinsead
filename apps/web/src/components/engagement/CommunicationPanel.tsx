"use client";

import { useState } from "react";

/**
 * Communication Panel (§7.12 / Stage 6).
 *
 * Slide builder following consulting slide grammar:
 * - Action title (lead with the so-what, full sentence, ≤14 words)
 * - One message per slide
 * - Body: chart | table | bullets | kpi | quote
 * - Footer: source citations
 *
 * G5: Final Deck Approval gate before export.
 */

interface Slide {
  id: string;
  order: number;
  action_title: string;
  body_type: "chart" | "table" | "bullets" | "kpi" | "quote";
  body_content: string;
  footer_sources: string[];
}

const BODY_TYPES = [
  { value: "kpi" as const, label: "KPI / Metric", icon: "📊" },
  { value: "bullets" as const, label: "Bullet Points", icon: "📝" },
  { value: "chart" as const, label: "Chart", icon: "📈" },
  { value: "table" as const, label: "Table", icon: "📋" },
  { value: "quote" as const, label: "Quote", icon: "💬" },
];

export function CommunicationPanel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [g5Approved, setG5Approved] = useState(false);

  const activeSlide = slides.find((s) => s.id === activeSlideId);

  const addSlide = () => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      order: slides.length + 1,
      action_title: "",
      body_type: "bullets",
      body_content: "",
      footer_sources: [],
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideId(newSlide.id);
  };

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
    if (activeSlideId === id) setActiveSlideId(null);
  };

  const moveSlide = (id: string, direction: "up" | "down") => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (direction === "up" && idx > 0) {
        const arr = [...prev];
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        return arr.map((s, i) => ({ ...s, order: i + 1 }));
      }
      if (direction === "down" && idx < prev.length - 1) {
        const arr = [...prev];
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        return arr.map((s, i) => ({ ...s, order: i + 1 }));
      }
      return prev;
    });
  };

  const titleWordCount = (title: string) => title.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Slide list */}
      <div className="col-span-3">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-navy-700">Slides</h3>
            <button onClick={addSlide} className="btn-primary text-xs !py-1">
              + Add
            </button>
          </div>

          <div className="space-y-1">
            {slides.map((slide) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlideId(slide.id)}
                className={`w-full text-left p-2 rounded border transition-all ${
                  activeSlideId === slide.id
                    ? "border-accent-600 bg-accent-50"
                    : "border-gray-200 hover:border-navy-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-navy-400 w-5">{slide.order}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-navy-700 truncate">
                      {slide.action_title || "Untitled slide"}
                    </p>
                    <span className="text-xs text-navy-300">
                      {BODY_TYPES.find((t) => t.value === slide.body_type)?.icon}{" "}
                      {BODY_TYPES.find((t) => t.value === slide.body_type)?.label}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {slides.length === 0 && (
            <p className="text-xs text-navy-300 text-center py-4">No slides yet</p>
          )}
        </div>
      </div>

      {/* Center: Slide editor */}
      <div className="col-span-6">
        {activeSlide ? (
          <div className="card">
            {/* Slide preview */}
            <div
              className="border-2 border-navy-200 rounded-lg mb-4 bg-white relative"
              style={{ aspectRatio: "16 / 9" }}
            >
              <div className="p-6 h-full flex flex-col">
                {/* Action title */}
                <div className="border-b-2 border-accent-600 pb-3 mb-4">
                  <p
                    className={`text-base font-semibold ${
                      activeSlide.action_title ? "text-navy-900" : "text-navy-300"
                    }`}
                  >
                    {activeSlide.action_title || "Action title — the so-what"}
                  </p>
                </div>

                {/* Body */}
                <div className="flex-1 flex items-center justify-center text-navy-400 text-sm">
                  {activeSlide.body_content || (
                    <div className="text-center">
                      <span className="text-3xl">
                        {BODY_TYPES.find((t) => t.value === activeSlide.body_type)?.icon}
                      </span>
                      <p className="mt-2">
                        {BODY_TYPES.find((t) => t.value === activeSlide.body_type)?.label} content
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-2 text-xs text-navy-300">
                  {activeSlide.footer_sources.length > 0
                    ? activeSlide.footer_sources.join(" · ")
                    : "Sources"}
                </div>
              </div>
            </div>

            {/* Editor fields */}
            <div className="space-y-4">
              {/* Action title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-navy-700">
                    Action Title <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      titleWordCount(activeSlide.action_title) > 14
                        ? "text-red-500"
                        : "text-navy-400"
                    }`}
                  >
                    {titleWordCount(activeSlide.action_title)}/14 words
                  </span>
                </div>
                <input
                  type="text"
                  value={activeSlide.action_title}
                  onChange={(e) => updateSlide(activeSlide.id, { action_title: e.target.value })}
                  className="input-field"
                  placeholder="Lead with the so-what as a full sentence"
                />
              </div>

              {/* Body type */}
              <div>
                <label className="text-sm font-medium text-navy-700 mb-1 block">Body Type</label>
                <div className="flex gap-2">
                  {BODY_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => updateSlide(activeSlide.id, { body_type: t.value })}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        activeSlide.body_type === t.value
                          ? "bg-accent-600 text-white"
                          : "bg-gray-100 text-navy-600 hover:bg-gray-200"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body content */}
              <div>
                <label className="text-sm font-medium text-navy-700 mb-1 block">Content</label>
                <textarea
                  value={activeSlide.body_content}
                  onChange={(e) => updateSlide(activeSlide.id, { body_content: e.target.value })}
                  rows={4}
                  className="input-field"
                  placeholder="Slide body content..."
                />
              </div>

              {/* Sources */}
              <div>
                <label className="text-sm font-medium text-navy-700 mb-1 block">Sources</label>
                <input
                  type="text"
                  value={activeSlide.footer_sources.join(", ")}
                  onChange={(e) =>
                    updateSlide(activeSlide.id, {
                      footer_sources: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="input-field"
                  placeholder="Comma-separated citations..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => moveSlide(activeSlide.id, "up")} className="btn-secondary text-xs">
                  ↑ Move Up
                </button>
                <button onClick={() => moveSlide(activeSlide.id, "down")} className="btn-secondary text-xs">
                  ↓ Move Down
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => removeSlide(activeSlide.id)}
                  className="text-xs px-3 py-1.5 rounded text-red-600 hover:bg-red-50"
                >
                  Delete Slide
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-16 text-navy-300">
            <p className="text-xl mb-2">📋 Slide Builder</p>
            <p className="text-sm">Add slides or select one to edit</p>
          </div>
        )}
      </div>

      {/* Right: Guidance + G5 gate */}
      <div className="col-span-3">
        <div className="card mb-4 bg-blue-50 border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">📏 Slide Grammar</h4>
          <ul className="space-y-1 text-xs text-blue-700">
            <li>✓ Action title (≤14 words, full sentence)</li>
            <li>✓ One message per slide</li>
            <li>✓ Body: chart OR table OR bullets</li>
            <li>✓ Footer: source citations</li>
            <li>✗ Never chart + long bullets together</li>
          </ul>
        </div>

        <div className="card mb-4">
          <h4 className="text-sm font-semibold text-navy-700 mb-2">Deck Stats</h4>
          <div className="space-y-1 text-xs text-navy-500">
            <div className="flex justify-between">
              <span>Total slides</span>
              <span className="font-medium">{slides.length}</span>
            </div>
            <div className="flex justify-between">
              <span>With action title</span>
              <span className="font-medium">{slides.filter((s) => s.action_title).length}</span>
            </div>
            <div className="flex justify-between">
              <span>With sources</span>
              <span className="font-medium">{slides.filter((s) => s.footer_sources.length > 0).length}</span>
            </div>
          </div>
        </div>

        {/* G5 Gate */}
        <div className="card border-2 border-dashed border-navy-300">
          <h4 className="text-sm font-semibold text-navy-700 mb-1">🚪 Gate G5</h4>
          <p className="text-xs text-navy-500 mb-3">Final Deck Approval</p>
          <button
            onClick={() => setG5Approved(true)}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
              g5Approved
                ? "bg-emerald-100 text-emerald-700"
                : slides.length > 0
                ? "bg-accent-600 text-white hover:bg-accent-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            disabled={slides.length === 0 || g5Approved}
          >
            {g5Approved ? "✓ Approved" : "Approve Deck"}
          </button>
        </div>

        {/* AI Panel */}
        <div className="card mt-4 bg-accent-50 border-accent-200">
          <h4 className="text-sm font-semibold text-accent-800 mb-2">🤖 AI Assist</h4>
          <div className="space-y-2">
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Generate deck from pyramid
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Check slide grammar
            </button>
            <button className="w-full text-left text-xs px-3 py-2 rounded bg-white border border-accent-200 text-accent-700 hover:bg-accent-100">
              Add exec summary slide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
