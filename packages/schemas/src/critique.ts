import { z } from "zod";

/**
 * Critique schema — CritiqueAgent output (§3.1).
 * The CritiqueAgent runs after every other agent as a mandatory linter.
 */

export const CritiqueCheckType = z.enum([
  "mece",
  "sourcing",
  "so_what",
  "bias",
  "consistency",
  "completeness",
  "actionability",
]);

export const CritiqueSeverity = z.enum(["blocking", "warning", "info"]);

export const CritiqueAnnotationSchema = z.object({
  id: z.string(),
  check_type: CritiqueCheckType,
  severity: CritiqueSeverity,
  target: z.string().describe("What was critiqued — e.g. 'frameworks.swot.strengths[2]'"),
  message: z.string(),
  suggestion: z.string().optional(),
  resolved: z.boolean().default(false),
  resolved_at: z.string().datetime().optional(),
});

export const CritiqueResultSchema = z.object({
  target_agent: z.string(),
  target_artifact: z.string(),
  annotations: z.array(CritiqueAnnotationSchema),
  pass: z.boolean(),
  blocking_count: z.number().int(),
  warning_count: z.number().int(),
  critiqued_at: z.string().datetime(),
});

export type CritiqueAnnotation = z.infer<typeof CritiqueAnnotationSchema>;
export type CritiqueResult = z.infer<typeof CritiqueResultSchema>;
