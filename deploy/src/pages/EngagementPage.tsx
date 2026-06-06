import { useState, useCallback, useEffect } from "react";
import { FaIcon, FA } from "@/components/FaIcon";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileBarChart,
  GitBranch,
  Globe,
  Layers,
  LineChart,
  Loader2,
  Minus,
  Network,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "scoping" | "frameworks" | "hypothesis" | "analysis" | "synthesis" | "communication" | "export";

type FrameworkTab = "swot" | "pestel" | "porter5" | "bcg" | "ansoff" | "sipoc" | "value_chain" | "root_cause";

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES: Array<{ id: Stage; label: string; icon: string; gate?: string }> = [
  { id: "scoping", label: "Scope", icon: FA.scope, gate: "G1" },
  { id: "frameworks", label: "Diagnose", icon: FA.diagnose, gate: "G2" },
  { id: "hypothesis", label: "Hypothesize", icon: FA.hypothesize, gate: "G3" },
  { id: "analysis", label: "Analyze", icon: FA.analyze },
  { id: "synthesis", label: "Synthesize", icon: FA.synthesize, gate: "G4" },
  { id: "communication", label: "Communicate", icon: FA.communicate, gate: "G5" },
  { id: "export", label: "Export", icon: FA.export },
];

const FRAMEWORK_TABS: Array<{ id: FrameworkTab; label: string; icon: string }> = [
  { id: "swot", label: "SWOT", icon: FA.swot },
  { id: "pestel", label: "PESTEL", icon: FA.pestel },
  { id: "porter5", label: "Porter's 5", icon: FA.porter5 },
  { id: "bcg", label: "BCG", icon: FA.bcg },
  { id: "ansoff", label: "Ansoff", icon: FA.ansoff },
  { id: "sipoc", label: "SIPOC", icon: FA.sipoc },
  { id: "value_chain", label: "Value Chain", icon: FA.valueChain },
  { id: "root_cause", label: "Root Cause", icon: FA.rootCause },
];

// ─── Main Engagement Page ─────────────────────────────────────────────────────

export function EngagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const engagementId = id as Id<"engagements">;
  const [currentStage, setCurrentStage] = useState<Stage>("scoping");
  const [activeFramework, setActiveFramework] = useState<FrameworkTab>("swot");

  // ─── Load engagement from Convex ─────────────────────────
  const engagement = useQuery(api.engagements.get, { id: engagementId });
  const frameworkDataList = useQuery(api.frameworkData.listByEngagement, { engagementId });
  const initializeFrameworks = useMutation(api.frameworkData.initializeAll);
  const updateStage = useMutation(api.engagements.updateStage);

  // Initialize frameworks on first load
  useEffect(() => {
    if (engagement && frameworkDataList && frameworkDataList.length === 0) {
      initializeFrameworks({ engagementId });
    }
  }, [engagement?._id, frameworkDataList?.length]);

  // Sync stage from engagement
  useEffect(() => {
    if (engagement?.stage) {
      setCurrentStage(engagement.stage as Stage);
    }
  }, [engagement?.stage]);

  // Get framework data by type
  const getFrameworkData = useCallback((fw: string) => {
    return frameworkDataList?.find((f) => f.framework === fw);
  }, [frameworkDataList]);

  // Count completed frameworks
  const completedFrameworks = frameworkDataList?.filter((f) => f.status === "done").length ?? 0;
  const generatingFrameworks = frameworkDataList?.filter((f) => f.status === "generating").length ?? 0;

  const handleStageChange = (stage: Stage) => {
    setCurrentStage(stage);
    updateStage({ id: engagementId, stage });
  };

  if (!engagement) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{engagement.company}</h1>
          <p className="text-sm text-muted-foreground">{engagement.industry}{engagement.question ? ` — ${engagement.question}` : ""}</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {STAGES.find((s) => s.id === currentStage)?.label || currentStage}
        </Badge>
      </div>

      {/* Workflow Stepper */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STAGES.map((stage, i) => {
              const isCurrent = stage.id === currentStage;
              const isPast = STAGES.findIndex((s) => s.id === currentStage) > i;
              return (
                <div key={stage.id} className="flex items-center">
                  {i > 0 && (
                    <div className={`w-6 h-px mx-1 ${isPast ? "bg-primary" : "bg-border"}`} />
                  )}
                  <button
                    onClick={() => handleStageChange(stage.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isPast
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <FaIcon icon={stage.icon} className="text-xs" />
                    <span className="hidden sm:inline">{stage.label}</span>
                    {stage.gate && (
                      <span className={`text-[10px] ml-1 px-1 rounded ${isCurrent ? "bg-primary-foreground/20" : "bg-muted-foreground/10"}`}>
                        {stage.gate}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage Content */}
      {currentStage === "scoping" && <ScopingPanel engagement={engagement} engagementId={engagementId} />}
      {currentStage === "frameworks" && (
        <div className="space-y-4">
          {/* Framework Tabs */}
          <Card>
            <CardContent className="py-2">
              <div className="flex flex-wrap gap-1">
                {FRAMEWORK_TABS.map((fw) => {
                  const fwData = getFrameworkData(fw.id);
                  const isDone = fwData?.status === "done";
                  const isGenerating = fwData?.status === "generating";
                  return (
                    <button
                      key={fw.id}
                      onClick={() => setActiveFramework(fw.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        activeFramework === fw.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <FaIcon icon={fw.icon} className="text-xs" />
                      {fw.label}
                      {isDone && <CheckCircle2 className="size-3 text-green-400" />}
                      {isGenerating && <Loader2 className="size-3 animate-spin" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {completedFrameworks}/8 frameworks completed
                  {generatingFrameworks > 0 && ` · ${generatingFrameworks} generating...`}
                </span>
                <GenerateAllButton engagementId={engagementId} />
              </div>
            </CardContent>
          </Card>
          {activeFramework === "swot" && <SwotCanvas engagementId={engagementId} data={getFrameworkData("swot")} />}
          {activeFramework === "pestel" && <PestelCanvas engagementId={engagementId} data={getFrameworkData("pestel")} />}
          {activeFramework === "porter5" && <Porter5Canvas engagementId={engagementId} data={getFrameworkData("porter5")} />}
          {activeFramework === "bcg" && <BcgCanvas engagementId={engagementId} data={getFrameworkData("bcg")} />}
          {activeFramework === "ansoff" && <AnsoffCanvas engagementId={engagementId} data={getFrameworkData("ansoff")} />}
          {activeFramework === "sipoc" && <SipocCanvas engagementId={engagementId} data={getFrameworkData("sipoc")} />}
          {activeFramework === "value_chain" && <ValueChainCanvas engagementId={engagementId} data={getFrameworkData("value_chain")} />}
          {activeFramework === "root_cause" && <RootCauseCanvas engagementId={engagementId} data={getFrameworkData("root_cause")} />}
        </div>
      )}
      {currentStage === "hypothesis" && <HypothesisPanel engagement={engagement} engagementId={engagementId} frameworkDataList={frameworkDataList ?? []} />}
      {currentStage === "analysis" && <AnalysisPanel />}
      {currentStage === "synthesis" && <SynthesisPanel />}
      {currentStage === "communication" && <CommunicationPanel />}
      {currentStage === "export" && <ExportPanel />}
    </div>
  );
}

// ─── Generate All Button ──────────────────────────────────────────────────────

function GenerateAllButton({ engagementId }: { engagementId: Id<"engagements"> }) {
  const [generating, setGenerating] = useState(false);
  const generateAll = useAction(api.frameworkAi.generateAll);

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

  return (
    <Button
      size="sm"
      className="gap-2 text-xs"
      onClick={handleGenerateAll}
      disabled={generating}
    >
      {generating ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
      {generating ? "Generating all..." : "Generate All with AI"}
    </Button>
  );
}

// ─── AI Generate Button (reusable) ────────────────────────────────────────────

function AiGenerateButton({
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

// ─── Scoping Panel ────────────────────────────────────────────────────────────

interface EngagementData {
  _id: Id<"engagements">;
  company: string;
  industry: string;
  question?: string | null;
  geographies?: string | null;
  competitors?: string | null;
  stage: string;
  progress: number;
}

function ScopingPanel({ engagement, engagementId }: { engagement: EngagementData; engagementId: Id<"engagements"> }) {
  const [situation, setSituation] = useState(
    `We are analyzing ${engagement.company} in the ${engagement.industry} industry.`
  );
  const [complication, setComplication] = useState(engagement.question ?? "");
  const [question, setQuestion] = useState(engagement.question ?? "");
  const [answer, setAnswer] = useState("");
  const [approved, setApproved] = useState(false);
  const updateStage = useMutation(api.engagements.updateStage);

  const handleApprove = () => {
    setApproved(!approved);
    if (!approved) {
      updateStage({ id: engagementId, stage: "frameworks", progress: 14 });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-primary" />
          Problem Scoping — SCQA Framework
        </CardTitle>
        <CardDescription>
          Frame the strategic question using Situation → Complication → Question → Answer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <span className="size-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-[10px] font-bold">S</span>
              Situation
            </Label>
            <Textarea value={situation} onChange={(e) => setSituation(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <span className="size-5 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-[10px] font-bold">C</span>
              Complication
            </Label>
            <Textarea value={complication} onChange={(e) => setComplication(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <span className="size-5 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center text-[10px] font-bold">Q</span>
              Question
            </Label>
            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <span className="size-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-[10px] font-bold">A</span>
              Answer (Hypothesis)
            </Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} />
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Gate G1: Approve problem framing before proceeding</span>
          </div>
          <Button
            variant={approved ? "outline" : "default"}
            className="gap-2"
            onClick={handleApprove}
          >
            {approved ? <Check className="size-4" /> : <Shield className="size-4" />}
            {approved ? "G1 Approved" : "Approve G1"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Framework Status Banner ──────────────────────────────────────────────────

function FrameworkStatusBanner({ data, error }: { data?: { status: string; error?: string }; error?: string }) {
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

interface FrameworkProps {
  engagementId: Id<"engagements">;
  data?: { status: string; data: string; error?: string } | null;
}

function SwotCanvas({ engagementId, data }: FrameworkProps) {
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

const PESTEL_CATEGORIES = [
  { id: "political", label: "Political", icon: FA.political, color: "bg-red-500/10 border-red-200 dark:border-red-800" },
  { id: "economic", label: "Economic", icon: FA.economic, color: "bg-blue-500/10 border-blue-200 dark:border-blue-800" },
  { id: "social", label: "Social", icon: FA.social, color: "bg-green-500/10 border-green-200 dark:border-green-800" },
  { id: "technological", label: "Technological", icon: FA.technological, color: "bg-purple-500/10 border-purple-200 dark:border-purple-800" },
  { id: "environmental", label: "Environmental", icon: FA.environmental, color: "bg-emerald-500/10 border-emerald-200 dark:border-emerald-800" },
  { id: "legal", label: "Legal", icon: FA.legal, color: "bg-orange-500/10 border-orange-200 dark:border-orange-800" },
];

function PestelCanvas({ engagementId, data }: FrameworkProps) {
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

const FORCE_ICONS: Record<string, string> = {
  "Competitive Rivalry": FA.rivalry,
  "Threat of New Entrants": FA.newEntrants,
  "Bargaining Power of Buyers": FA.buyers,
  "Bargaining Power of Suppliers": FA.suppliers,
  "Threat of Substitutes": FA.substitutes,
};

function Porter5Canvas({ engagementId, data }: FrameworkProps) {
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

function BcgCanvas({ engagementId, data }: FrameworkProps) {
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

function AnsoffCanvas({ engagementId, data }: FrameworkProps) {
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

function SipocCanvas({ engagementId, data }: FrameworkProps) {
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

function ValueChainCanvas({ engagementId, data }: FrameworkProps) {
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

function RootCauseCanvas({ engagementId, data }: FrameworkProps) {
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

function EmptyFramework({ name }: { name: string }) {
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

function HypothesisPanel({ frameworkDataList }: {
  engagement: EngagementData;
  engagementId: Id<"engagements">;
  frameworkDataList: Array<{ framework: string; data: string; status: string }>;
}) {
  const [hypotheses, setHypotheses] = useState([
    { id: "H1", text: "", status: "open", children: [] as Array<{ id: string; text: string; status: string }> },
  ]);

  // Check if frameworks have generated data to pull insights from
  const completedFrameworks = frameworkDataList.filter((f) => f.status === "done").length;

  const statusStyles: Record<string, string> = {
    open: "bg-muted text-muted-foreground",
    testing: "bg-blue-500/10 text-blue-600",
    confirmed: "bg-green-500/10 text-green-600",
    rejected: "bg-red-500/10 text-red-600",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="size-5 text-primary" /> Hypothesis Tree
        </CardTitle>
        <CardDescription>
          Structure hypotheses hierarchically — each must be testable and MECE
          {completedFrameworks > 0 && (
            <span className="ml-2 text-xs text-green-600">
              <CheckCircle2 className="size-3 inline mr-1" />{completedFrameworks} framework{completedFrameworks !== 1 ? "s" : ""} completed — use insights to build hypotheses
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hypotheses.map((h, hi) => (
          <div key={h.id} className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Network className="size-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{h.id}</span>
                  <Select
                    value={h.status}
                    onValueChange={(val) => {
                      const next = [...hypotheses];
                      next[hi] = { ...next[hi], status: val };
                      setHypotheses(next);
                    }}
                  >
                    <SelectTrigger className="h-5 w-24 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">open</SelectItem>
                      <SelectItem value="testing">testing</SelectItem>
                      <SelectItem value="confirmed">confirmed</SelectItem>
                      <SelectItem value="rejected">rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={h.text}
                  onChange={(e) => {
                    const next = [...hypotheses];
                    next[hi] = { ...next[hi], text: e.target.value };
                    setHypotheses(next);
                  }}
                  placeholder="Enter hypothesis..."
                  className="mb-2"
                />
                {h.children.length > 0 && (
                  <div className="mt-3 ml-4 border-l-2 border-muted pl-4 space-y-2">
                    {h.children.map((child, ci) => (
                      <div key={child.id} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{child.id}</span>
                        <Input
                          value={child.text}
                          onChange={(e) => {
                            const next = [...hypotheses];
                            next[hi] = { ...next[hi], children: [...next[hi].children] };
                            next[hi].children[ci] = { ...next[hi].children[ci], text: e.target.value };
                            setHypotheses(next);
                          }}
                          className="h-8 text-sm"
                          placeholder="Sub-hypothesis..."
                        />
                        <Badge variant="secondary" className={`text-[10px] ml-auto shrink-0 ${statusStyles[child.status]}`}>{child.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs gap-1"
                  onClick={() => {
                    const next = [...hypotheses];
                    const childId = `${h.id}.${h.children.length + 1}`;
                    next[hi] = { ...next[hi], children: [...next[hi].children, { id: childId, text: "", status: "open" }] };
                    setHypotheses(next);
                  }}
                >
                  <Plus className="size-3" /> Add sub-hypothesis
                </Button>
              </div>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setHypotheses([...hypotheses, {
              id: `H${hypotheses.length + 1}`,
              text: "",
              status: "open",
              children: [],
            }]);
          }}
        >
          <Plus className="size-3" /> Add Hypothesis
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Shield className="size-4 text-primary shrink-0" />
          Gate G3: Approve hypothesis tree before proceeding to analysis
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Analysis Panel ───────────────────────────────────────────────────────────

function AnalysisPanel() {
  const methods = [
    { name: "Descriptive", desc: "Summarize what the data shows", icon: FA.descriptive },
    { name: "Comparative", desc: "Benchmark against peers/history", icon: FA.comparative },
    { name: "Causal", desc: "Test cause-effect relationships", icon: FA.causal },
    { name: "Forecasting", desc: "Project future outcomes", icon: "fa-solid fa-wand-magic-sparkles" },
    { name: "Qualitative", desc: "Expert interviews & surveys", icon: "fa-solid fa-comments" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="size-5 text-primary" /> Analysis
        </CardTitle>
        <CardDescription>Test hypotheses using 5 analysis methods — coming in next enhancement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {methods.map((m) => (
            <div key={m.name} className="text-center border rounded-lg p-3">
              <div className="text-xl mb-1"><FaIcon icon={m.icon} /></div>
              <div className="text-xs font-semibold">{m.name}</div>
              <div className="text-[10px] text-muted-foreground">{m.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="size-8 mx-auto mb-3 text-primary/40" />
          <p className="text-sm">Analysis features will use AI to test each hypothesis with the appropriate method.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Synthesis Panel ──────────────────────────────────────────────────────────

function SynthesisPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-5 text-primary" /> Synthesis — Pyramid Principle
        </CardTitle>
        <CardDescription>Structure the narrative: Governing Thought → Key Lines → Supporting Evidence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 text-center">
          <Label className="text-xs text-primary font-semibold">Governing Thought</Label>
          <Textarea placeholder="Enter your governing thought — the one-sentence answer to the strategic question..." className="mt-2 text-center" rows={2} />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{i}</span>
                Key Line {i}
              </h4>
              <Textarea placeholder="Supporting argument..." rows={2} className="text-sm mb-2" />
              <div className="text-xs text-muted-foreground">Evidence will be linked from your analyses</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Shield className="size-4 text-primary shrink-0" />
          Gate G4: Approve pyramid structure before building slides
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Communication Panel ──────────────────────────────────────────────────────

function CommunicationPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="size-5 text-primary" /> Communication — Slide Builder
        </CardTitle>
        <CardDescription>Build the deck with consulting slide grammar: action title ≤14 words + body + sources</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="size-8 mx-auto mb-3 text-primary/40" />
          <p className="text-sm">Slide builder will auto-generate from your pyramid structure and framework outputs.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Shield className="size-4 text-primary shrink-0" />
          Gate G5: Approve final deck before export
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Export Panel ─────────────────────────────────────────────────────────────

function ExportPanel() {
  const [format, setFormat] = useState("pptx");
  const [theme, setTheme] = useState("navy");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-5 text-primary" /> Export
        </CardTitle>
        <CardDescription>Export your strategy deck in multiple formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { id: "pptx", label: "PowerPoint", desc: "Consulting-style PPTX with themes", icon: "fa-solid fa-file-powerpoint" },
            { id: "pdf", label: "PDF Report", desc: "Print-ready strategy report", icon: "fa-solid fa-file-pdf" },
            { id: "html", label: "HTML Slides", desc: "Browser-based presentation", icon: "fa-solid fa-globe" },
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

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="navy">Navy (Classic)</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Slide Size</Label>
            <Select defaultValue="16:9">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                <SelectItem value="4:3">Standard (4:3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full gap-2" size="lg">
          <Download className="size-4" />
          Export as {format.toUpperCase()}
        </Button>
      </CardContent>
    </Card>
  );
}
