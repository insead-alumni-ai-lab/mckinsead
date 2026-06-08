import { useState, useCallback, useEffect } from "react";
import { FaIcon, FA } from "@/components/FaIcon";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  MessageSquare,
  RotateCcw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Extracted sub-components (#5 — EngagementPage split)
import type { Stage, FrameworkTab } from "@/components/engagement/types";
import { ScopingPanel } from "@/components/engagement/ScopingPanel";
import {
  GenerateAllButton,
  SwotCanvas,
  PestelCanvas,
  Porter5Canvas,
  BcgCanvas,
  AnsoffCanvas,
  SipocCanvas,
  ValueChainCanvas,
  RootCauseCanvas,
} from "@/components/engagement/FrameworkCanvases";
import { HypothesisPanel } from "@/components/engagement/HypothesisPanel";
import { AnalysisPanel, SynthesisPanel, CommunicationPanel } from "@/components/engagement/StagePanels";
import { ExportPanel } from "@/components/engagement/ExportPanel";

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
  const [chatOpen, setChatOpen] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);

  // ─── Load engagement from Convex ─────────────────────────
  const engagement = useQuery(api.engagements.get, { id: engagementId });
  const frameworkDataList = useQuery(api.frameworkData.listByEngagement, { engagementId });
  const versions = useQuery(api.audit.listVersions, { engagementId });
  const initializeFrameworks = useMutation(api.frameworkData.initializeAll);
  const updateStage = useMutation(api.engagements.updateStage);
  const saveVersion = useMutation(api.audit.saveVersion);
  const restoreVersion = useMutation(api.audit.restoreVersion);

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
    const stageIndex = STAGES.findIndex((s) => s.id === stage);
    const progress = Math.round(((stageIndex + 1) / STAGES.length) * 100);
    updateStage({ id: engagementId, stage, progress: Math.max(engagement?.progress ?? 0, progress) });
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {STAGES.find((s) => s.id === currentStage)?.label || currentStage}
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowVersions(true)}>
            <History className="size-3" />
            Versions{versions && versions.length > 0 ? ` (${versions.length})` : ""}
          </Button>
        </div>
      </div>

      {/* Version Management Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5" />
              Version History
            </DialogTitle>
            <DialogDescription>
              Save snapshots of your engagement and restore previous versions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Version label (optional)"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm"
                className="gap-1.5 shrink-0"
                disabled={savingVersion}
                onClick={async () => {
                  setSavingVersion(true);
                  try {
                    await saveVersion({ engagementId, label: versionLabel || undefined });
                    setVersionLabel("");
                  } catch (err) {
                    console.error("Save version failed:", err);
                  } finally {
                    setSavingVersion(false);
                  }
                }}
              >
                {savingVersion ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                Save
              </Button>
            </div>
            <Separator />
            <div className="max-h-[240px] overflow-y-auto space-y-2">
              {(!versions || versions.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No versions saved yet. Save a snapshot to track your progress.
                </p>
              )}
              {versions?.map((ver) => (
                <div key={ver._id} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium">{ver.label}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-2.5" />
                      {new Date(ver.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={async () => {
                      if (confirm(`Restore "${ver.label}"? Current unsaved changes will be overwritten.`)) {
                        await restoreVersion({ engagementId, versionId: ver._id as Id<"engagementVersions"> });
                        setShowVersions(false);
                      }
                    }}
                  >
                    <RotateCcw className="size-3" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersions(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overall Progress Bar */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground text-xs font-medium">Progress</span>
        <div className="flex-1 bg-muted rounded-full h-2">
          <div className="bg-primary rounded-full h-2 transition-all duration-500" style={{ width: `${engagement.progress}%` }} />
        </div>
        <span className="text-xs font-semibold">{engagement.progress}%</span>
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
      {currentStage === "synthesis" && <SynthesisPanel engagement={engagement} engagementId={engagementId} />}
      {currentStage === "communication" && <CommunicationPanel />}
      {currentStage === "export" && <ExportPanel engagement={engagement} engagementId={engagementId} frameworkDataList={frameworkDataList ?? []} />}

      {/* Chat FAB */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          title="Open AI Strategy Consultant"
        >
          <MessageSquare className="size-6" />
        </button>
      )}

      {/* Chat Sidebar */}
      <ChatSidebar
        engagementId={engagementId}
        stage={currentStage}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}
