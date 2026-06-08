import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Check, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { EngagementData } from "./types";

export function ScopingPanel({ engagement, engagementId }: { engagement: EngagementData; engagementId: Id<"engagements"> }) {
  const saved = engagement.scopingData ? (() => { try { return JSON.parse(engagement.scopingData!); } catch { return null; } })() : null;
  const savedGates: string[] = engagement.gatesApproved ? (() => { try { return JSON.parse(engagement.gatesApproved!); } catch { return []; } })() : [];

  const [situation, setSituation] = useState(
    saved?.situation ?? `We are analyzing ${engagement.company} in the ${engagement.industry} industry.`
  );
  const [complication, setComplication] = useState(saved?.complication ?? "");
  const [question, setQuestion] = useState(saved?.question ?? engagement.question ?? "");
  const [answer, setAnswer] = useState(saved?.answer ?? "");
  const [approved, setApproved] = useState(savedGates.includes("G1"));
  const updateStage = useMutation(api.engagements.updateStage);
  const saveStageData = useMutation(api.engagements.saveStageData);

  const handleSave = useCallback(() => {
    saveStageData({
      id: engagementId,
      scopingData: JSON.stringify({ situation, complication, question, answer }),
    });
  }, [saveStageData, engagementId, situation, complication, question, answer]);

  const handleApprove = () => {
    const newApproved = !approved;
    setApproved(newApproved);
    const gates = newApproved
      ? [...savedGates.filter((g) => g !== "G1"), "G1"]
      : savedGates.filter((g) => g !== "G1");
    saveStageData({
      id: engagementId,
      scopingData: JSON.stringify({ situation, complication, question, answer }),
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
            <Textarea value={situation} onChange={(e) => setSituation(e.target.value)} onBlur={handleSave} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <span className="size-5 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-[10px] font-bold">C</span>
              Complication
            </Label>
            <Textarea value={complication} onChange={(e) => setComplication(e.target.value)} onBlur={handleSave} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <span className="size-5 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center text-[10px] font-bold">Q</span>
              Question
            </Label>
            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} onBlur={handleSave} rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <span className="size-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-[10px] font-bold">A</span>
              Answer (Hypothesis)
            </Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} onBlur={handleSave} rows={3} />
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
