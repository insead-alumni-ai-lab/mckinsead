import type { EngagementStageType } from "@mckinsead/schemas";

/**
 * Engagement State Machine (§5)
 *
 * SCOPE → DIAGNOSE(frameworks) → HYPOTHESIZE → ANALYZE → SYNTHESIZE → COMMUNICATE → EXPORT
 *
 * Transitions are gated (§6). The orchestrator must check gates before advancing.
 */

const STAGE_ORDER: EngagementStageType[] = [
  "scoping",
  "frameworks",
  "hypothesis",
  "analysis",
  "synthesis",
  "communication",
  "export",
];

const STAGE_GATES: Partial<Record<EngagementStageType, string[]>> = {
  frameworks: ["G1", "G2"], // Problem statement lock + framework selection
  analysis: ["G3"],         // Hypothesis tree approval
  communication: ["G4"],    // Pyramid storyline approval
  export: ["G5"],           // Deck export approval
};

export function getNextStage(
  current: EngagementStageType
): EngagementStageType | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function getPreviousStage(
  current: EngagementStageType
): EngagementStageType | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1];
}

export function getRequiredGates(stage: EngagementStageType): string[] {
  return STAGE_GATES[stage] ?? [];
}

export function canAdvanceTo(
  targetStage: EngagementStageType,
  approvedGates: string[]
): { allowed: boolean; missingGates: string[] } {
  const required = getRequiredGates(targetStage);
  const missing = required.filter((g) => !approvedGates.includes(g));
  return { allowed: missing.length === 0, missingGates: missing };
}

export function getStageIndex(stage: EngagementStageType): number {
  return STAGE_ORDER.indexOf(stage);
}

export function isValidPivotTarget(
  current: EngagementStageType,
  target: EngagementStageType
): boolean {
  // Can pivot to any earlier stage
  return getStageIndex(target) < getStageIndex(current);
}

export { STAGE_ORDER };
