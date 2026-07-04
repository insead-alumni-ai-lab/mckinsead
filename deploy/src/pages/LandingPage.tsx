import { useConvexAuth } from "convex/react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Compass,
  FileBarChart,
  Layers,
  LineChart,
  Network,
  Search,
  Shield,
  Target,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const WORKFLOW_STEPS = [
  { icon: Target, label: "Scope", desc: "Frame the problem (SCQA)", color: "text-blue-500" },
  { icon: Search, label: "Diagnose", desc: "Run 8 strategy frameworks", color: "text-indigo-500" },
  { icon: Network, label: "Hypothesize", desc: "Build hypothesis tree", color: "text-violet-500" },
  { icon: LineChart, label: "Analyze", desc: "Test each hypothesis", color: "text-purple-500" },
  { icon: Layers, label: "Synthesize", desc: "Pyramid principle", color: "text-fuchsia-500" },
  { icon: FileBarChart, label: "Communicate", desc: "Build slide deck", color: "text-pink-500" },
];

const FRAMEWORKS = [
  "SWOT + TOWS", "PESTEL", "Porter's Five Forces", "BCG Matrix",
  "Ansoff Matrix", "SIPOC", "Porter Value Chain", "Root Cause (5 Whys + Ishikawa)",
];

export function LandingPage() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-28">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-background text-xs font-medium">
            <Brain className="size-3 text-primary" />
            Agentic Strategy Cockpit
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            McKinsey-grade strategy
            <span className="block text-primary"> powered by AI agents</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A fleet of specialized agents walks you through a full strategy
            engagement — from problem scoping to slide deck export — using the same
            frameworks taught at top consulting firms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="gap-2 text-base px-8" asChild>
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                Start an Engagement <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button size="lg" variant="outline" className="text-base px-8" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="px-4 py-16 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">The McKinsey-Mirrored Workflow</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Every engagement follows the same rigorous 6-stage process used at top strategy firms, with human-in-the-loop gates at every critical decision.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {WORKFLOW_STEPS.map((step, i) => (
              <Card key={step.label} className="text-center border-none shadow-sm">
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center justify-center mb-3">
                    <div className={`rounded-xl bg-background border p-3`}>
                      <step.icon className={`size-6 ${step.color}`} />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Stage {i + 1}</div>
                  <div className="font-semibold text-sm">{step.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{step.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Frameworks */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">8 Strategy Frameworks</h2>
          <p className="text-muted-foreground text-center mb-10">
            Every framework has an interactive canvas and a specialized AI agent.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FRAMEWORKS.map((fw) => (
              <div key={fw} className="flex items-center gap-2 px-4 py-3 rounded-lg border bg-background">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{fw}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="px-4 py-16 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Non-Negotiable Principles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Layers, title: "MECE Everywhere", desc: "Every breakdown is mutually exclusive, collectively exhaustive. No overlaps, no gaps." },
              { icon: Shield, title: "Hypothesis-First", desc: "Never gather data without a testable claim. Hypothesis before analysis, always." },
              { icon: Workflow, title: "Human-in-the-Loop", desc: "5 gates where the AI must pause for human approval before proceeding." },
              { icon: Compass, title: "So-What Discipline", desc: "Every finding must answer 'so what does this mean?' with actionable implications." },
              { icon: Brain, title: "Pyramid Principle", desc: "Structure the narrative top-down before building any slides. Answer first." },
              { icon: FileBarChart, title: "Grounded Claims", desc: "Every assertion needs a citation or evidence ID. No unsubstantiated claims." },
            ].map((p) => (
              <Card key={p.title} className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <p.icon className="size-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to think like a consultant?</h2>
          <p className="text-muted-foreground text-lg">
            Start your first strategy engagement in minutes.
          </p>
          <Button size="lg" className="gap-2 text-base px-8" asChild>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              Get Started <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 INSEAD Alumni AI Lab</span>
          <span className="font-medium">mckinsead</span>
        </div>
      </footer>
    </div>
  );
}
