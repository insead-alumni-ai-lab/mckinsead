import { z } from "zod";
import { CitationSchema } from "./citation";

// ─── SWOT (§7.1) ───────────────────────────────────────────────────────

const SwotItemSchema = z.object({
  id: z.string().uuid(),
  claim: z.string().min(1),
  evidence_ids: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  magnitude: z.enum(["high", "medium", "low"]),
  citations: z.array(CitationSchema).default([]),
});

export const SwotSchema = z.object({
  strengths: z.array(SwotItemSchema),
  weaknesses: z.array(SwotItemSchema),
  opportunities: z.array(SwotItemSchema),
  threats: z.array(SwotItemSchema),
  cross_strategies: z.object({
    so: z.array(z.string()).describe("Strength-Opportunity strategies"),
    wo: z.array(z.string()).describe("Weakness-Opportunity strategies"),
    st: z.array(z.string()).describe("Strength-Threat strategies"),
    wt: z.array(z.string()).describe("Weakness-Threat strategies"),
  }),
  completed_at: z.string().datetime().optional(),
  critique_annotations: z.array(z.string()).default([]),
});

export type Swot = z.infer<typeof SwotSchema>;
export type SwotItem = z.infer<typeof SwotItemSchema>;

// ─── PESTEL (§7.2) ─────────────────────────────────────────────────────

const PestelCategory = z.enum([
  "political",
  "economic",
  "social",
  "technological",
  "environmental",
  "legal",
]);

const PestelSignalSchema = z.object({
  id: z.string().uuid(),
  category: PestelCategory,
  claim: z.string().min(1),
  impact: z.number().int().min(1).max(5),
  time_horizon: z.enum(["0-6m", "6-24m", "24m+"]),
  citation: CitationSchema,
  so_what: z.string().optional(),
});

export const PestelSchema = z.object({
  signals: z.array(PestelSignalSchema),
  completed_at: z.string().datetime().optional(),
  critique_annotations: z.array(z.string()).default([]),
});

export type Pestel = z.infer<typeof PestelSchema>;
export type PestelSignal = z.infer<typeof PestelSignalSchema>;

// ─── Porter's Five Forces (§7.3) ───────────────────────────────────────

const PorterForceSchema = z.object({
  narrative: z.string(),
  intensity: z.number().int().min(1).max(5),
  quantitative_anchors: z
    .array(z.object({ metric: z.string(), value: z.string(), citation: CitationSchema.optional() }))
    .min(0)
    .max(5),
});

export const Porter5Schema = z.object({
  rivalry: PorterForceSchema,
  new_entrants: PorterForceSchema,
  substitutes: PorterForceSchema,
  supplier_power: PorterForceSchema,
  buyer_power: PorterForceSchema,
  overall_attractiveness: z.number().int().min(1).max(5).optional(),
  completed_at: z.string().datetime().optional(),
  critique_annotations: z.array(z.string()).default([]),
});

export type Porter5 = z.infer<typeof Porter5Schema>;

// ─── BCG Matrix (§7.4) ─────────────────────────────────────────────────

const BcgItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  relative_market_share: z.number(),
  market_growth_rate: z.number(),
  revenue: z.number().optional(),
  quadrant: z.enum(["star", "cash_cow", "question_mark", "dog"]),
  recommended_action: z.string(),
});

export const BcgSchema = z.object({
  items: z.array(BcgItemSchema),
  completed_at: z.string().datetime().optional(),
  critique_annotations: z.array(z.string()).default([]),
});

export type Bcg = z.infer<typeof BcgSchema>;

// ─── Ansoff Matrix (§7.5) ──────────────────────────────────────────────

const AnsoffCellSchema = z.object({
  moves: z.array(
    z.object({
      description: z.string(),
      linked_bcg_ids: z.array(z.string()).default([]),
      feasibility: z.number().min(0).max(1).optional(),
      attractiveness: z.number().min(0).max(1).optional(),
    })
  ),
});

export const AnsoffSchema = z.object({
  market_penetration: AnsoffCellSchema,
  market_development: AnsoffCellSchema,
  product_development: AnsoffCellSchema,
  diversification: AnsoffCellSchema,
  completed_at: z.string().datetime().optional(),
  critique_annotations: z.array(z.string()).default([]),
});

export type Ansoff = z.infer<typeof AnsoffSchema>;

// ─── SIPOC (§7.6) ──────────────────────────────────────────────────────

const SipocRowSchema = z.object({
  process_name: z.string(),
  suppliers: z.array(z.string()),
  inputs: z.array(z.string()),
  process_steps: z.array(z.string()),
  outputs: z.array(z.string()),
  customers: z.array(z.string()),
});

export const SipocSchema = z.object({
  rows: z.array(SipocRowSchema),
  completed_at: z.string().datetime().optional(),
  critique_annotations: z.array(z.string()).default([]),
});

export type Sipoc = z.infer<typeof SipocSchema>;

// ─── Value Chain (§7.7) ────────────────────────────────────────────────

const ActivitySchema = z.object({
  name: z.string(),
  description: z.string(),
  cost_share_pct: z.number().min(0).max(100).optional(),
  differentiation_contribution: z.enum(["high", "medium", "low"]).optional(),
  margin_gap_vs_benchmark: z.number().optional(),
});

export const ValueChainSchema = z.object({
  primary: z.object({
    inbound_logistics: ActivitySchema,
    operations: ActivitySchema,
    outbound_logistics: ActivitySchema,
    marketing_sales: ActivitySchema,
    service: ActivitySchema,
  }),
  support: z.object({
    firm_infrastructure: ActivitySchema,
    hr_management: ActivitySchema,
    technology_development: ActivitySchema,
    procurement: ActivitySchema,
  }),
  completed_at: z.string().datetime().optional(),
  critique_annotations: z.array(z.string()).default([]),
});

export type ValueChain = z.infer<typeof ValueChainSchema>;

// ─── Root Cause (§7.8) ─────────────────────────────────────────────────

const FiveWhyChainSchema = z.object({
  problem: z.string(),
  whys: z.array(z.string()).min(1).max(7),
  root_cause: z.string(),
});

const IshikawaCategorySchema = z.object({
  category: z.enum(["man", "machine", "material", "method", "measurement", "mother_nature"]),
  causes: z.array(z.string()),
});

export const RootCauseSchema = z.object({
  problem_statement: z.string(),
  five_whys: z.array(FiveWhyChainSchema),
  ishikawa: z.array(IshikawaCategorySchema),
  completed_at: z.string().datetime().optional(),
  critique_annotations: z.array(z.string()).default([]),
});

export type RootCause = z.infer<typeof RootCauseSchema>;

// ─── Combined Frameworks Object ────────────────────────────────────────

export const FrameworksSchema = z.object({
  swot: SwotSchema.optional(),
  pestel: PestelSchema.optional(),
  porter5: Porter5Schema.optional(),
  bcg: BcgSchema.optional(),
  ansoff: AnsoffSchema.optional(),
  sipoc: SipocSchema.optional(),
  value_chain: ValueChainSchema.optional(),
  root_cause: RootCauseSchema.optional(),
});

export type Frameworks = z.infer<typeof FrameworksSchema>;
