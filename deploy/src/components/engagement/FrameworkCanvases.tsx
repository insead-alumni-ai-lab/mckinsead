import { useState, useEffect } from "react";
import { FaIcon, FA } from "@/components/FaIcon";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  BarChart3,
  ChevronRight,
  Globe,
  Layers,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FrameworkProps } from "./types";

export function GenerateAllButton({ engagementId }: { engagementId: Id<"engagements"> }) {
  const [generating, setGenerating] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const generateAll = useAction(api.frameworkAi.generateAll);
  const sendChat = useAction(api.chat.sendMessage);

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      await generateAll({ engagementId });
    } catch (err) {
      console.error("Generate all failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAutoPilot = async () => {
    setAutoPilot(true);
    try {
      // Step 1: Generate all frameworks
      await generateAll({ engagementId });
      // Step 2: Ask AI to synthesize key insights
      await sendChat({
        engagementId,
        message: "Based on all the frameworks you just analyzed, provide a synthesis of the top 5 strategic insights, key risks, and recommended next steps. Be specific and actionable.",
        stage: "frameworks",
      });
    } catch (err) {
      console.error("Auto-pilot failed:", err);
    } finally {
      setAutoPilot(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="gap-2 text-xs"
        onClick={handleGenerateAll}
        disabled={generating || autoPilot}
      >
        {generating ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
        {generating ? "Generating..." : "Generate All"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-2 text-xs border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950"
        onClick={handleAutoPilot}
        disabled={generating || autoPilot}
        title="Auto-Pilot: Generate all frameworks + AI synthesis"
      >
        {autoPilot ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
        {autoPilot ? "Running Auto-Pilot..." : "Auto-Pilot"}
      </Button>
    </div>
  );
}

// ─── AI Generate Button (reusable) ────────────────────────────────────────────

export function AiGenerateButton({
  engagementId,
  framework,
  status,
  label,
}: {
  engagementId: Id<"engagements">;
  framework: string;
  status?: string;
  label?: string;
}) {
  const [generating, setGenerating] = useState(false);
  const generateFramework = useAction(api.frameworkAi.generateFramework);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateFramework({ engagementId, framework });
      if (!result.success) {
        console.error("Generation failed:", result.error);
      }
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const isGenerating = generating || status === "generating";
  const isDone = status === "done";

  return (
    <Button
      variant={isDone ? "outline" : "default"}
      size="sm"
      className="gap-2 text-xs"
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="size-3 animate-spin" />
      ) : isDone ? (
        <RefreshCw className="size-3" />
      ) : (
        <Sparkles className="size-3" />
      )}
      {isGenerating ? "Generating..." : isDone ? (label ? `Regenerate ${label}` : "Regenerate") : (label ? `Generate ${label}` : "Generate with AI")}
    </Button>
  );
}



// ─── Framework Status Banner ──────────────────────────────────────────────────

export function FrameworkStatusBanner({ data, error }: { data?: { status: string; error?: string }; error?: string }) {
  const displayError = error || data?.error;
  if (data?.status === "error" || displayError) {
    return (
      <div className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
        <i className="fa-solid fa-triangle-exclamation" />
        <span>Generation failed: {displayError || "Unknown error"}</span>
      </div>
    );
  }
  if (data?.status === "generating") {
    return (
      <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
        <Loader2 className="size-4 animate-spin" />
        <span>AI is generating this analysis... This may take 15-30 seconds.</span>
      </div>
    );
  }
  return null;
}

// ─── SWOT Canvas ──────────────────────────────────────────────────────────────



export function SwotCanvas({ engagementId, data }: FrameworkProps) {
  const saveFramework = useMutation(api.frameworkData.save);
  const [items, setItems] = useState<Record<string, string[]>>({
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  });

  // Load data from Convex
  useEffect(() => {
    if (data?.status === "done" && data.data !== "{}") {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.strengths) setItems(parsed);
      } catch { /* ignore parse errors */ }
    }
  }, [data?.data, data?.status]);

  const colors: Record<string, { bg: string; border: string; icon: string }> = {
    strengths: { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", icon: FA.strengths },
    weaknesses: { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", icon: FA.weaknesses },
    opportunities: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", icon: FA.opportunities },
    threats: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", icon: FA.threats },
  };

  const addItem = (quadrant: string) => {
    const next = { ...items, [quadrant]: [...items[quadrant], ""] };
    setItems(next);
  };

  const removeItem = (quadrant: string, index: number) => {
    const next = {
      ...items,
      [quadrant]: items[quadrant].filter((_, i) => i !== index),
    };
    setItems(next);
    saveFramework({ engagementId, framework: "swot", data: JSON.stringify(next), status: "done" });
  };

  const updateItem = (quadrant: string, index: number, value: string) => {
    const next = { ...items };
    next[quadrant] = [...items[quadrant]];
    next[quadrant][index] = value;
    setItems(next);
  };

  const saveEdits = () => {
    saveFramework({ engagementId, framework: "swot", data: JSON.stringify(items), status: "done" });
  };

  const hasData = Object.values(items).some((arr) => arr.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5 text-primary" />
              SWOT Analysis
            </CardTitle>
            <CardDescription>Strengths, Weaknesses, Opportunities, Threats — all items should be MECE</CardDescription>
          </div>
          <AiGenerateButton engagementId={engagementId} framework="swot" status={data?.status} label="SWOT" />
        </div>
      </CardHeader>
      <CardContent>
        <FrameworkStatusBanner data={data ?? undefined} />
        {!hasData && data?.status !== "generating" && (
          <EmptyFramework name="SWOT" />
        )}
        {hasData && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(items).map(([quadrant, entries]) => (
              <div key={quadrant} className={`rounded-lg border p-4 ${colors[quadrant].bg} ${colors[quadrant].border}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
                    <FaIcon icon={colors[quadrant].icon} className="text-xs" /> {quadrant}
                  </h3>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => addItem(quadrant)}>
                    <Plus className="size-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {entries.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 group">
                      <span className="text-xs text-muted-foreground mt-2 w-4 shrink-0">{i + 1}.</span>
                      <Input
                        value={item}
                        onChange={(e) => updateItem(quadrant, i, e.target.value)}
                        onBlur={saveEdits}
                        className="h-8 text-sm bg-background"
                        placeholder="Add item..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(quadrant, i)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── PESTEL Canvas ────────────────────────────────────────────────────────────

export const PESTEL_CATEGORIES = [
  { id: "political", label: "Political", icon: FA.political, color: "bg-red-500/10 border-red-200 dark:border-red-800" },
  { id: "economic", label: "Economic", icon: FA.economic, color: "bg-blue-500/10 border-blue-200 dark:border-blue-800" },
  { id: "social", label: "Social", icon: FA.social, color: "bg-green-500/10 border-green-200 dark:border-green-800" },
  { id: "technological", label: "Technological", icon: FA.technological, color: "bg-purple-500/10 border-purple-200 dark:border-purple-800" },
  { id: "environmental", label: "Environmental", icon: FA.environmental, color: "bg-emerald-500/10 border-emerald-200 dark:border-emerald-800" },
  { id: "legal", label: "Legal", icon: FA.legal, color: "bg-orange-500/10 border-orange-200 dark:border-orange-800" },
];

export function PestelCanvas({ engagementId, data }: FrameworkProps) {
  const saveFramework = useMutation(api.frameworkData.save);
  const [pestelData, setPestelData] = useState<Record<string, string[]>>({
    political: [], economic: [], social: [],
    technological: [], environmental: [], legal: [],
  });

  useEffect(() => {
    if (data?.status === "done" && data.data !== "{}") {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.political) setPestelData(parsed);
      } catch { /* ignore */ }
    }
  }, [data?.data, data?.status]);

  const updateItem = (catId: string, index: number, value: string) => {
    const next = { ...pestelData, [catId]: [...pestelData[catId]] };
    next[catId][index] = value;
    setPestelData(next);
  };

  const saveEdits = () => {
    saveFramework({ engagementId, framework: "pestel", data: JSON.stringify(pestelData), status: "done" });
  };

  const hasData = Object.values(pestelData).some((arr) => arr.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5 text-primary" /> PESTEL Analysis
            </CardTitle>
            <CardDescription>Political, Economic, Social, Technological, Environmental, Legal factors</CardDescription>
          </div>
          <AiGenerateButton engagementId={engagementId} framework="pestel" status={data?.status} label="PESTEL" />
        </div>
      </CardHeader>
      <CardContent>
        <FrameworkStatusBanner data={data ?? undefined} />
        {!hasData && data?.status !== "generating" && <EmptyFramework name="PESTEL" />}
        {hasData && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PESTEL_CATEGORIES.map((cat) => (
              <div key={cat.id} className={`rounded-lg border p-4 ${cat.color}`}>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <FaIcon icon={cat.icon} className="text-xs" /> {cat.label}
                </h3>
                <div className="space-y-2">
                  {(pestelData[cat.id] ?? []).map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2 group">
                      <span className="text-[10px] text-muted-foreground w-3">{ii + 1}</span>
                      <Input
                        value={item}
                        onChange={(e) => updateItem(cat.id, ii, e.target.value)}
                        onBlur={saveEdits}
                        className="h-7 text-xs bg-background"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const next = { ...pestelData, [cat.id]: pestelData[cat.id].filter((_, j) => j !== ii) };
                          setPestelData(next);
                          saveFramework({ engagementId, framework: "pestel", data: JSON.stringify(next), status: "done" });
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs w-full"
                    onClick={() => {
                      const next = { ...pestelData, [cat.id]: [...(pestelData[cat.id] ?? []), ""] };
                      setPestelData(next);
                    }}
                  >
                    <Plus className="size-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Porter's 5 Forces ───────────────────────────────────────────────────────

export const FORCE_ICONS: Record<string, string> = {
  "Competitive Rivalry": FA.rivalry,
  "Threat of New Entrants": FA.newEntrants,
  "Bargaining Power of Buyers": FA.buyers,
  "Bargaining Power of Suppliers": FA.suppliers,
  "Threat of Substitutes": FA.substitutes,
};

export function Porter5Canvas({ engagementId, data }: FrameworkProps) {
  const saveFramework = useMutation(api.frameworkData.save);
  const [forces, setForces] = useState<Array<{ name: string; intensity: number; notes: string }>>([]);

  useEffect(() => {
    if (data?.status === "done" && data.data !== "{}") {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.forces) setForces(parsed.forces);
      } catch { /* ignore */ }
    }
  }, [data?.data, data?.status]);

  const saveEdits = (updated: typeof forces) => {
    saveFramework({ engagementId, framework: "porter5", data: JSON.stringify({ forces: updated }), status: "done" });
  };

  const hasData = forces.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" /> Porter's Five Forces
            </CardTitle>
            <CardDescription>Assess industry attractiveness through 5 competitive forces</CardDescription>
          </div>
          <AiGenerateButton engagementId={engagementId} framework="porter5" status={data?.status} label="Porter's 5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FrameworkStatusBanner data={data ?? undefined} />
        {!hasData && data?.status !== "generating" && <EmptyFramework name="Porter's Five Forces" />}
        {hasData && (
          <>
            <div className="grid gap-3">
              {forces.map((force, i) => (
                <div key={force.name} className="rounded-lg border p-4 flex items-start gap-4">
                  <div className="text-xl"><FaIcon icon={FORCE_ICONS[force.name] ?? FA.rivalry} /></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{force.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Intensity:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              onClick={() => {
                                const next = [...forces];
                                next[i] = { ...next[i], intensity: level };
                                setForces(next);
                                saveEdits(next);
                              }}
                              className={`size-6 rounded text-xs font-bold transition-colors ${
                                level <= force.intensity
                                  ? level >= 4 ? "bg-red-500 text-white" : level >= 3 ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Textarea
                      value={force.notes}
                      onChange={(e) => {
                        const next = [...forces];
                        next[i] = { ...next[i], notes: e.target.value };
                        setForces(next);
                      }}
                      onBlur={() => saveEdits(forces)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Sparkles className="size-4 text-primary shrink-0" />
              Overall industry attractiveness: <strong className="text-foreground">{forces.length > 0 ? ((forces.reduce((a, f) => a + f.intensity, 0) / forces.length) <= 2.5 ? "Attractive" : (forces.reduce((a, f) => a + f.intensity, 0) / forces.length) <= 3.5 ? "Moderate" : "Challenging") : "N/A"}</strong> — Average intensity: {forces.length > 0 ? (forces.reduce((a, f) => a + f.intensity, 0) / forces.length).toFixed(1) : "0"}/5
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── BCG Matrix ───────────────────────────────────────────────────────────────

export function BcgCanvas({ engagementId, data }: FrameworkProps) {
  const [products, setProducts] = useState<Array<{ name: string; growth: number; share: number; revenue: number; quadrant: string }>>([]);

  useEffect(() => {
    if (data?.status === "done" && data.data !== "{}") {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.products) setProducts(parsed.products);
      } catch { /* ignore */ }
    }
  }, [data?.data, data?.status]);

  const quadrantStyles: Record<string, { bg: string; label: string; icon: string }> = {
    "star": { bg: "bg-yellow-500/10 text-yellow-600", label: "Star", icon: FA.star },
    "cash-cow": { bg: "bg-green-500/10 text-green-600", label: "Cash Cow", icon: FA.cashCow },
    "question-mark": { bg: "bg-blue-500/10 text-blue-600", label: "Question Mark", icon: FA.questionMark },
    "dog": { bg: "bg-red-500/10 text-red-600", label: "Dog", icon: FA.dog },
  };

  const hasData = products.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" /> BCG Growth-Share Matrix
            </CardTitle>
            <CardDescription>Classify business units by market growth rate and relative market share</CardDescription>
          </div>
          <AiGenerateButton engagementId={engagementId} framework="bcg" status={data?.status} label="BCG" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FrameworkStatusBanner data={data ?? undefined} />
        {!hasData && data?.status !== "generating" && <EmptyFramework name="BCG Matrix" />}
        {hasData && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20 min-h-[120px]">
                <h4 className="text-xs font-semibold text-blue-600 mb-2"><FaIcon icon={FA.questionMark} className="text-xs" /> Question Marks — High Growth / Low Share</h4>
                {products.filter((p) => p.quadrant === "question-mark").map((p) => (
                  <Badge key={p.name} variant="secondary" className="mr-1 mb-1">{p.name}</Badge>
                ))}
              </div>
              <div className="border rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-950/20 min-h-[120px]">
                <h4 className="text-xs font-semibold text-yellow-600 mb-2"><FaIcon icon={FA.star} className="text-xs" /> Stars — High Growth / High Share</h4>
                {products.filter((p) => p.quadrant === "star").map((p) => (
                  <Badge key={p.name} variant="secondary" className="mr-1 mb-1">{p.name}</Badge>
                ))}
              </div>
              <div className="border rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20 min-h-[120px]">
                <h4 className="text-xs font-semibold text-red-600 mb-2"><FaIcon icon={FA.dog} className="text-xs" /> Dogs — Low Growth / Low Share</h4>
                {products.filter((p) => p.quadrant === "dog").map((p) => (
                  <Badge key={p.name} variant="secondary" className="mr-1 mb-1">{p.name}</Badge>
                ))}
              </div>
              <div className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20 min-h-[120px]">
                <h4 className="text-xs font-semibold text-green-600 mb-2"><FaIcon icon={FA.cashCow} className="text-xs" /> Cash Cows — Low Growth / High Share</h4>
                {products.filter((p) => p.quadrant === "cash-cow").map((p) => (
                  <Badge key={p.name} variant="secondary" className="mr-1 mb-1">{p.name}</Badge>
                ))}
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium">Product / BU</th>
                    <th className="text-right p-2 font-medium">Growth %</th>
                    <th className="text-right p-2 font-medium">Rel. Share %</th>
                    <th className="text-right p-2 font-medium">Revenue $M</th>
                    <th className="text-center p-2 font-medium">Quadrant</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium">{p.name}</td>
                      <td className="p-2 text-right">{p.growth}%</td>
                      <td className="p-2 text-right">{p.share}%</td>
                      <td className="p-2 text-right">${p.revenue}M</td>
                      <td className="p-2 text-center">
                        <Badge variant="secondary" className={quadrantStyles[p.quadrant]?.bg}>
                          <FaIcon icon={quadrantStyles[p.quadrant]?.icon} className="text-xs" />
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Ansoff Matrix ────────────────────────────────────────────────────────────

export function AnsoffCanvas({ engagementId, data }: FrameworkProps) {
  const [cells, setCells] = useState<Array<{ label: string; risk: string; strategies: string[] }>>([]);

  useEffect(() => {
    if (data?.status === "done" && data.data !== "{}") {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.cells) setCells(parsed.cells);
      } catch { /* ignore */ }
    }
  }, [data?.data, data?.status]);

  const cellColors: Record<string, string> = {
    "Market Penetration": "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    "Product Development": "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    "Market Development": "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
    "Diversification": "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  };

  const posLabels: Record<string, string> = {
    "Market Penetration": "Existing Products × Existing Markets",
    "Product Development": "New Products × Existing Markets",
    "Market Development": "Existing Products × New Markets",
    "Diversification": "New Products × New Markets",
  };

  const hasData = cells.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" /> Ansoff Growth Matrix
            </CardTitle>
            <CardDescription>Map growth strategies by product-market combinations</CardDescription>
          </div>
          <AiGenerateButton engagementId={engagementId} framework="ansoff" status={data?.status} label="Ansoff" />
        </div>
      </CardHeader>
      <CardContent>
        <FrameworkStatusBanner data={data ?? undefined} />
        {!hasData && data?.status !== "generating" && <EmptyFramework name="Ansoff Matrix" />}
        {hasData && (
          <div className="grid grid-cols-2 gap-3">
            {cells.map((cell) => (
              <div key={cell.label} className={`rounded-lg border p-4 ${cellColors[cell.label] || "bg-muted"}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{cell.label}</h4>
                  <Badge variant="secondary" className="text-[10px]">Risk: {cell.risk}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">{posLabels[cell.label] || ""}</p>
                <div className="space-y-1.5">
                  {cell.strategies.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── SIPOC Canvas ─────────────────────────────────────────────────────────────

export function SipocCanvas({ engagementId, data }: FrameworkProps) {
  const saveFramework = useMutation(api.frameworkData.save);
  const [rows, setRows] = useState<Array<{ suppliers: string; inputs: string; process: string; outputs: string; customers: string }>>([]);

  useEffect(() => {
    if (data?.status === "done" && data.data !== "{}") {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.rows) setRows(parsed.rows);
      } catch { /* ignore */ }
    }
  }, [data?.data, data?.status]);

  const columns = ["suppliers", "inputs", "process", "outputs", "customers"] as const;
  const headers = ["Suppliers", "Inputs", "Process", "Outputs", "Customers"];
  const headerColors = ["text-blue-600", "text-indigo-600", "text-violet-600", "text-purple-600", "text-pink-600"];

  const saveEdits = (updated: typeof rows) => {
    saveFramework({ engagementId, framework: "sipoc", data: JSON.stringify({ rows: updated }), status: "done" });
  };

  const hasData = rows.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="size-5 text-primary" /> SIPOC Process Map
            </CardTitle>
            <CardDescription>Map Suppliers → Inputs → Process → Outputs → Customers</CardDescription>
          </div>
          <AiGenerateButton engagementId={engagementId} framework="sipoc" status={data?.status} label="SIPOC" />
        </div>
      </CardHeader>
      <CardContent>
        <FrameworkStatusBanner data={data ?? undefined} />
        {!hasData && data?.status !== "generating" && <EmptyFramework name="SIPOC" />}
        {hasData && (
          <>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    {headers.map((h, i) => (
                      <th key={h} className={`text-left p-3 font-semibold text-xs ${headerColors[i]}`}>{h}</th>
                    ))}
                    <th className="p-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} className="border-t">
                      {columns.map((col) => (
                        <td key={col} className="p-2">
                          <Textarea
                            value={row[col]}
                            onChange={(e) => {
                              const next = [...rows];
                              next[ri] = { ...next[ri], [col]: e.target.value };
                              setRows(next);
                            }}
                            onBlur={() => saveEdits(rows)}
                            rows={2}
                            className="text-xs min-w-[140px]"
                          />
                        </td>
                      ))}
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => {
                            const next = rows.filter((_, i) => i !== ri);
                            setRows(next);
                            saveEdits(next);
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              onClick={() => {
                const next = [...rows, { suppliers: "", inputs: "", process: "", outputs: "", customers: "" }];
                setRows(next);
              }}
            >
              <Plus className="size-3" /> Add Process Row
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Value Chain Canvas ───────────────────────────────────────────────────────

export function ValueChainCanvas({ engagementId, data }: FrameworkProps) {
  const [primary, setPrimary] = useState<Array<{ activity: string; cost: number; diff: string; notes: string }>>([]);
  const [support, setSupport] = useState<string[]>([]);

  useEffect(() => {
    if (data?.status === "done" && data.data !== "{}") {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.primary) setPrimary(parsed.primary);
        if (parsed.support) setSupport(parsed.support);
      } catch { /* ignore */ }
    }
  }, [data?.data, data?.status]);

  const hasData = primary.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="size-5 text-primary" /> Porter Value Chain
            </CardTitle>
            <CardDescription>Map primary and support activities to identify cost/differentiation advantages</CardDescription>
          </div>
          <AiGenerateButton engagementId={engagementId} framework="value_chain" status={data?.status} label="Value Chain" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FrameworkStatusBanner data={data ?? undefined} />
        {!hasData && data?.status !== "generating" && <EmptyFramework name="Value Chain" />}
        {hasData && (
          <>
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Support Activities</h4>
              <div className="flex flex-wrap gap-2">
                {support.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Primary Activities → Margin</h4>
              <div className="flex gap-1 items-stretch">
                {primary.map((act, i) => (
                  <div key={i} className="flex-1 border rounded-lg p-3 bg-primary/5 relative group">
                    {i < primary.length - 1 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-primary">
                        <ChevronRight className="size-4" />
                      </div>
                    )}
                    <h5 className="text-xs font-semibold mb-2">{act.activity}</h5>
                    <div className="text-xs text-muted-foreground mb-1">Cost: {act.cost}%</div>
                    <div className="w-full bg-muted rounded h-1.5 mb-2">
                      <div className="bg-primary rounded h-1.5" style={{ width: `${act.cost}%` }} />
                    </div>
                    <Badge variant="secondary" className="text-[10px] mb-1">
                      Diff: {act.diff}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{act.notes}</p>
                  </div>
                ))}
                <div className="w-16 border rounded-lg bg-green-500/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{Math.max(0, 100 - primary.reduce((a, p) => a + p.cost, 0))}%</div>
                    <div className="text-[10px] text-green-600 font-medium">Margin</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Root Cause Canvas ────────────────────────────────────────────────────────

export function RootCauseCanvas({ engagementId, data }: FrameworkProps) {
  const saveFramework = useMutation(api.frameworkData.save);
  const [mode, setMode] = useState<"5whys" | "ishikawa">("5whys");
  const [problem, setProblem] = useState("");
  const [whys, setWhys] = useState<string[]>([]);
  const [ishikawa, setIshikawa] = useState<Array<{ name: string; items: string[] }>>([]);

  useEffect(() => {
    if (data?.status === "done" && data.data !== "{}") {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.problem) setProblem(parsed.problem);
        if (parsed.whys) setWhys(parsed.whys);
        if (parsed.ishikawa) setIshikawa(parsed.ishikawa);
      } catch { /* ignore */ }
    }
  }, [data?.data, data?.status]);

  const saveEdits = () => {
    saveFramework({
      engagementId,
      framework: "root_cause",
      data: JSON.stringify({ problem, whys, ishikawa }),
      status: "done",
    });
  };

  const hasData = whys.length > 0 || ishikawa.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-5 text-primary" /> Root Cause Analysis
            </CardTitle>
            <CardDescription>
              <div className="flex gap-2 mt-2">
                <Button variant={mode === "5whys" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setMode("5whys")}>
                  5 Whys
                </Button>
                <Button variant={mode === "ishikawa" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setMode("ishikawa")}>
                  Ishikawa (Fishbone)
                </Button>
              </div>
            </CardDescription>
          </div>
          <AiGenerateButton engagementId={engagementId} framework="root_cause" status={data?.status} label="Root Cause" />
        </div>
      </CardHeader>
      <CardContent>
        <FrameworkStatusBanner data={data ?? undefined} />
        {!hasData && data?.status !== "generating" && <EmptyFramework name="Root Cause" />}
        {hasData && mode === "5whys" ? (
          <div className="space-y-2">
            {whys.map((why, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="flex flex-col items-center">
                  <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${i === whys.length - 1 ? "bg-red-500 text-white" : "bg-primary/10 text-primary"}`}>
                    W{i + 1}
                  </div>
                  {i < whys.length - 1 && <div className="w-px h-4 bg-border" />}
                </div>
                <div className="flex-1 pt-1">
                  <Label className="text-[10px] text-muted-foreground">Why #{i + 1}{i === whys.length - 1 ? " — Root Cause" : ""}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={why}
                      onChange={(e) => {
                        const next = [...whys];
                        next[i] = e.target.value;
                        setWhys(next);
                      }}
                      onBlur={saveEdits}
                      className={`mt-1 ${i === whys.length - 1 ? "border-red-300 dark:border-red-700" : ""}`}
                    />
                    {whys.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const next = whys.filter((_, j) => j !== i);
                          setWhys(next);
                          saveFramework({
                            engagementId, framework: "root_cause",
                            data: JSON.stringify({ problem, whys: next, ishikawa }), status: "done",
                          });
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setWhys([...whys, ""])}>
              <Plus className="size-3" /> Add Why
            </Button>
          </div>
        ) : hasData && mode === "ishikawa" ? (
          <div className="space-y-3">
            {problem && (
              <div className="bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                <span className="font-semibold text-sm text-red-600">Problem: {problem}</span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ishikawa.map((cat) => (
                <div key={cat.name} className="border rounded-lg p-3">
                  <h4 className="text-xs font-semibold mb-2 text-primary">{cat.name}</h4>
                  {cat.items.map((item, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                      <Minus className="size-2.5 shrink-0" /> {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── Empty Framework State ────────────────────────────────────────────────────

export function EmptyFramework({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="size-6 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Generate {name}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Click the <strong>Generate</strong> button above to have AI analyze your engagement and populate this framework, or use <strong>Generate All</strong> to run all 8 at once.
      </p>
    </div>
  );
}

// ─── Hypothesis Panel ─────────────────────────────────────────────────────────