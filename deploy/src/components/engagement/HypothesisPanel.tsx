import { useMutation } from "convex/react";
import {
  CheckCircle2,
  GitBranch,
  LayoutList,
  Network,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextareaWithMic } from "@/components/ui/textarea-with-mic";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { EngagementData } from "./types";

export function HypothesisPanel({
  engagement,
  engagementId,
  frameworkDataList,
}: {
  engagement: EngagementData;
  engagementId: Id<"engagements">;
  frameworkDataList: Array<{ framework: string; data: string; status: string }>;
}) {
  type HypothesisChild = {
    id: string;
    text: string;
    status: string;
    evidence?: string;
    priority?: string;
  };
  type Hypothesis = {
    id: string;
    text: string;
    status: string;
    evidence?: string;
    priority?: string;
    children: HypothesisChild[];
  };
  const saved: Hypothesis[] | null = engagement.hypothesisData
    ? (() => {
        try {
          return JSON.parse(engagement.hypothesisData!);
        } catch {
          return null;
        }
      })()
    : null;

  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(
    saved ?? [{ id: "H1", text: "", status: "open", children: [] }],
  );
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const saveStageData = useMutation(api.engagements.saveStageData);

  // Auto-save on any change (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveStageData({
        id: engagementId,
        hypothesisData: JSON.stringify(hypotheses),
      });
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [hypotheses, saveStageData, engagementId]);

  const completedFrameworks = frameworkDataList.filter(
    f => f.status === "done",
  ).length;

  const statusConfig: Record<
    string,
    { bg: string; border: string; dot: string; label: string }
  > = {
    open: {
      bg: "bg-slate-50 dark:bg-slate-900/50",
      border: "border-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
      label: "Open",
    },
    testing: {
      bg: "bg-blue-50 dark:bg-blue-950/50",
      border: "border-blue-300 dark:border-blue-800",
      dot: "bg-blue-500",
      label: "Testing",
    },
    confirmed: {
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      border: "border-emerald-300 dark:border-emerald-800",
      dot: "bg-emerald-500",
      label: "Confirmed",
    },
    rejected: {
      bg: "bg-red-50 dark:bg-red-950/50",
      border: "border-red-300 dark:border-red-800",
      dot: "bg-red-500",
      label: "Rejected",
    },
  };

  // MECE analysis
  const totalNodes = hypotheses.reduce(
    (sum, h) => sum + 1 + h.children.length,
    0,
  );
  const testedNodes = hypotheses.reduce((sum, h) => {
    const parentTested =
      h.status === "confirmed" || h.status === "rejected" ? 1 : 0;
    const childTested = h.children.filter(
      c => c.status === "confirmed" || c.status === "rejected",
    ).length;
    return sum + parentTested + childTested;
  }, 0);
  const meceScore =
    totalNodes > 0 ? Math.round((testedNodes / totalNodes) * 100) : 0;

  const removeHypothesis = (hi: number) => {
    const next = hypotheses
      .filter((_, i) => i !== hi)
      .map((h, i) => ({
        ...h,
        id: `H${i + 1}`,
        children: h.children.map((c, ci) => ({
          ...c,
          id: `H${i + 1}.${ci + 1}`,
        })),
      }));
    setHypotheses(next);
  };

  const removeChild = (hi: number, ci: number) => {
    const next = [...hypotheses];
    next[hi] = {
      ...next[hi],
      children: next[hi].children
        .filter((_, i) => i !== ci)
        .map((c, i) => ({ ...c, id: `${next[hi].id}.${i + 1}` })),
    };
    setHypotheses(next);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-5 text-primary" /> Hypothesis Tree
            </CardTitle>
            <CardDescription>
              Structure hypotheses hierarchically — each must be testable and
              MECE
              {completedFrameworks > 0 && (
                <span className="ml-2 text-xs text-green-600">
                  <CheckCircle2 className="size-3 inline mr-1" />
                  {completedFrameworks} framework
                  {completedFrameworks !== 1 ? "s" : ""} ready
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("tree")}
              className={`p-1.5 rounded text-xs ${viewMode === "tree" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              title="Tree view"
            >
              <Network className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded text-xs ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              title="List view"
            >
              <LayoutList className="size-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MECE Coverage Bar */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">MECE Coverage</span>
            <span
              className={`text-xs font-bold ${meceScore === 100 ? "text-emerald-600" : meceScore > 50 ? "text-amber-600" : "text-muted-foreground"}`}
            >
              {meceScore}% ({testedNodes}/{totalNodes} tested)
            </span>
          </div>
          <div className="flex gap-1 h-2">
            {hypotheses.map((h, hi) => (
              <React.Fragment key={h.id}>
                <div
                  className={`rounded-full transition-all ${
                    h.status === "confirmed"
                      ? "bg-emerald-500"
                      : h.status === "rejected"
                        ? "bg-red-400"
                        : h.status === "testing"
                          ? "bg-blue-400 animate-pulse"
                          : "bg-slate-300 dark:bg-slate-600"
                  }`}
                  style={{ flex: 1 }}
                  title={`${h.id}: ${statusConfig[h.status].label}`}
                />
                {h.children.map((c, ci) => (
                  <div
                    key={`${hi}-${ci}`}
                    className={`rounded-full transition-all ${
                      c.status === "confirmed"
                        ? "bg-emerald-500"
                        : c.status === "rejected"
                          ? "bg-red-400"
                          : c.status === "testing"
                            ? "bg-blue-400 animate-pulse"
                            : "bg-slate-300 dark:bg-slate-600"
                    }`}
                    style={{ flex: 0.6 }}
                    title={`${c.id}: ${statusConfig[c.status].label}`}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <span
                key={key}
                className="flex items-center gap-1 text-[10px] text-muted-foreground"
              >
                <span className={`size-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tree View */}
        {viewMode === "tree" ? (
          <div className="space-y-0">
            {/* Central question node */}
            <div className="flex justify-center mb-2">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-md">
                {engagement.question ||
                  engagement.company + " — Strategic Question"}
              </div>
            </div>
            {/* Vertical connector */}
            {hypotheses.length > 0 && (
              <div className="flex justify-center">
                <div className="w-px h-6 bg-border" />
              </div>
            )}
            {/* Horizontal spread */}
            <div className="flex justify-center">
              {hypotheses.length > 1 && (
                <div
                  className="border-t-2 border-border"
                  style={{ width: `${Math.min(90, hypotheses.length * 25)}%` }}
                />
              )}
            </div>
            {/* Hypothesis branches */}
            <div
              className={`grid gap-4 ${hypotheses.length === 1 ? "grid-cols-1 max-w-md mx-auto" : hypotheses.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
            >
              {hypotheses.map((h, hi) => {
                const st = statusConfig[h.status];
                return (
                  <div key={h.id} className="flex flex-col items-center">
                    {/* Vertical connector from top bar */}
                    <div className="w-px h-4 bg-border" />
                    {/* Hypothesis card */}
                    <div
                      className={`w-full border-2 ${st.border} ${st.bg} rounded-xl p-3 relative group`}
                    >
                      <button
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full size-5 flex items-center justify-center text-xs transition-opacity"
                        onClick={() => removeHypothesis(hi)}
                      >
                        <Trash2 className="size-3" />
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`size-2.5 rounded-full ${st.dot}`} />
                        <span className="font-mono text-xs font-bold">
                          {h.id}
                        </span>
                        <Select
                          value={h.status}
                          onValueChange={val => {
                            const next = [...hypotheses];
                            next[hi] = { ...next[hi], status: val };
                            setHypotheses(next);
                          }}
                        >
                          <SelectTrigger className="h-5 w-20 text-[10px] ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="testing">Testing</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <TextareaWithMic
                        value={h.text}
                        onChange={e => {
                          const next = [...hypotheses];
                          next[hi] = { ...next[hi], text: e.target.value };
                          setHypotheses(next);
                        }}
                        onTranscription={text => {
                          const next = [...hypotheses];
                          next[hi] = { ...next[hi], text };
                          setHypotheses(next);
                        }}
                        placeholder="Enter hypothesis..."
                        className="text-sm min-h-[60px] resize-none bg-transparent border-dashed"
                        rows={2}
                      />
                      {/* Priority & Evidence */}
                      <div className="flex items-center gap-2 mt-2">
                        <Select
                          value={h.priority ?? "medium"}
                          onValueChange={val => {
                            const next = [...hypotheses];
                            next[hi] = { ...next[hi], priority: val };
                            setHypotheses(next);
                          }}
                        >
                          <SelectTrigger className="h-5 w-20 text-[10px]">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">🔴 High</SelectItem>
                            <SelectItem value="medium">🟡 Medium</SelectItem>
                            <SelectItem value="low">🟢 Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={h.evidence ?? ""}
                          onChange={e => {
                            const next = [...hypotheses];
                            next[hi] = {
                              ...next[hi],
                              evidence: e.target.value,
                            };
                            setHypotheses(next);
                          }}
                          className="h-5 text-[10px] bg-transparent border-dashed flex-1"
                          placeholder="Evidence / notes..."
                        />
                      </div>
                      {/* Children */}
                      {h.children.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="w-px h-3 bg-border mx-auto" />
                          {h.children.map((child, ci) => {
                            const cst = statusConfig[child.status];
                            return (
                              <div
                                key={child.id}
                                className={`border ${cst.border} ${cst.bg} rounded-lg p-2 relative group/child ml-2`}
                              >
                                <button
                                  className="absolute -top-1.5 -right-1.5 opacity-0 group-hover/child:opacity-100 bg-destructive text-destructive-foreground rounded-full size-4 flex items-center justify-center text-[10px] transition-opacity"
                                  onClick={() => removeChild(hi, ci)}
                                >
                                  <Trash2 className="size-2.5" />
                                </button>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span
                                    className={`size-2 rounded-full ${cst.dot}`}
                                  />
                                  <span className="font-mono text-[10px] font-bold">
                                    {child.id}
                                  </span>
                                  <Select
                                    value={child.status}
                                    onValueChange={val => {
                                      const next = [...hypotheses];
                                      next[hi] = {
                                        ...next[hi],
                                        children: [...next[hi].children],
                                      };
                                      next[hi].children[ci] = {
                                        ...next[hi].children[ci],
                                        status: val,
                                      };
                                      setHypotheses(next);
                                    }}
                                  >
                                    <SelectTrigger className="h-4 w-16 text-[9px] ml-auto">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="testing">
                                        Testing
                                      </SelectItem>
                                      <SelectItem value="confirmed">
                                        Confirmed
                                      </SelectItem>
                                      <SelectItem value="rejected">
                                        Rejected
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Input
                                  value={child.text}
                                  onChange={e => {
                                    const next = [...hypotheses];
                                    next[hi] = {
                                      ...next[hi],
                                      children: [...next[hi].children],
                                    };
                                    next[hi].children[ci] = {
                                      ...next[hi].children[ci],
                                      text: e.target.value,
                                    };
                                    setHypotheses(next);
                                  }}
                                  className="h-7 text-xs bg-transparent border-dashed"
                                  placeholder="Sub-hypothesis..."
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-[10px] gap-1 h-6 w-full"
                        onClick={() => {
                          const next = [...hypotheses];
                          const childId = `${h.id}.${h.children.length + 1}`;
                          next[hi] = {
                            ...next[hi],
                            children: [
                              ...next[hi].children,
                              { id: childId, text: "", status: "open" },
                            ],
                          };
                          setHypotheses(next);
                        }}
                      >
                        <Plus className="size-2.5" /> Sub-hypothesis
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View (compact) */
          <div className="space-y-2">
            {hypotheses.map((h, hi) => {
              const st = statusConfig[h.status];
              return (
                <div
                  key={h.id}
                  className={`border ${st.border} ${st.bg} rounded-lg p-3`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`size-2.5 rounded-full ${st.dot}`} />
                    <span className="font-mono text-xs font-bold">{h.id}</span>
                    <Select
                      value={h.status}
                      onValueChange={val => {
                        const next = [...hypotheses];
                        next[hi] = { ...next[hi], status: val };
                        setHypotheses(next);
                      }}
                    >
                      <SelectTrigger className="h-5 w-24 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => removeHypothesis(hi)}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                  <Input
                    value={h.text}
                    onChange={e => {
                      const next = [...hypotheses];
                      next[hi] = { ...next[hi], text: e.target.value };
                      setHypotheses(next);
                    }}
                    placeholder="Enter hypothesis..."
                    className="mb-2"
                  />
                  {h.children.length > 0 && (
                    <div className="ml-6 border-l-2 border-muted pl-3 space-y-1.5">
                      {h.children.map((child, ci) => (
                        <div key={child.id} className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${statusConfig[child.status].dot}`}
                          />
                          <span className="font-mono text-[10px]">
                            {child.id}
                          </span>
                          <Input
                            value={child.text}
                            className="h-7 text-xs flex-1"
                            placeholder="Sub-hypothesis..."
                            onChange={e => {
                              const next = [...hypotheses];
                              next[hi] = {
                                ...next[hi],
                                children: [...next[hi].children],
                              };
                              next[hi].children[ci] = {
                                ...next[hi].children[ci],
                                text: e.target.value,
                              };
                              setHypotheses(next);
                            }}
                          />
                          <Select
                            value={child.status}
                            onValueChange={val => {
                              const next = [...hypotheses];
                              next[hi] = {
                                ...next[hi],
                                children: [...next[hi].children],
                              };
                              next[hi].children[ci] = {
                                ...next[hi].children[ci],
                                status: val,
                              };
                              setHypotheses(next);
                            }}
                          >
                            <SelectTrigger className="h-5 w-16 text-[9px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="testing">Testing</SelectItem>
                              <SelectItem value="confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeChild(hi, ci)}
                          >
                            <Trash2 className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-xs gap-1 h-6"
                    onClick={() => {
                      const next = [...hypotheses];
                      next[hi] = {
                        ...next[hi],
                        children: [
                          ...next[hi].children,
                          {
                            id: `${h.id}.${h.children.length + 1}`,
                            text: "",
                            status: "open",
                          },
                        ],
                      };
                      setHypotheses(next);
                    }}
                  >
                    <Plus className="size-2.5" /> Sub-hypothesis
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setHypotheses([
              ...hypotheses,
              {
                id: `H${hypotheses.length + 1}`,
                text: "",
                status: "open",
                children: [],
              },
            ]);
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
