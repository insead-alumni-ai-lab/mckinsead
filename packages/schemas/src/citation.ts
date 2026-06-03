import { z } from "zod";

/**
 * Every external claim must carry a citation.
 * §2: "Grounded, not hallucinated."
 */
export const CitationSchema = z.object({
  source: z.string().describe("Name of the source (e.g., 'World Bank', 'SEC EDGAR')"),
  url: z.string().url().optional().describe("Direct URL to the source material"),
  retrieved_at: z.string().datetime().describe("ISO 8601 timestamp of retrieval"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence in the claim's accuracy, 0-1"),
});

export type Citation = z.infer<typeof CitationSchema>;
