import { useMutation } from "convex/react";
import { Brain, FileBarChart, LineChart, Shield, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { FA, FaIcon } from "@/components/FaIcon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TextareaWithMic } from "@/components/ui/textarea-with-mic";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { EngagementData } from "./types";

export function AnalysisPanel() {
  const methods = [
    {
      name: "Descriptive",
      desc: "Summarize what the data shows",
      icon: FA.descriptive,
    },
    {
      name: "Comparative",
      desc: "Benchmark against peers/history",
      icon: FA.comparative,
    },
    {
      name: "Causal",
      desc: "Test cause-effect relationships",
      icon: FA.causal,
    },
    {
      name: "Forecasting",
      desc: "Project future outcomes",
      icon: "fa-solid fa-wand-magic-sparkles",
    },
    {
      name: "Qualitative",
      desc: "Expert interviews & surveys",
      icon: "fa-solid fa-comments",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="size-5 text-primary" /> Analysis
        </CardTitle>
        <CardDescription>
          Test hypotheses using 5 analysis methods — coming in next enhancement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {methods.map(m => (
            <div key={m.name} className="text-center border rounded-lg p-3">
              <div className="text-xl mb-1">
                <FaIcon icon={m.icon} />
              </div>
              <div className="text-xs font-semibold">{m.name}</div>
              <div className="text-[10px] text-muted-foreground">{m.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="size-8 mx-auto mb-3 text-primary/40" />
          <p className="text-sm">
            Analysis features will use AI to test each hypothesis with the
            appropriate method.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Synthesis Panel ──────────────────────────────────────────────────────────

export function SynthesisPanel({
  engagement,
  engagementId,
}: {
  engagement: EngagementData;
  engagementId: Id<"engagements">;
}) {
  const saved = engagement.synthesisData
    ? (() => {
        try {
          return JSON.parse(engagement.synthesisData!);
        } catch {
          return null;
        }
      })()
    : null;

  const [governingThought, setGoverningThought] = useState(
    saved?.governingThought ?? "",
  );
  const [keyLines, setKeyLines] = useState<string[]>(
    saved?.keyLines ?? ["", "", ""],
  );
  const saveStageData = useMutation(api.engagements.saveStageData);

  const handleSave = useCallback(() => {
    saveStageData({
      id: engagementId,
      synthesisData: JSON.stringify({ governingThought, keyLines }),
    });
  }, [saveStageData, engagementId, governingThought, keyLines]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-5 text-primary" /> Synthesis — Pyramid
          Principle
        </CardTitle>
        <CardDescription>
          Structure the narrative: Governing Thought → Key Lines → Supporting
          Evidence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 text-center">
          <Label className="text-xs text-primary font-semibold">
            Governing Thought
          </Label>
          <TextareaWithMic
            value={governingThought}
            onChange={e => setGoverningThought(e.target.value)}
            onBlur={handleSave}
            onTranscription={t => setGoverningThought(t)}
            placeholder="Enter your governing thought — the one-sentence answer to the strategic question..."
            className="mt-2 text-center"
            rows={2}
          />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {keyLines.map((line, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                Key Line {i + 1}
              </h4>
              <TextareaWithMic
                value={line}
                onChange={e => {
                  const next = [...keyLines];
                  next[i] = e.target.value;
                  setKeyLines(next);
                }}
                onBlur={handleSave}
                onTranscription={text => {
                  const next = [...keyLines];
                  next[i] = text;
                  setKeyLines(next);
                }}
                placeholder="Supporting argument..."
                rows={2}
                className="text-sm mb-2"
              />
              <div className="text-xs text-muted-foreground">
                Evidence will be linked from your analyses
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

export function CommunicationPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="size-5 text-primary" /> Communication — Slide
          Builder
        </CardTitle>
        <CardDescription>
          Build the deck with consulting slide grammar: action title ≤14 words +
          body + sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="size-8 mx-auto mb-3 text-primary/40" />
          <p className="text-sm">
            Slide builder will auto-generate from your pyramid structure and
            framework outputs.
          </p>
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
