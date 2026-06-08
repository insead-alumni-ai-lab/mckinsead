import type { Id } from "../../../convex/_generated/dataModel";

export type Stage = "scoping" | "frameworks" | "hypothesis" | "analysis" | "synthesis" | "communication" | "export";

export type FrameworkTab = "swot" | "pestel" | "porter5" | "bcg" | "ansoff" | "sipoc" | "value_chain" | "root_cause";

export interface EngagementData {
  _id: Id<"engagements">;
  company: string;
  industry: string;
  question?: string | null;
  geographies?: string | null;
  competitors?: string | null;
  stage: string;
  progress: number;
  scopingData?: string | null;
  hypothesisData?: string | null;
  synthesisData?: string | null;
  communicationData?: string | null;
  gatesApproved?: string | null;
}

export interface FrameworkProps {
  engagementId: Id<"engagements">;
  data?: { status: string; data: string; error?: string } | null;
}

export interface FrameworkDataItem {
  _id: Id<"frameworkData">;
  framework: string;
  data: string;
  status: string;
  error?: string;
}
