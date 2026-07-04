import { useState, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Check, Shield, Target, Sparkles, Loader2, PenLine, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EngagementData } from "./types";

// ─── Types ──────────────────────────────────────────────────────────
interface ScopingData {
  problemDescription?: string;
  situation?: string;
  complication?: string;
  question?: string;
  answer?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function parseScopingData(raw: string | null | undefined): ScopingData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as ScopingData;
    return null;
  } catch {
    return null;
  }
}

export function ScopingPanel({ engagement, engagementId }: { engagement: EngagementData; engagementId: Id<"engagements"> }) {
  const saved = parseScopingData(engagement.scopingData);
  const savedGates: string[] = engagement.gatesApproved
    ? (() => { try { return JSON.parse(engagement.gatesApproved!); } catch { return []; } })()
    : [];

  // ── Mode: "input" = user describes problem | "review" = SCQA shown ──
  const hasScqa = Boolean(saved?.situation || saved?.complication || saved?.question || saved?.answer);
  const [mode, setMode] = useState<"input" | "review">(hasScqa ? "review" : "input");
  const [showManualEntry, setShowManualEntry] = useState(false);

  // ── Problem description ──
  const [problemDescription, setProblemDescription] = useState(saved?.problemDescription ?? "");

  // ── SCQA fields ──
  const [situation, setSituation] = useState(saved?.situation ?? "");
  const [complication, setComplication] = useState(saved?.complication ?? "");
  const [question, setQuestion] = useState(saved?.question ?? engagement.question ?? "");
  const [answer, setAnswer] = useState(saved?.answer ?? "");

  // ── UI state ──
  const [inferring, setInferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(savedGates.includes("G1"));

  // ── Convex hooks ──
  const updateStage = useMutation(api.engagements.updateStage);
  const saveStageData = useMutation(api.engagements.saveStageData);
  const inferSCQA = useAction(api.frameworkAi.inferSCQA);

  // ── Save helper ──
  const persistScopingData = useCallback(
    (overrides?: Partial<ScopingData>) => {
      const data: ScopingData = {
        problemDescription,
        situation,
        complication,
        question,
        answer,
        ...overrides,
      };
      saveStageData({ id: engagementId, scopingData: JSON.stringify(data) });
    },
    [saveStageData, engagementId, problemDescription, situation, complication, question, answer],
  );

  // ── Auto-save on blur ──
  const handleBlur = useCallback(() => { persistScopingData(); }, [persistScopingData]);

  // ── Infer SCQA with AI ──
  const handleInferSCQA = useCallback(async () => {
    if (!problemDescription.trim()) return;
    setInferring(true);
    setError(null);
    try {
      const result = await inferSCQA({ engagementId, problemDescription: problemDescription.trim() });
      if (result.success && result.situation) {
        setSituation(result.situation);
        setComplication(result.complication ?? "");
        setQuestion(result.question ?? "");
        setAnswer(result.answer ?? "");
        setMode("review");
      } else {
        setError(result.error ?? "Failed to infer SCQA. Please try again or enter manually.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setInferring(false);
    }
  }, [problemDescription, inferSCQA, engagementId]);

  // ── Reset to problem input ──
  const handleReset = useCallback(() => { setMode("input"); setShowManualEntry(false); setError(null); }, []);

  const handleApprove = () => {
    const newApproved = !approved;
    setApproved(newApproved);
    const gates = newApproved
      ? [...savedGates.filter((g) => g !== "G1"), "G1"]
      : savedGates.filter((g) => g !== "G1");
    // Persist full scoping data (including problemDescription) before approving
    persistScopingData();
    saveStageData({
      id: engagementId,
      gatesApproved: JSON.stringify(gates),
    });
    if (newApproved) {
      updateStage({ id: engagementId, stage: "frameworks", progress: 14 });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-primary" />
          Problem Scoping - SCQA Framework
        </CardTitle>
        <CardDescription>
          {mode === "input"
            ? "Describe your problem in plain words. The AI will structure it using SCQA."
            : "Review the AI-inferred SCQA below. Edit any field before approving."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error banner */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* INPUT MODE */}
        {mode === "input" && !showManualEntry && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <PenLine className="size-4 text-muted-foreground" />
                Describe your problem or idea
              </Label>
              <Textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder={'e.g. "Our B2B SaaS CRM company grew 20% YoY but a competitor launched AI at half our price. We are losing enterprise deals."'}
                rows={5}
                className="text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleInferSCQA} disabled={!problemDescription.trim() || inferring} className="gap-2">
                {inferring ? (
                  <><Loader2 className="size-4 animate-spin" /> Analyzing with AI...</>
                ) : (
                  <><Sparkles className="size-4" /> Infer SCQA with AI</>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowManualEntry(true)} className="text-muted-foreground">
                Enter manually
              </Button>
            </div>
          </div>
        )}

        {/* MANUAL ENTRY */}
        {mode === "input" && showManualEntry && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Fill in the SCQA fields directly.{" "}
              <button onClick={() => setShowManualEntry(false)} className="underline text-primary hover:text-primary/80">
                Or use AI inference
              </button>
            </p>
            <ScqaFields {...{situation,complication,question,answer}}
              onSituationChange={setSituation} onComplicationChange={setComplication}
              onQuestionChange={setQuestion} onAnswerChange={setAnswer} onBlur={handleBlur} />
          </div>
        )}

        {/* REVIEW MODE */}
        {mode === "review" && (
          <div className="space-y-4">
            {problemDescription && (
              <div className="bg-muted/40 rounded-lg p-3 border">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your original problem:</p>
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{problemDescription}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="shrink-0 gap-1.5 text-xs">
                    <RotateCcw className="size-3" /> Edit
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">AI inferred SCQA structure. Edit any field as needed.</p>
            <ScqaFields {...{situation,complication,question,answer}}
              onSituationChange={setSituation} onComplicationChange={setComplication}
              onQuestionChange={setQuestion} onAnswerChange={setAnswer} onBlur={handleBlur} />
          </div>
        )}

        {/* GATE G1 */}
        {(mode === "review" || showManualEntry) && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Gate G1: Approve problem framing before proceeding</span>
              </div>
              <Button variant={approved ? "outline" : "default"} className="gap-2" onClick={handleApprove}>
                {approved ? <Check className="size-4" /> : <Shield className="size-4" />}
                {approved ? "G1 Approved" : "Approve G1"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
// ─── Sub-component: SCQA Fields ─────────────────────────────────────
function ScqaFields({ situation, complication, question, answer, onSituationChange, onComplicationChange, onQuestionChange, onAnswerChange, onBlur }: {
  situation: string; complication: string; question: string; answer: string;
  onSituationChange: (v: string) => void; onComplicationChange: (v: string) => void;
  onQuestionChange: (v: string) => void; onAnswerChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <span className="size-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-[10px] font-bold">S</span>
          Situation
        </Label>
        <Textarea value={situation} onChange={(e) => onSituationChange(e.target.value)} onBlur={onBlur} rows={3} />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <span className="size-5 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-[10px] font-bold">C</span>
          Complication
        </Label>
        <Textarea value={complication} onChange={(e) => onComplicationChange(e.target.value)} onBlur={onBlur} rows={3} />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <span className="size-5 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center text-[10px] font-bold">Q</span>
          Question
        </Label>
        <Textarea value={question} onChange={(e) => onQuestionChange(e.target.value)} onBlur={onBlur} rows={3} />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <span className="size-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-[10px] font-bold">A</span>
          Answer (Hypothesis)
        </Label>
        <Textarea value={answer} onChange={(e) => onAnswerChange(e.target.value)} onBlur={onBlur} rows={3} />
      </div>
    </div>
  );
}

