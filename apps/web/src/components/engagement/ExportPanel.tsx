"use client";

import { useState } from "react";

/**
 * Export Panel (Stage 7).
 *
 * Export strategy deck as HTML, PPTX, or PDF.
 * M1: PPTX export via pptxgenjs. PDF via print.
 */

type ExportFormat = "html" | "pptx" | "pdf";

interface ExportJob {
  id: string;
  format: ExportFormat;
  status: "pending" | "processing" | "completed" | "failed";
  url?: string;
  created_at: string;
}

const FORMAT_META: Record<ExportFormat, { label: string; icon: string; description: string }> = {
  html: {
    label: "HTML",
    icon: "🌐",
    description: "Interactive HTML deck — opens in any browser, responsive layout",
  },
  pptx: {
    label: "PowerPoint",
    icon: "📊",
    description: "PPTX file — opens in PowerPoint, Keynote, Google Slides",
  },
  pdf: {
    label: "PDF",
    icon: "📄",
    description: "Print-ready PDF — fixed layout, suitable for distribution",
  },
};

export function ExportPanel() {
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pptx");
  const [isExporting, setIsExporting] = useState(false);

  const startExport = async () => {
    setIsExporting(true);
    const job: ExportJob = {
      id: crypto.randomUUID(),
      format: selectedFormat,
      status: "processing",
      created_at: new Date().toISOString(),
    };
    setExports((prev) => [job, ...prev]);

    // Simulate export (in real app, calls API)
    setTimeout(() => {
      setExports((prev) =>
        prev.map((e) =>
          e.id === job.id
            ? { ...e, status: "completed", url: `#download-${selectedFormat}` }
            : e
        )
      );
      setIsExporting(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Export options */}
      <div className="col-span-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">Export Strategy Deck</h3>

          {/* Format selector */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(Object.keys(FORMAT_META) as ExportFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedFormat === format
                    ? "border-accent-600 bg-accent-50 ring-1 ring-accent-500"
                    : "border-gray-200 hover:border-navy-300"
                }`}
              >
                <div className="text-2xl mb-2">{FORMAT_META[format].icon}</div>
                <h4 className="text-sm font-semibold text-navy-800">{FORMAT_META[format].label}</h4>
                <p className="text-xs text-navy-500 mt-1">{FORMAT_META[format].description}</p>
              </button>
            ))}
          </div>

          {/* Export settings */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-navy-700 mb-3">Export Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-navy-600 mb-1">Slide Size</label>
                <select className="input-field text-sm">
                  <option>16:9 Widescreen (default)</option>
                  <option>4:3 Standard</option>
                  <option>A4 Portrait</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-navy-600 mb-1">Theme</label>
                <select className="input-field text-sm">
                  <option>McKinsead Default (Navy)</option>
                  <option>Minimal White</option>
                  <option>Dark Mode</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs text-navy-600">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Include appendix slides
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs text-navy-600">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Include source citations
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs text-navy-600">
                  <input type="checkbox" className="rounded" />
                  Include audit trail
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs text-navy-600">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Include page numbers
                </label>
              </div>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={startExport}
            disabled={isExporting}
            className={`w-full py-3 rounded-lg text-base font-semibold transition-all ${
              isExporting
                ? "bg-gray-300 text-gray-500 cursor-wait"
                : "bg-accent-600 text-white hover:bg-accent-700"
            }`}
          >
            {isExporting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </span>
            ) : (
              `Export as ${FORMAT_META[selectedFormat].label}`
            )}
          </button>
        </div>

        {/* Export history */}
        {exports.length > 0 && (
          <div className="card mt-4">
            <h4 className="text-sm font-semibold text-navy-700 mb-3">Export History</h4>
            <div className="space-y-2">
              {exports.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{FORMAT_META[exp.format].icon}</span>
                    <div>
                      <span className="text-sm font-medium text-navy-700">
                        {FORMAT_META[exp.format].label}
                      </span>
                      <span className="text-xs text-navy-400 ml-2">
                        {new Date(exp.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    {exp.status === "processing" && (
                      <span className="text-xs text-blue-600 animate-pulse">Processing...</span>
                    )}
                    {exp.status === "completed" && (
                      <a
                        href={exp.url}
                        className="text-xs px-3 py-1.5 rounded bg-accent-600 text-white hover:bg-accent-700"
                      >
                        Download
                      </a>
                    )}
                    {exp.status === "failed" && (
                      <span className="text-xs text-red-600">Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Shareable link + info */}
      <div className="col-span-4">
        <div className="card mb-4">
          <h4 className="text-sm font-semibold text-navy-700 mb-2">🔗 Shareable Link</h4>
          <p className="text-xs text-navy-500 mb-3">
            Generate a link to share the deck with stakeholders (view-only).
          </p>
          <button className="btn-secondary text-xs w-full">Generate Link</button>
        </div>

        <div className="card mb-4 bg-emerald-50 border-emerald-200">
          <h4 className="text-sm font-semibold text-emerald-800 mb-2">✅ Pre-Export Checklist</h4>
          <ul className="space-y-1 text-xs text-emerald-700">
            <li>☐ G4 — Pyramid approved</li>
            <li>☐ G5 — Deck approved</li>
            <li>☐ All slides have action titles</li>
            <li>☐ All charts have source citations</li>
            <li>☐ Critique pass (no blocking issues)</li>
          </ul>
        </div>

        <div className="card bg-navy-50 border-navy-200">
          <h4 className="text-sm font-semibold text-navy-700 mb-2">📊 Engagement Summary</h4>
          <div className="space-y-1 text-xs text-navy-500">
            <div className="flex justify-between"><span>Frameworks run</span><span>—</span></div>
            <div className="flex justify-between"><span>Hypotheses tested</span><span>—</span></div>
            <div className="flex justify-between"><span>Analyses completed</span><span>—</span></div>
            <div className="flex justify-between"><span>Critique issues</span><span>—</span></div>
            <div className="flex justify-between"><span>Slides</span><span>—</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
