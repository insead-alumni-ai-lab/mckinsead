import { z } from "zod";
import { CitationSchema } from "./citation";
import { FrameworksSchema } from "./frameworks";

// ─── Engagement Stages (§5) ────────────────────────────────────────────

export const EngagementStage = z.enum([
  "scoping",
  "frameworks",
  "hypothesis",
  "analysis",
  "synthesis",
  "communication",
  "export",
]);

export type EngagementStageType = z.infer<typeof EngagementStage>;

// ─── Problem Statement / SCQA (§4) ────────────────────────────────────

export const ScqaSchema = z.object({
  situation: z.string().describe("Current state of affairs"),
  complication: z.string().describe("What changed or went wrong"),
  question: z.string().describe("The strategic question to answer"),
  answer_hypothesis: z.string().describe("Initial hypothesis for the answer"),
});

export const ProblemStatementSchema = z.object({
  scqa: ScqaSchema,
  decision_maker: z.string().describe("Who will make the final decision"),
  deadline: z.string().optional().describe("Target date for recommendation"),
  success_criteria: z.array(z.string()).default([]),
  out_of_scope: z.array(z.string()).default([]),
});

export type ProblemStatement = z.infer<typeof ProblemStatementSchema>;

// ─── Company Profile ───────────────────────────────────────────────────

const BusinessUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  revenue_ttm: z.number().optional(),
  description: z.string().optional(),
});

export const CompanyProfileSchema = z.object({
  name: z.string(),
  industry: z.string(),
  sector: z.string().optional(),
  description: z.string().optional(),
  org_chart_ref: z.string().optional(),
  business_units: z.array(BusinessUnitSchema).default([]),
  products: z.array(z.string()).default([]),
  geographies: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  employee_count: z.number().optional(),
  annual_revenue: z.number().optional(),
});

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

// ─── External Context ──────────────────────────────────────────────────

const ExternalSignalSchema = z.object({
  id: z.string().uuid(),
  category: z.string(),
  claim: z.string(),
  source: CitationSchema,
  retrieved_at: z.string().datetime(),
});

export const ExternalContextSchema = z.object({
  pestel_signals: z.array(ExternalSignalSchema).default([]),
});

// ─── Hypothesis Tree (§7.9) ───────────────────────────────────────────

const HypothesisStatus = z.enum([
  "untested",
  "in_testing",
  "supported",
  "refuted",
  "needs_revisit",
  "deprioritized",
]);

export const HypothesisNodeSchema: z.ZodType<HypothesisNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    claim: z.string(),
    status: HypothesisStatus,
    tests: z.array(z.string()).default([]).describe("IDs of analyses testing this hypothesis"),
    evidence: z.array(z.string()).default([]).describe("IDs of evidence items"),
    prioritization_score: z.number().optional().describe("impact × ease × confidence_gap"),
    children: z.array(HypothesisNodeSchema).default([]),
  })
);

export interface HypothesisNode {
  id: string;
  claim: string;
  status: z.infer<typeof HypothesisStatus>;
  tests: string[];
  evidence: string[];
  prioritization_score?: number;
  children: HypothesisNode[];
}

export const HypothesisTreeSchema = z.object({
  governing: z.string().describe("The governing hypothesis — the answer to the strategic question"),
  children: z.array(HypothesisNodeSchema).default([]),
});

export type HypothesisTree = z.infer<typeof HypothesisTreeSchema>;

// ─── Analysis (§7.10) ─────────────────────────────────────────────────

export const AnalysisMethod = z.enum([
  "descriptive",
  "comparative",
  "causal",
  "forecasting",
  "qualitative",
]);

export const AnalysisSchema = z.object({
  id: z.string(),
  hypothesis_id: z.string(),
  method: AnalysisMethod,
  inputs: z.array(z.string()),
  result: z.record(z.unknown()).optional(),
  so_what: z.string().describe("The insight — mandatory per §2"),
  confidence: z.number().min(0).max(1),
  limitations: z.array(z.string()).default([]),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

// ─── Pyramid (§7.11) ──────────────────────────────────────────────────

export const PyramidSchema = z.object({
  governing_thought: z.string().describe("The one-sentence answer"),
  key_lines: z
    .array(
      z.object({
        argument: z.string(),
        supports: z.array(z.string()).describe("Analysis IDs backing this argument"),
      })
    )
    .min(1)
    .max(7),
});

export type Pyramid = z.infer<typeof PyramidSchema>;

// ─── Deck / Slides (§7.12) ────────────────────────────────────────────

export const SlideSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  action_title: z.string().describe("Lead with the so-what, ≤14 words"),
  body_type: z.enum(["chart", "table", "bullets", "kpi", "quote"]),
  body_content: z.record(z.unknown()),
  footer_sources: z.array(z.string()).default([]),
});

export const DeckSchema = z.object({
  slides: z.array(SlideSchema).default([]),
  html_uri: z.string().optional(),
});

export type Deck = z.infer<typeof DeckSchema>;

// ─── Audit Log ─────────────────────────────────────────────────────────

export const AuditEntrySchema = z.object({
  ts: z.string().datetime(),
  agent: z.string(),
  action: z.string(),
  diff: z.string().optional().describe("JSON patch or human-readable diff"),
});

// ─── The Engagement Object (§4) ───────────────────────────────────────

export const EngagementSchema = z.object({
  engagement_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  version: z.number().int().min(0),
  stage: EngagementStage,
  problem_statement: ProblemStatementSchema.optional(),
  company_profile: CompanyProfileSchema.optional(),
  external_context: ExternalContextSchema.optional(),
  frameworks: FrameworksSchema.optional(),
  hypothesis_tree: HypothesisTreeSchema.optional(),
  analyses: z.array(AnalysisSchema).default([]),
  pyramid: PyramidSchema.optional(),
  deck: DeckSchema.optional(),
  audit_log: z.array(AuditEntrySchema).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Engagement = z.infer<typeof EngagementSchema>;

// ─── Gate Definitions (§6) ─────────────────────────────────────────────

export const GateId = z.enum(["G1", "G2", "G3", "G4", "G5"]);

export const GateSchema = z.object({
  id: GateId,
  name: z.string(),
  description: z.string(),
  required_before_stage: EngagementStage,
  approved: z.boolean().default(false),
  approved_at: z.string().datetime().optional(),
});

export const GATES: z.infer<typeof GateSchema>[] = [
  {
    id: "G1",
    name: "Problem Statement Lock",
    description: "User signs off the SCQA problem statement",
    required_before_stage: "frameworks",
    approved: false,
  },
  {
    id: "G2",
    name: "Framework Selection",
    description: "User selects which frameworks to run",
    required_before_stage: "frameworks",
    approved: false,
  },
  {
    id: "G3",
    name: "Hypothesis Tree Approval",
    description: "User approves the hypothesis tree structure",
    required_before_stage: "analysis",
    approved: false,
  },
  {
    id: "G4",
    name: "Pyramid Storyline Approval",
    description: "User approves the pyramid structure before slides",
    required_before_stage: "communication",
    approved: false,
  },
  {
    id: "G5",
    name: "Deck Export Approval",
    description: "Final review before export",
    required_before_stage: "export",
    approved: false,
  },
];
