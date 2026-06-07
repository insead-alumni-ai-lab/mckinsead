import { useState, useEffect } from "react";
import { FaIcon, FA } from "@/components/FaIcon";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Globe,
  Key,
  Loader2,
  Plus,
  Settings,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const TEMPLATES = [
  {
    title: "Market Entry",
    desc: "Should we enter a new market? Full PESTEL + Porter analysis.",
    question: "Should we enter the target market and what would be the optimal entry strategy?",
    frameworks: ["PESTEL", "Porter 5", "SWOT", "Ansoff"],
    icon: Globe,
    color: "text-blue-500",
  },
  {
    title: "Portfolio Optimization",
    desc: "Which business units to invest, harvest, or divest?",
    question: "How should we reallocate resources across our business portfolio to maximize returns?",
    frameworks: ["BCG", "Value Chain", "SWOT"],
    icon: BarChart3,
    color: "text-violet-500",
  },
  {
    title: "Operational Turnaround",
    desc: "Root cause analysis of margin erosion + hypothesis testing.",
    question: "What are the root causes of declining margins and how can we reverse the trend?",
    frameworks: ["Root Cause", "SIPOC", "Value Chain", "SWOT"],
    icon: Wrench,
    color: "text-orange-500",
  },
  {
    title: "Digital Transformation",
    desc: "Assess digital readiness and plan transformation roadmap.",
    question: "How should we transform our operations and customer experience through digital technologies?",
    frameworks: ["SWOT", "Value Chain", "PESTEL"],
    icon: Zap,
    color: "text-cyan-500",
  },
  {
    title: "M&A Due Diligence",
    desc: "Strategic fit, synergies, and integration risk assessment.",
    question: "Should we acquire the target company and what synergies can we capture?",
    frameworks: ["SWOT", "Porter 5", "BCG", "Value Chain"],
    icon: Building2,
    color: "text-emerald-500",
  },
  {
    title: "Competitive Response",
    desc: "Analyze competitive threats and formulate counter-strategies.",
    question: "How should we respond to competitive threats to defend and grow our market position?",
    frameworks: ["Porter 5", "SWOT", "PESTEL", "Ansoff"],
    icon: AlertTriangle,
    color: "text-amber-500",
  },
];

const WORKFLOW_STEPS = [
  { icon: FA.scope, stage: "Scope", desc: "Frame the problem" },
  { icon: FA.diagnose, stage: "Diagnose", desc: "Run frameworks" },
  { icon: FA.hypothesize, stage: "Hypothesize", desc: "Build tree" },
  { icon: FA.analyze, stage: "Analyze", desc: "Test hypotheses" },
  { icon: FA.synthesize, stage: "Synthesize", desc: "Pyramid principle" },
  { icon: FA.communicate, stage: "Communicate", desc: "Build deck" },
  { icon: FA.export, stage: "Export", desc: "PPTX / PDF" },
];

export function DashboardPage() {
  const navigate = useNavigate();

  // ─── Convex data ─────────────────────────────────────────
  const engagements = useQuery(api.engagements.list) ?? [];
  const subscription = useQuery(api.subscriptions.current);
  const userAiConfigs = useQuery(api.userAiConfig.list) ?? [];
  const createEngagement = useMutation(api.engagements.create);
  const removeEngagement = useMutation(api.engagements.remove);
  const createCheckout = useAction(api.stripe.createCheckout);

  // Free-tier (BYOK) users need at least one API key configured
  const isFree = !subscription || subscription.plan === "free";
  const isByok = !subscription || subscription.mode === "byok";
  const hasKeys = userAiConfigs.some((c) => c.apiKeySet);
  const needsKeys = isFree && isByok && !hasKeys;

  // ─── Local state ─────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [question, setQuestion] = useState("");
  const [geos, setGeos] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [creating, setCreating] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Show onboarding for first-time users
  useEffect(() => {
    const seen = localStorage.getItem("mckinsead_onboarding_complete");
    if (!seen && engagements.length === 0) {
      setShowOnboarding(true);
    }
  }, [engagements.length]);

  const handleCreate = async () => {
    if (!company.trim() || creating) return;
    setCreating(true);

    try {
      const result = await createEngagement({
        company,
        industry,
        question: question || undefined,
        geographies: geos || undefined,
        competitors: competitors || undefined,
      });

      if (result.success && result.engagementId) {
        setShowCreate(false);
        resetForm();
        navigate(`/engagement/${result.engagementId}`);
      } else {
        // Session limit reached
        setShowCreate(false);
        setLimitMessage(result.reason ?? "Session limit reached.");
        setShowLimitModal(true);
      }
    } catch (err) {
      console.error("Failed to create engagement:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpgrade = async (plan: "starter" | "premium") => {
    setUpgrading(plan);
    try {
      const result = await createCheckout({ plan });
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setUpgrading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeEngagement({ id: id as never });
    } catch (err) {
      console.error("Failed to delete:", err);
    }
    setDeleteConfirm(null);
  };

  const resetForm = () => {
    setCompany("");
    setIndustry("");
    setQuestion("");
    setGeos("");
    setCompetitors("");
  };

  const stageColor = (stage: string) => {
    const colors: Record<string, string> = {
      scoping: "bg-blue-500/10 text-blue-600",
      frameworks: "bg-indigo-500/10 text-indigo-600",
      hypothesis: "bg-violet-500/10 text-violet-600",
      analysis: "bg-purple-500/10 text-purple-600",
      synthesis: "bg-fuchsia-500/10 text-fuchsia-600",
      communication: "bg-pink-500/10 text-pink-600",
      export: "bg-green-500/10 text-green-600",
    };
    return colors[stage] || "bg-muted text-muted-foreground";
  };

  const sessionsUsed = subscription?.sessionsUsed ?? 0;
  const sessionsLimit = subscription?.sessionsLimit ?? 0;
  const sessionsRemaining = Math.max(0, sessionsLimit - sessionsUsed);
  const isAtLimit = sessionsUsed >= sessionsLimit;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Strategy Cockpit</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your strategy engagements
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Session counter badge */}
          {subscription && (
            <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border ${
              isAtLimit
                ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                : sessionsRemaining <= 2
                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                  : "border-border bg-muted/50 text-muted-foreground"
            }`}>
              <Zap className="size-3.5" />
              <span className="font-medium">{sessionsRemaining}</span>
              <span className="text-xs">/ {sessionsLimit} sessions left</span>
            </div>
          )}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={isAtLimit || needsKeys} title={needsKeys ? "Configure your AI keys in Settings first" : undefined}>
                <Plus className="size-4" /> New Engagement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New Strategy Engagement</DialogTitle>
                <DialogDescription>
                  Define the company and strategic question to analyze.
                  {sessionsRemaining > 0 && (
                    <span className="block mt-1 text-xs">
                      This will use 1 of your {sessionsRemaining} remaining session{sessionsRemaining !== 1 ? "s" : ""}.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input placeholder="e.g., Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Input placeholder="e.g., Consumer Electronics" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Strategic Question</Label>
                  <Textarea placeholder="e.g., Should we expand into the European market?" value={question} onChange={(e) => setQuestion(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Geographies</Label>
                    <Input placeholder="e.g., US, Europe, APAC" value={geos} onChange={(e) => setGeos(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Key Competitors</Label>
                    <Input placeholder="e.g., CompetitorA, B" value={competitors} onChange={(e) => setCompetitors(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!company.trim() || creating}>
                  {creating && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Create Engagement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* BYOK keys missing banner */}
      {needsKeys && (
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-2.5">
              <Key className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Set up your AI provider keys
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                You're on the Free (BYOK) plan — configure at least one AI provider API key in Settings before creating engagements.
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => navigate("/settings")}
            >
              <Settings className="size-4" />
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Session limit banner */}
      {isAtLimit && subscription && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-2.5">
              <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-300">
                Monthly session limit reached
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                You've used all {sessionsLimit} session{sessionsLimit !== 1 ? "s" : ""} on the{" "}
                <span className="font-medium capitalize">{subscription.plan}</span> plan.
                {subscription.plan === "free"
                  ? " Upgrade to Starter for 10 sessions/month."
                  : subscription.plan === "starter"
                    ? " Upgrade to Premium for unlimited sessions."
                    : " Contact us for additional capacity."}
              </p>
            </div>
            {subscription.plan !== "premium" && (
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => handleUpgrade(subscription.plan === "free" ? "starter" : "premium")}
                disabled={upgrading !== null}
              >
                {upgrading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Upgrade Now
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Limit Reached Modal (shown after failed creation attempt) */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Session Limit Reached
            </DialogTitle>
            <DialogDescription>{limitMessage}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {subscription?.plan === "free" && (
              <Button
                className="w-full gap-2"
                onClick={() => { setShowLimitModal(false); handleUpgrade("starter"); }}
                disabled={upgrading !== null}
              >
                {upgrading === "starter" && <Loader2 className="size-4 animate-spin" />}
                <Zap className="size-4" />
                Upgrade to Starter — €2,000/mo
              </Button>
            )}
            {(subscription?.plan === "free" || subscription?.plan === "starter") && (
              <Button
                variant={subscription?.plan === "free" ? "outline" : "default"}
                className="w-full gap-2"
                onClick={() => { setShowLimitModal(false); handleUpgrade("premium"); }}
                disabled={upgrading !== null}
              >
                {upgrading === "premium" && <Loader2 className="size-4 animate-spin" />}
                Upgrade to Premium — €10,000/mo
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLimitModal(false)}>Maybe Later</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Engagement?</DialogTitle>
            <DialogDescription>
              This will permanently remove this engagement and all its data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Tutorial */}
      <Dialog open={showOnboarding} onOpenChange={(open) => { if (!open) { setShowOnboarding(false); localStorage.setItem("mckinsead_onboarding_complete", "1"); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {onboardingStep === 0 && "👋 Welcome to mckinsead"}
              {onboardingStep === 1 && "🔬 The 7-Stage Methodology"}
              {onboardingStep === 2 && "🤖 AI-Powered Analysis"}
              {onboardingStep === 3 && "🚀 Ready to Start!"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {onboardingStep === 0 && (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  mckinsead is your <strong>Agentic Strategy Cockpit</strong> — mirroring McKinsey's
                  problem-solving methodology as an AI-powered workflow.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { emoji: "🎯", label: "Frame Problems", desc: "Using SCQA" },
                    { emoji: "📊", label: "Run Frameworks", desc: "8 strategy tools" },
                    { emoji: "📑", label: "Export Reports", desc: "PDF & HTML" },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">{f.emoji}</div>
                      <div className="text-xs font-semibold">{f.label}</div>
                      <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {onboardingStep === 1 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Follow the consulting workflow from problem framing to final deliverable:
                </p>
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={step.stage} className="flex items-center gap-3 py-1.5">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm"><FaIcon icon={step.icon} /></span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{i + 1}. {step.stage}</div>
                      <div className="text-[11px] text-muted-foreground">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {onboardingStep === 2 && (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Every stage is powered by AI — generate framework analyses with one click,
                  chat with a strategy consultant, and get data-driven insights.
                </p>
                <div className="space-y-2 text-left">
                  {[
                    { icon: "✨", text: "One-click AI framework generation (SWOT, PESTEL, Porter's 5, etc.)" },
                    { icon: "💬", text: "AI chat consultant that understands your engagement context" },
                    { icon: "🔍", text: "Research mode for market data and industry intelligence" },
                    { icon: "📊", text: "Auto-save everything — pick up where you left off" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-start gap-2 text-sm">
                      <span>{item.icon}</span>
                      <span className="text-muted-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {onboardingStep === 3 && (
              <div className="text-center space-y-4">
                <div className="text-5xl mb-2">🎉</div>
                <p className="text-sm text-muted-foreground">
                  You're all set! Create your first engagement or use a template to get started.
                </p>
                <p className="text-xs text-muted-foreground">
                  Tip: Use the 💬 chat button inside any engagement for AI guidance at every stage.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`size-2 rounded-full transition-colors ${i === onboardingStep ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {onboardingStep > 0 && (
                <Button variant="outline" size="sm" onClick={() => setOnboardingStep(onboardingStep - 1)}>Back</Button>
              )}
              {onboardingStep < 3 ? (
                <Button size="sm" onClick={() => setOnboardingStep(onboardingStep + 1)}>Next</Button>
              ) : (
                <Button size="sm" onClick={() => { setShowOnboarding(false); localStorage.setItem("mckinsead_onboarding_complete", "1"); }}>
                  Get Started
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">The McKinsey-Mirrored Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {WORKFLOW_STEPS.map((s, i) => (
              <div key={s.stage} className="flex items-center">
                {i > 0 && <span className="text-muted-foreground mx-1 text-xs">→</span>}
                <div className="flex-shrink-0 bg-muted/60 rounded-lg px-3 py-2 text-center min-w-[90px]">
                  <div className="text-xl mb-0.5"><FaIcon icon={s.icon} /></div>
                  <div className="text-xs font-semibold">{s.stage}</div>
                  <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      {engagements.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Engagements",
              value: engagements.length,
              icon: Building2,
              color: "text-primary",
            },
            {
              label: "In Progress",
              value: engagements.filter((e) => e.progress < 100).length,
              icon: Loader2,
              color: "text-blue-500",
            },
            {
              label: "Avg. Progress",
              value: `${Math.round(engagements.reduce((sum, e) => sum + (e.progress || 0), 0) / engagements.length)}%`,
              icon: BarChart3,
              color: "text-violet-500",
            },
            {
              label: "Completed",
              value: engagements.filter((e) => e.progress >= 100 || e.stage === "export").length,
              icon: Zap,
              color: "text-emerald-500",
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`size-8 ${stat.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Engagements */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Engagements</h2>
        {engagements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-5xl mb-4"><FaIcon icon={FA.compass} /></div>
              <p className="text-lg mb-2 font-medium">No engagements yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first strategy engagement or use a quick-start template
              </p>
              <Button
                onClick={() => needsKeys ? navigate("/settings") : isAtLimit ? setShowLimitModal(true) : setShowCreate(true)}
              >
                {needsKeys ? "Configure AI Keys" : "Create Engagement"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {engagements.map((eng) => (
              <Card
                key={eng._id}
                className="group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/engagement/${eng._id}`)}
              >
                <CardContent className="flex items-center gap-6 py-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Building2 className="size-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold truncate">{eng.company}</h3>
                      <Badge variant="secondary" className={stageColor(eng.stage)}>
                        {eng.stage}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{eng.question || eng.industry}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="text-right text-xs">
                      <div className="text-muted-foreground">
                        {new Date(eng._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{eng.progress}%</div>
                      <div className="text-xs">Progress</div>
                    </div>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${eng.progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(eng._id);
                    }}
                    title="Delete engagement"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick-Start Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl) => (
            <Card
              key={tpl.title}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
              onClick={() => {
                if (needsKeys) {
                  navigate("/settings");
                } else if (isAtLimit) {
                  setShowLimitModal(true);
                  setLimitMessage(
                    `You've used all ${sessionsLimit} session${sessionsLimit !== 1 ? "s" : ""} this month. Upgrade to create more engagements.`
                  );
                } else {
                  setCompany("");
                  setQuestion(tpl.question || tpl.desc);
                  setShowCreate(true);
                }
              }}
            >
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <tpl.icon className={`size-5 ${tpl.color}`} />
                  <h3 className="font-semibold text-sm">{tpl.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {tpl.frameworks.map((f) => (
                    <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
