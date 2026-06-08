import { useState } from "react";
import { FaIcon } from "@/components/FaIcon";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Check,
  CheckCircle2,
  Download,
  Loader2,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { EngagementData } from "./types";

export function ExportPanel({ engagement, engagementId: _engagementId, frameworkDataList }: {
  engagement: EngagementData;
  engagementId: Id<"engagements">;
  frameworkDataList: Array<{ framework: string; data: string; status: string }>;
}) {
  const [format, setFormat] = useState("pdf");
  const [theme, setTheme] = useState("navy");
  const [exporting, setExporting] = useState(false);

  const frameworkLabels: Record<string, string> = {
    swot: "SWOT Analysis", pestel: "PESTEL Analysis", porter5: "Porter's Five Forces",
    bcg: "BCG Matrix", ansoff: "Ansoff Matrix", sipoc: "SIPOC",
    value_chain: "Value Chain Analysis", root_cause: "Root Cause Analysis",
  };

  const completedFrameworks = frameworkDataList.filter((f) => f.status === "done" && f.data !== "{}");
  const scopingData = engagement.scopingData ? (() => { try { return JSON.parse(engagement.scopingData!); } catch { return null; } })() : null;
  const synthesisData = engagement.synthesisData ? (() => { try { return JSON.parse(engagement.synthesisData!); } catch { return null; } })() : null;

  const themeColors: Record<string, { bg: string; accent: string; text: string; lightBg: string }> = {
    navy: { bg: "#1a237e", accent: "#283593", text: "#1a237e", lightBg: "#e8eaf6" },
    minimal: { bg: "#212121", accent: "#424242", text: "#212121", lightBg: "#f5f5f5" },
    dark: { bg: "#0d1117", accent: "#161b22", text: "#c9d1d9", lightBg: "#21262d" },
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const t = themeColors[theme];
      const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      // Build framework sections HTML
      const fwSections = completedFrameworks.map((fw) => {
        const label = frameworkLabels[fw.framework] || fw.framework;
        let parsed: Record<string, unknown>;
        try { parsed = JSON.parse(fw.data); } catch { return ""; }

        let content = "";
        if (fw.framework === "swot") {
          const d = parsed as Record<string, string[]>;
          content = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">` +
            ["strengths", "weaknesses", "opportunities", "threats"].map(q =>
              `<div style="background:${t.lightBg};border-radius:8px;padding:12px"><h4 style="color:${t.bg};font-size:13px;margin:0 0 8px;text-transform:uppercase">${q}</h4><ul style="margin:0;padding-left:18px;font-size:11px">${(d[q] || []).map((i: string) => `<li style="margin-bottom:4px">${i}</li>`).join("")}</ul></div>`
            ).join("") + `</div>`;
        } else if (fw.framework === "pestel") {
          const d = parsed as Record<string, string[]>;
          content = Object.entries(d).map(([k, items]) =>
            `<div style="margin-bottom:8px"><span style="display:inline-block;background:${t.bg};color:white;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;margin-bottom:4px">${k}</span><ul style="margin:4px 0 0;padding-left:18px;font-size:11px">${(items as string[]).map((i: string) => `<li style="margin-bottom:2px">${i}</li>`).join("")}</ul></div>`
          ).join("");
        } else {
          content = `<pre style="font-size:10px;white-space:pre-wrap;background:${t.lightBg};padding:12px;border-radius:8px">${JSON.stringify(parsed, null, 2)}</pre>`;
        }

        return `<div style="page-break-inside:avoid;margin-bottom:24px"><h3 style="color:${t.bg};font-size:16px;border-bottom:2px solid ${t.bg};padding-bottom:4px;margin-bottom:12px">${label}</h3>${content}</div>`;
      }).join("");

      // Build SCQA section
      const scqaSection = scopingData ? `
        <div style="page-break-inside:avoid;margin-bottom:24px">
          <h3 style="color:${t.bg};font-size:16px;border-bottom:2px solid ${t.bg};padding-bottom:4px;margin-bottom:12px">Problem Scoping — SCQA Framework</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${["situation", "complication", "question", "answer"].map(k =>
              `<div style="background:${t.lightBg};border-radius:8px;padding:12px"><h4 style="color:${t.bg};font-size:12px;margin:0 0 6px;text-transform:uppercase">${k}</h4><p style="font-size:11px;margin:0">${scopingData[k] || "—"}</p></div>`
            ).join("")}
          </div>
        </div>` : "";

      // Synthesis section
      const synthesisSection = synthesisData ? `
        <div style="page-break-inside:avoid;margin-bottom:24px">
          <h3 style="color:${t.bg};font-size:16px;border-bottom:2px solid ${t.bg};padding-bottom:4px;margin-bottom:12px">Synthesis — Pyramid Principle</h3>
          <div style="text-align:center;background:${t.lightBg};border:2px solid ${t.bg};border-radius:8px;padding:16px;margin-bottom:12px">
            <div style="font-size:10px;color:${t.bg};font-weight:600;text-transform:uppercase;margin-bottom:4px">Governing Thought</div>
            <p style="font-size:13px;font-weight:600;margin:0">${synthesisData.governingThought || "—"}</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            ${(synthesisData.keyLines || []).map((line: string, i: number) =>
              `<div style="background:${t.lightBg};border-radius:8px;padding:12px"><h4 style="color:${t.bg};font-size:11px;margin:0 0 6px">Key Line ${i + 1}</h4><p style="font-size:11px;margin:0">${line || "—"}</p></div>`
            ).join("")}
          </div>
        </div>` : "";

      const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${engagement.company} — Strategy Report</title>
<style>@media print{body{margin:0}}</style></head><body style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333">
<div style="background:${t.bg};color:white;padding:40px;border-radius:12px;margin-bottom:32px;text-align:center">
  <h1 style="margin:0 0 8px;font-size:28px">${engagement.company}</h1>
  <p style="margin:0;opacity:0.85;font-size:14px">Strategic Analysis — ${engagement.industry}</p>
  ${engagement.question ? `<p style="margin:12px 0 0;opacity:0.7;font-size:12px">${engagement.question}</p>` : ""}
  <p style="margin:16px 0 0;opacity:0.5;font-size:10px">${now} · Generated by mckinsead</p>
</div>
${scqaSection}${fwSections}${synthesisSection}
<div style="text-align:center;color:#999;font-size:9px;margin-top:40px;padding-top:16px;border-top:1px solid #eee">Generated by mckinsead — Agentic Strategy Cockpit</div>
</body></html>`;

      if (format === "pptx") {
        // Export as structured JSON for PowerPoint import
        const slideData = {
          title: engagement.company,
          subtitle: `Strategic Analysis — ${engagement.industry}`,
          question: engagement.question || "",
          date: now,
          scoping: scopingData || null,
          synthesis: synthesisData || null,
          frameworks: completedFrameworks.map((fw) => ({
            name: frameworkLabels[fw.framework] || fw.framework,
            key: fw.framework,
            data: (() => { try { return JSON.parse(fw.data); } catch { return fw.data; } })(),
          })),
        };
        const blob = new Blob([JSON.stringify(slideData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${engagement.company.replace(/\s+/g, "_")}_strategy.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "pdf" || format === "html") {
        // Open in new window for print-to-PDF
        const w = window.open("", "_blank");
        if (w) {
          w.document.write(htmlContent);
          w.document.close();
          if (format === "pdf") {
            setTimeout(() => w.print(), 500);
          }
        }
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-5 text-primary" /> Export
        </CardTitle>
        <CardDescription>Export your strategy analysis as a professional report</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export preview summary */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600" /> Report Contents
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {scopingData ? <Check className="size-3 text-green-600" /> : <Minus className="size-3" />}
              SCQA Problem Scoping
            </div>
            {completedFrameworks.map((fw) => (
              <div key={fw.framework} className="flex items-center gap-1.5">
                <Check className="size-3 text-green-600" />
                {frameworkLabels[fw.framework] || fw.framework}
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              {synthesisData?.governingThought ? <Check className="size-3 text-green-600" /> : <Minus className="size-3" />}
              Pyramid Principle Synthesis
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { id: "pdf", label: "PDF Report", desc: "Print-ready strategy report", icon: "fa-solid fa-file-pdf" },
            { id: "html", label: "HTML Report", desc: "Browser-based, shareable", icon: "fa-solid fa-globe" },
            { id: "pptx", label: "PowerPoint / JSON", desc: "Slide-ready data export", icon: "fa-solid fa-file-powerpoint" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`border rounded-lg p-4 text-left transition-colors ${format === f.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            >
              <div className="text-2xl mb-2"><FaIcon icon={f.icon} /></div>
              <h4 className="font-semibold text-sm">{f.label}</h4>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </button>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="navy">Navy (Classic McKinsey)</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full gap-2" size="lg" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {exporting ? "Generating..." : `Export as ${format.toUpperCase()}`}
        </Button>

        {completedFrameworks.length === 0 && (
          <p className="text-xs text-amber-600 text-center">
            ⚠️ No framework data generated yet. Go to the Diagnose stage and generate analyses first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
