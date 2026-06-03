import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Minus,
  Network,
  Pencil,
  Plus,
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
// Tabs available but not currently used
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
// Progress available but not currently used
// import { Progress } from "@/components/ui/progress";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "scoping" | "frameworks" | "hypothesis" | "analysis" | "synthesis" | "communication" | "export";

type FrameworkTab = "swot" | "pestel" | "porter5" | "bcg" | "ansoff" | "sipoc" | "value_chain" | "root_cause";

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES: Array<{ id: Stage; label: string; icon: string; gate?: string }> = [
  { id: "scoping", label: "Scope", icon: "🎯", gate: "G1" },
  { id: "frameworks", label: "Diagnose", icon: "🔍", gate: "G2" },
  { id: "hypothesis", label: "Hypothesize", icon: "💡", gate: "G3" },
  { id: "analysis", label: "Analyze", icon: "📊" },
  { id: "synthesis", label: "Synthesize", icon: "🧩", gate: "G4" },
  { id: "communication", label: "Communicate", icon: "📋", gate: "G5" },
  { id: "export", label: "Export", icon: "📤" },
];

const FRAMEWORK_TABS: Array<{ id: FrameworkTab; label: string; icon: string }> = [
  { id: "swot", label: "SWOT", icon: "🎯" },
  { id: "pestel", label: "PESTEL", icon: "🌍" },
  { id: "porter5", label: "Porter's 5", icon: "⚔️" },
  { id: "bcg", label: "BCG", icon: "📊" },
  { id: "ansoff", label: "Ansoff", icon: "📈" },
  { id: "sipoc", label: "SIPOC", icon: "⚙️" },
  { id: "value_chain", label: "Value Chain", icon: "🔗" },
  { id: "root_cause", label: "Root Cause", icon: "🔍" },
];

// ─── Main Engagement Page ─────────────────────────────────────────────────────

export function EngagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState<Stage>("scoping");
  const [activeFramework, setActiveFramework] = useState<FrameworkTab>("swot");

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Strategy Engagement</h1>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
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
                    onClick={() => setCurrentStage(stage.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isPast
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span>{stage.icon}</span>
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
      {currentStage === "scoping" && <ScopingPanel />}
      {currentStage === "frameworks" && (
        <div className="space-y-4">
          {/* Framework Tabs */}
          <Card>
            <CardContent className="py-2">
              <div className="flex flex-wrap gap-1">
                {FRAMEWORK_TABS.map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => setActiveFramework(fw.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeFramework === fw.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {fw.icon} {fw.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          {activeFramework === "swot" && <SwotCanvas />}
          {activeFramework === "pestel" && <PestelCanvas />}
          {activeFramework === "porter5" && <Porter5Canvas />}
          {activeFramework === "bcg" && <BcgCanvas />}
          {activeFramework === "ansoff" && <AnsoffCanvas />}
          {activeFramework === "sipoc" && <SipocCanvas />}
          {activeFramework === "value_chain" && <ValueChainCanvas />}
          {activeFramework === "root_cause" && <RootCauseCanvas />}
        </div>
      )}
      {currentStage === "hypothesis" && <HypothesisPanel />}
      {currentStage === "analysis" && <AnalysisPanel />}
      {currentStage === "synthesis" && <SynthesisPanel />}
      {currentStage === "communication" && <CommunicationPanel />}
      {currentStage === "export" && <ExportPanel />}
    </div>
  );
}

// ─── Scoping Panel ────────────────────────────────────────────────────────────

function ScopingPanel() {
  const [situation, setSituation] = useState("We are a mid-size B2B SaaS company with $50M ARR, growing 25% YoY, strong in North America.");
  const [complication, setComplication] = useState("Growth is decelerating, and our largest competitor just raised $200M to expand into our core verticals.");
  const [question, setQuestion] = useState("How should we reposition our product and GTM strategy to sustain 30%+ growth over the next 3 years?");
  const [answer, setAnswer] = useState("We should expand into EMEA + mid-market, launch 2 new vertical modules, and shift to PLG motion.");
  const [approved, setApproved] = useState(false);

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
            onClick={() => setApproved(!approved)}
          >
            {approved ? <Check className="size-4" /> : <Shield className="size-4" />}
            {approved ? "G1 Approved ✓" : "Approve G1"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── SWOT Canvas ──────────────────────────────────────────────────────────────

function SwotCanvas() {
  const [items, setItems] = useState<Record<string, string[]>>({
    strengths: ["Strong brand recognition", "Proprietary technology", "Experienced management team"],
    weaknesses: ["Limited geographic reach", "High customer acquisition cost", "Legacy tech debt"],
    opportunities: ["Growing addressable market (+15% CAGR)", "Competitor exit from mid-market", "AI-driven product expansion"],
    threats: ["New entrant with $200M funding", "Regulatory uncertainty in EU", "Margin pressure from commoditization"],
  });

  const colors: Record<string, { bg: string; border: string; icon: string }> = {
    strengths: { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", icon: "💪" },
    weaknesses: { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", icon: "⚠️" },
    opportunities: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", icon: "🌟" },
    threats: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", icon: "🔥" },
  };

  const addItem = (quadrant: string) => {
    setItems((prev) => ({ ...prev, [quadrant]: [...prev[quadrant], ""] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-primary" />
          SWOT Analysis
        </CardTitle>
        <CardDescription>Strengths, Weaknesses, Opportunities, Threats — all items should be MECE</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(items).map(([quadrant, entries]) => (
            <div key={quadrant} className={`rounded-lg border p-4 ${colors[quadrant].bg} ${colors[quadrant].border}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
                  {colors[quadrant].icon} {quadrant}
                </h3>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => addItem(quadrant)}>
                  <Plus className="size-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {entries.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground mt-2 w-4 shrink-0">{i + 1}.</span>
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = { ...items };
                        next[quadrant] = [...entries];
                        next[quadrant][i] = e.target.value;
                        setItems(next);
                      }}
                      className="h-8 text-sm bg-background"
                      placeholder="Add item..."
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── PESTEL Canvas ────────────────────────────────────────────────────────────

function PestelCanvas() {
  const categories = [
    { id: "political", label: "Political", icon: "🏛️", color: "bg-red-500/10 border-red-200 dark:border-red-800", items: ["Trade policy shifts post-2025", "Government subsidies for green tech"] },
    { id: "economic", label: "Economic", icon: "💰", color: "bg-blue-500/10 border-blue-200 dark:border-blue-800", items: ["Interest rate environment", "FX volatility in emerging markets"] },
    { id: "social", label: "Social", icon: "👥", color: "bg-green-500/10 border-green-200 dark:border-green-800", items: ["Remote work adoption", "Gen-Z buying preferences"] },
    { id: "technological", label: "Technological", icon: "🔧", color: "bg-purple-500/10 border-purple-200 dark:border-purple-800", items: ["Generative AI disruption", "Edge computing adoption"] },
    { id: "environmental", label: "Environmental", icon: "🌱", color: "bg-emerald-500/10 border-emerald-200 dark:border-emerald-800", items: ["Carbon reporting requirements", "Circular economy mandates"] },
    { id: "legal", label: "Legal", icon: "⚖️", color: "bg-orange-500/10 border-orange-200 dark:border-orange-800", items: ["GDPR enforcement tightening", "AI regulation (EU AI Act)"] },
  ];

  const [data, setData] = useState(categories.map((c) => ({ ...c, items: [...c.items] })));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-5 text-primary" /> PESTEL Analysis
        </CardTitle>
        <CardDescription>Political, Economic, Social, Technological, Environmental, Legal factors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.map((cat, ci) => (
            <div key={cat.id} className={`rounded-lg border p-4 ${cat.color}`}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                {cat.icon} {cat.label}
              </h3>
              <div className="space-y-2">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-3">{ii + 1}</span>
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = [...data];
                        next[ci] = { ...next[ci], items: [...next[ci].items] };
                        next[ci].items[ii] = e.target.value;
                        setData(next);
                      }}
                      className="h-7 text-xs bg-background"
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs w-full"
                  onClick={() => {
                    const next = [...data];
                    next[ci] = { ...next[ci], items: [...next[ci].items, ""] };
                    setData(next);
                  }}
                >
                  <Plus className="size-3 mr-1" /> Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Porter's 5 Forces ───────────────────────────────────────────────────────

function Porter5Canvas() {
  const [forces, setForces] = useState([
    { name: "Competitive Rivalry", intensity: 4, notes: "Fragmented market with 3 major players. Price competition increasing.", icon: "⚔️" },
    { name: "Threat of New Entrants", intensity: 3, notes: "Moderate barriers (capital + regulations). AI lowering tech barriers.", icon: "🚪" },
    { name: "Bargaining Power of Buyers", intensity: 3, notes: "Enterprise clients have leverage. SMB more fragmented.", icon: "🛒" },
    { name: "Bargaining Power of Suppliers", intensity: 2, notes: "Cloud infra = AWS/GCP duopoly. LLM providers consolidating.", icon: "🏭" },
    { name: "Threat of Substitutes", intensity: 3, notes: "DIY analytics, in-house teams, open-source tools.", icon: "🔄" },
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-5 text-primary" /> Porter's Five Forces
        </CardTitle>
        <CardDescription>Assess industry attractiveness through 5 competitive forces</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual radar-like layout */}
        <div className="grid gap-3">
          {forces.map((force, i) => (
            <div key={force.name} className="rounded-lg border p-4 flex items-start gap-4">
              <div className="text-2xl">{force.icon}</div>
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
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Sparkles className="size-4 text-primary shrink-0" />
          Overall industry attractiveness: <strong className="text-foreground">Moderate</strong> — Average intensity: {(forces.reduce((a, f) => a + f.intensity, 0) / forces.length).toFixed(1)}/5
        </div>
      </CardContent>
    </Card>
  );
}

// ─── BCG Matrix ───────────────────────────────────────────────────────────────

function BcgCanvas() {
  const [products, _setProducts] = useState([
    { name: "Core Platform", growth: 25, share: 65, revenue: 30, quadrant: "star" },
    { name: "Analytics Add-on", growth: 40, share: 40, revenue: 10, quadrant: "star" },
    { name: "Legacy Module", growth: 5, share: 55, revenue: 15, quadrant: "cash-cow" },
    { name: "New AI Feature", growth: 60, share: 10, revenue: 3, quadrant: "question-mark" },
    { name: "On-Prem Edition", growth: -5, share: 15, revenue: 8, quadrant: "dog" },
  ]);

  const quadrantStyles: Record<string, { bg: string; label: string; icon: string }> = {
    "star": { bg: "bg-yellow-500/10 text-yellow-600", label: "⭐ Star", icon: "⭐" },
    "cash-cow": { bg: "bg-green-500/10 text-green-600", label: "🐄 Cash Cow", icon: "🐄" },
    "question-mark": { bg: "bg-blue-500/10 text-blue-600", label: "❓ Question Mark", icon: "❓" },
    "dog": { bg: "bg-red-500/10 text-red-600", label: "🐕 Dog", icon: "🐕" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" /> BCG Growth-Share Matrix
        </CardTitle>
        <CardDescription>Classify business units by market growth rate and relative market share</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 2x2 Matrix Visual */}
        <div className="grid grid-cols-2 gap-2">
          <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20 min-h-[120px]">
            <h4 className="text-xs font-semibold text-blue-600 mb-2">❓ Question Marks — High Growth / Low Share</h4>
            {products.filter((p) => p.quadrant === "question-mark").map((p) => (
              <Badge key={p.name} variant="secondary" className="mr-1 mb-1">{p.name}</Badge>
            ))}
          </div>
          <div className="border rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-950/20 min-h-[120px]">
            <h4 className="text-xs font-semibold text-yellow-600 mb-2">⭐ Stars — High Growth / High Share</h4>
            {products.filter((p) => p.quadrant === "star").map((p) => (
              <Badge key={p.name} variant="secondary" className="mr-1 mb-1">{p.name}</Badge>
            ))}
          </div>
          <div className="border rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20 min-h-[120px]">
            <h4 className="text-xs font-semibold text-red-600 mb-2">🐕 Dogs — Low Growth / Low Share</h4>
            {products.filter((p) => p.quadrant === "dog").map((p) => (
              <Badge key={p.name} variant="secondary" className="mr-1 mb-1">{p.name}</Badge>
            ))}
          </div>
          <div className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20 min-h-[120px]">
            <h4 className="text-xs font-semibold text-green-600 mb-2">🐄 Cash Cows — Low Growth / High Share</h4>
            {products.filter((p) => p.quadrant === "cash-cow").map((p) => (
              <Badge key={p.name} variant="secondary" className="mr-1 mb-1">{p.name}</Badge>
            ))}
          </div>
        </div>

        {/* Product table */}
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
                      {quadrantStyles[p.quadrant]?.icon}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Ansoff Matrix ────────────────────────────────────────────────────────────

function AnsoffCanvas() {
  const cells = [
    { label: "Market Penetration", pos: "Existing Products × Existing Markets", risk: "Low", color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800", strategies: ["Increase marketing spend by 30%", "Launch loyalty program", "Price optimization"] },
    { label: "Product Development", pos: "New Products × Existing Markets", risk: "Medium", color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800", strategies: ["AI analytics module", "Mobile-first experience", "API marketplace"] },
    { label: "Market Development", pos: "Existing Products × New Markets", risk: "Medium", color: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800", strategies: ["EMEA expansion", "Mid-market segment", "Channel partnerships in APAC"] },
    { label: "Diversification", pos: "New Products × New Markets", risk: "High", color: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800", strategies: ["Consulting services arm", "Acquire fintech startup"] },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" /> Ansoff Growth Matrix
        </CardTitle>
        <CardDescription>Map growth strategies by product-market combinations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {cells.map((cell) => (
            <div key={cell.label} className={`rounded-lg border p-4 ${cell.color}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{cell.label}</h4>
                <Badge variant="secondary" className="text-[10px]">Risk: {cell.risk}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">{cell.pos}</p>
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
      </CardContent>
    </Card>
  );
}

// ─── SIPOC Canvas ─────────────────────────────────────────────────────────────

function SipocCanvas() {
  const [rows, setRows] = useState([
    { suppliers: "Cloud providers, Data vendors", inputs: "Raw data, API keys, Config", process: "Data ingestion & ETL", outputs: "Clean dataset, Anomaly report", customers: "Analytics team, Product managers" },
    { suppliers: "Product team, Sales", inputs: "Feature requests, Market feedback", process: "Feature prioritization", outputs: "Roadmap, Sprint backlog", customers: "Engineering, Stakeholders" },
  ]);

  const columns = ["suppliers", "inputs", "process", "outputs", "customers"] as const;
  const headers = ["Suppliers", "Inputs", "Process", "Outputs", "Customers"];
  const headerColors = ["text-blue-600", "text-indigo-600", "text-violet-600", "text-purple-600", "text-pink-600"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="size-5 text-primary" /> SIPOC Process Map
        </CardTitle>
        <CardDescription>Map Suppliers → Inputs → Process → Outputs → Customers</CardDescription>
      </CardHeader>
      <CardContent>
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
                        rows={2}
                        className="text-xs min-w-[140px]"
                      />
                    </td>
                  ))}
                  <td className="p-2">
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => setRows(rows.filter((_, i) => i !== ri))}>
                      <Trash2 className="size-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setRows([...rows, { suppliers: "", inputs: "", process: "", outputs: "", customers: "" }])}>
          <Plus className="size-3" /> Add Process Row
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Value Chain Canvas ───────────────────────────────────────────────────────

function ValueChainCanvas() {
  const [primary, _setPrimary] = useState([
    { activity: "Inbound Logistics", cost: 8, diff: "Low", notes: "Cloud-based data ingestion" },
    { activity: "Operations", cost: 35, diff: "High", notes: "Core ML pipeline + SaaS platform" },
    { activity: "Outbound Logistics", cost: 5, diff: "Medium", notes: "API delivery + CDN" },
    { activity: "Marketing & Sales", cost: 30, diff: "Medium", notes: "PLG + enterprise sales" },
    { activity: "Service", cost: 12, diff: "High", notes: "Customer success + support" },
  ]);

  const support = ["Firm Infrastructure", "HR Management", "Technology Development", "Procurement"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="size-5 text-primary" /> Porter Value Chain
        </CardTitle>
        <CardDescription>Map primary and support activities to identify cost/differentiation advantages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Support activities bar */}
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Support Activities</h4>
          <div className="flex flex-wrap gap-2">
            {support.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>

        {/* Primary activities */}
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
                <div className="text-lg font-bold text-green-600">{100 - primary.reduce((a, p) => a + p.cost, 0)}%</div>
                <div className="text-[10px] text-green-600 font-medium">Margin</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Root Cause Canvas ────────────────────────────────────────────────────────

function RootCauseCanvas() {
  const [mode, setMode] = useState<"5whys" | "ishikawa">("5whys");
  const [whys, setWhys] = useState([
    "Revenue growth is decelerating",
    "New customer acquisition is slowing",
    "CAC has increased 40% YoY",
    "Competitors are outspending on ads and PLG",
    "We haven't invested in product-led acquisition channels",
  ]);

  const ishikawaCategories = [
    { name: "Man", items: ["Sales team understaffed", "High turnover in SDR team"] },
    { name: "Machine", items: ["Legacy CRM slowing deal velocity", "No PLG infrastructure"] },
    { name: "Method", items: ["Over-reliance on outbound", "No self-serve onboarding"] },
    { name: "Material", items: ["Content marketing gaps", "No competitive battle cards"] },
    { name: "Measurement", items: ["Inconsistent attribution", "No CAC payback tracking"] },
    { name: "Milieu", items: ["Market shift to PLG", "Competitors raised large rounds"] },
  ];

  return (
    <Card>
      <CardHeader>
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
      </CardHeader>
      <CardContent>
        {mode === "5whys" ? (
          <div className="space-y-2">
            {whys.map((why, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${i === whys.length - 1 ? "bg-red-500 text-white" : "bg-primary/10 text-primary"}`}>
                    W{i + 1}
                  </div>
                  {i < whys.length - 1 && <div className="w-px h-4 bg-border" />}
                </div>
                <div className="flex-1 pt-1">
                  <Label className="text-[10px] text-muted-foreground">Why #{i + 1}{i === whys.length - 1 ? " — Root Cause" : ""}</Label>
                  <Input
                    value={why}
                    onChange={(e) => {
                      const next = [...whys];
                      next[i] = e.target.value;
                      setWhys(next);
                    }}
                    className={`mt-1 ${i === whys.length - 1 ? "border-red-300 dark:border-red-700" : ""}`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
              <span className="font-semibold text-sm text-red-600">Problem: Revenue growth decelerating</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ishikawaCategories.map((cat) => (
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
        )}
      </CardContent>
    </Card>
  );
}

// ─── Hypothesis Panel ─────────────────────────────────────────────────────────

function HypothesisPanel() {
  const [hypotheses, _setHypotheses] = useState([
    { id: "H1", text: "Expanding into EMEA will yield $10M+ ARR within 2 years", status: "testing", children: [
      { id: "H1.1", text: "EMEA demand exists at current price points", status: "confirmed" },
      { id: "H1.2", text: "We can localize product within 6 months", status: "testing" },
      { id: "H1.3", text: "Channel partners can accelerate GTM", status: "open" },
    ]},
    { id: "H2", text: "Launching AI analytics module will increase ARPU by 40%", status: "testing", children: [
      { id: "H2.1", text: "Customers will pay premium for AI features", status: "testing" },
      { id: "H2.2", text: "We have the ML talent to build it", status: "confirmed" },
    ]},
    { id: "H3", text: "PLG motion will reduce CAC by 50%", status: "open", children: [] },
  ]);

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
        <CardDescription>Structure hypotheses hierarchically — each must be testable and MECE</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hypotheses.map((h) => (
          <div key={h.id} className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Network className="size-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{h.id}</span>
                  <Badge variant="secondary" className={`text-[10px] ${statusStyles[h.status]}`}>{h.status}</Badge>
                </div>
                <p className="text-sm font-medium">{h.text}</p>
                {h.children.length > 0 && (
                  <div className="mt-3 ml-4 border-l-2 border-muted pl-4 space-y-2">
                    {h.children.map((child) => (
                      <div key={child.id} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{child.id}</span>
                        <span className="text-sm">{child.text}</span>
                        <Badge variant="secondary" className={`text-[10px] ml-auto ${statusStyles[child.status]}`}>{child.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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
    { name: "Descriptive", desc: "Summarize what the data shows", icon: "📋" },
    { name: "Comparative", desc: "Benchmark against peers/history", icon: "⚖️" },
    { name: "Causal", desc: "Test cause-effect relationships", icon: "🔬" },
    { name: "Forecasting", desc: "Project future outcomes", icon: "🔮" },
    { name: "Qualitative", desc: "Expert interviews & surveys", icon: "💬" },
  ];

  const analyses = [
    { hypothesis: "H1.1", method: "Comparative", status: "complete", finding: "EMEA demand confirmed — 3 competitors active with 15% growth" },
    { hypothesis: "H1.2", method: "Descriptive", status: "in-progress", finding: "Localization effort estimated at 4-6 months" },
    { hypothesis: "H2.1", method: "Qualitative", status: "complete", finding: "8/10 enterprise customers expressed willingness to pay 30%+ premium" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="size-5 text-primary" /> Analysis
        </CardTitle>
        <CardDescription>Test hypotheses using 5 analysis methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Methods */}
        <div className="grid grid-cols-5 gap-2">
          {methods.map((m) => (
            <div key={m.name} className="text-center border rounded-lg p-3">
              <div className="text-xl mb-1">{m.icon}</div>
              <div className="text-xs font-semibold">{m.name}</div>
              <div className="text-[10px] text-muted-foreground">{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Analyses table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2 font-medium text-xs">Hypothesis</th>
                <th className="text-left p-2 font-medium text-xs">Method</th>
                <th className="text-left p-2 font-medium text-xs">Status</th>
                <th className="text-left p-2 font-medium text-xs">Finding</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 font-mono text-xs">{a.hypothesis}</td>
                  <td className="p-2"><Badge variant="secondary" className="text-[10px]">{a.method}</Badge></td>
                  <td className="p-2">
                    <Badge variant="secondary" className={`text-[10px] ${a.status === "complete" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"}`}>
                      {a.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-xs">{a.finding}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        {/* Governing Thought */}
        <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 text-center">
          <Label className="text-xs text-primary font-semibold">Governing Thought</Label>
          <p className="font-semibold mt-1">
            Acme should pursue a dual growth strategy: EMEA expansion + AI-powered product differentiation to achieve 30%+ growth
          </p>
        </div>

        {/* Key Lines */}
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { line: "EMEA offers $10M+ ARR opportunity", evidence: ["Competitor analysis shows 15% market growth", "Customer interviews confirm price-point fit", "Channel partner pipeline identified"] },
            { line: "AI analytics will increase ARPU 30-40%", evidence: ["8/10 customers willing to pay premium", "ML team ready — 4-month build timeline", "Competitor gap in AI-native analytics"] },
            { line: "PLG motion will cut CAC by 50%", evidence: ["Industry benchmarks show 3-5x efficiency", "Self-serve infrastructure partially built", "Product-qualified leads already 20% of pipeline"] },
          ].map((kl, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                Key Line {i + 1}
              </h4>
              <p className="text-sm mb-3">{kl.line}</p>
              <div className="space-y-1.5">
                {kl.evidence.map((e, j) => (
                  <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3 text-green-500 shrink-0 mt-0.5" />
                    {e}
                  </div>
                ))}
              </div>
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
  const slides = [
    { title: "Acme should pursue dual growth: EMEA + AI differentiation", type: "Executive Summary", body: "bullets" },
    { title: "Revenue growth has decelerated from 35% to 25% YoY", type: "Situation Analysis", body: "chart" },
    { title: "Competitors raised $200M while our CAC increased 40%", type: "Complication", body: "table" },
    { title: "EMEA market offers $10M+ ARR within 24 months", type: "Opportunity Analysis", body: "chart" },
    { title: "AI analytics module will increase ARPU by 30-40%", type: "Product Strategy", body: "bullets" },
    { title: "PLG motion projected to cut CAC by 50%", type: "GTM Strategy", body: "chart" },
    { title: "Implementation requires $5M investment over 12 months", type: "Investment Case", body: "table" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="size-5 text-primary" /> Communication — Slide Builder
        </CardTitle>
        <CardDescription>Build the deck with consulting slide grammar: action title ≤14 words + body + sources</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {slides.map((slide, i) => (
          <div key={i} className="border rounded-lg p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
            <div className="size-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-[10px]">{slide.type}</Badge>
                <Badge variant="outline" className="text-[10px]">{slide.body}</Badge>
              </div>
              <p className="text-sm font-medium">{slide.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {slide.title.split(" ").length} words — {slide.title.split(" ").length <= 14 ? "✅ within limit" : "⚠️ over 14 words"}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="size-7">
              <Pencil className="size-3" />
            </Button>
          </div>
        ))}
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
            { id: "pptx", label: "PowerPoint", desc: "Consulting-style PPTX with themes", icon: "📊" },
            { id: "pdf", label: "PDF Report", desc: "Print-ready strategy report", icon: "📄" },
            { id: "html", label: "HTML Slides", desc: "Browser-based presentation", icon: "🌐" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`border rounded-lg p-4 text-left transition-colors ${format === f.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            >
              <div className="text-2xl mb-2">{f.icon}</div>
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
