import { useState } from "react";
import { FaIcon, FA } from "@/components/FaIcon";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Globe,
  Plus,
  Wrench,
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
    frameworks: ["PESTEL", "Porter 5", "SWOT", "Ansoff"],
    icon: Globe,
    color: "text-blue-500",
  },
  {
    title: "Portfolio Optimization",
    desc: "Which business units to invest, harvest, or divest?",
    frameworks: ["BCG", "Value Chain", "SWOT"],
    icon: BarChart3,
    color: "text-violet-500",
  },
  {
    title: "Operational Turnaround",
    desc: "Root cause analysis of margin erosion + hypothesis testing.",
    frameworks: ["Root Cause", "SIPOC", "Value Chain", "SWOT"],
    icon: Wrench,
    color: "text-orange-500",
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

// Demo engagements for testing
const DEMO_ENGAGEMENTS = [
  {
    id: "demo-1",
    company: "TechCorp International",
    industry: "Enterprise SaaS",
    question: "Should we expand into the Asian market?",
    stage: "frameworks",
    progress: 35,
    createdAt: "2026-06-01",
  },
  {
    id: "demo-2",
    company: "GreenEnergy Co",
    industry: "Renewable Energy",
    question: "Which product lines should we invest in vs divest?",
    stage: "hypothesis",
    progress: 50,
    createdAt: "2026-05-28",
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [engagements, setEngagements] = useState(DEMO_ENGAGEMENTS);
  const [showCreate, setShowCreate] = useState(false);
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [question, setQuestion] = useState("");
  const [geos, setGeos] = useState("");
  const [competitors, setCompetitors] = useState("");

  const handleCreate = () => {
    if (!company.trim()) return;
    const newEng = {
      id: `eng-${Date.now()}`,
      company,
      industry,
      question,
      stage: "scoping",
      progress: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setEngagements([newEng, ...engagements]);
    setShowCreate(false);
    setCompany("");
    setIndustry("");
    setQuestion("");
    setGeos("");
    setCompetitors("");
    navigate(`/engagement/${newEng.id}`);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Strategy Cockpit</h1>
          <p className="text-muted-foreground mt-1">
            Manage your strategy engagements
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> New Engagement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Strategy Engagement</DialogTitle>
              <DialogDescription>
                Define the company and strategic question to analyze
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
              <Button onClick={handleCreate} disabled={!company.trim()}>Create Engagement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
              <Button onClick={() => setShowCreate(true)}>Create Engagement</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {engagements.map((eng) => (
              <Card
                key={eng.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/engagement/${eng.id}`)}
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
                setCompany("");
                setQuestion(tpl.desc);
                setShowCreate(true);
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
