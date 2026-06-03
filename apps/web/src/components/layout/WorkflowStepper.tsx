"use client";

/**
 * Visual workflow stepper showing the 7 stages of the McKinsey-mirrored process.
 * FR-15: Visual workflow timeline showing all steps and current position.
 */

const STAGES = [
  { id: "scoping", label: "Scope", icon: "🎯" },
  { id: "frameworks", label: "Diagnose", icon: "🔍" },
  { id: "hypothesis", label: "Hypothesize", icon: "💡" },
  { id: "analysis", label: "Analyze", icon: "📊" },
  { id: "synthesis", label: "Synthesize", icon: "🧩" },
  { id: "communication", label: "Communicate", icon: "📋" },
  { id: "export", label: "Export", icon: "📤" },
] as const;

interface Props {
  currentStage: string;
  onStageClick?: (stage: string) => void;
}

export function WorkflowStepper({ currentStage, onStageClick }: Props) {
  const currentIdx = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-100 p-3 overflow-x-auto">
      {STAGES.map((stage, i) => {
        const isActive = stage.id === currentStage;
        const isCompleted = i < currentIdx;
        const isFuture = i > currentIdx;

        return (
          <div key={stage.id} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  isCompleted ? "bg-accent-500" : "bg-navy-200"
                }`}
              />
            )}
            <button
              onClick={() => onStageClick?.(stage.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                ${isActive ? "bg-accent-50 text-accent-700 ring-2 ring-accent-500" : ""}
                ${isCompleted ? "text-accent-600" : ""}
                ${isFuture ? "text-navy-300" : ""}
                hover:bg-navy-50`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                  ${isCompleted ? "bg-accent-500 text-white" : ""}
                  ${isActive ? "bg-accent-600 text-white" : ""}
                  ${isFuture ? "bg-navy-100 text-navy-400" : ""}`}
              >
                {isCompleted ? "✓" : stage.icon}
              </span>
              <span className="hidden sm:inline">{stage.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
