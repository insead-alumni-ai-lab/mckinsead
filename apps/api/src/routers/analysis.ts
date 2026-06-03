import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import { prisma } from "../lib/prisma";
import { AnalysisSchema, AnalysisMethod } from "@mckinsead/schemas";

/**
 * Analysis router — §7.10 Hypothesis Testing.
 *
 * The AnalysisAgent picks a method per leaf hypothesis:
 * - Descriptive (segmentation, cohort)
 * - Comparative (benchmark, t-test, A/B)
 * - Causal (regression, diff-in-diff)
 * - Forecasting (scenario, Monte Carlo)
 * - Qualitative (expert interview synthesis)
 */
export const analysisRouter = router({
  /** Save an analysis result for a hypothesis leaf */
  save: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        analysis: AnalysisSchema,
      })
    )
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      const analyses = (data.analyses ?? []) as Array<Record<string, unknown>>;

      // Upsert: replace if same id exists
      const idx = analyses.findIndex((a) => a.id === input.analysis.id);
      if (idx >= 0) {
        analyses[idx] = input.analysis;
      } else {
        analyses.push(input.analysis);
      }

      data.analyses = analyses;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { data, version: engagement.version + 1 },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "analysis",
          action: "analysis_saved",
          diff: JSON.stringify({
            analysis_id: input.analysis.id,
            hypothesis_id: input.analysis.hypothesis_id,
            method: input.analysis.method,
            confidence: input.analysis.confidence,
          }),
        },
      });

      return { success: true };
    }),

  /** Get all analyses for an engagement */
  list: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });
      const data = engagement.data as Record<string, unknown>;
      return (data.analyses ?? []) as Array<Record<string, unknown>>;
    }),

  /** Get analysis by id */
  get: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), analysisId: z.string() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });
      const data = engagement.data as Record<string, unknown>;
      const analyses = (data.analyses ?? []) as Array<Record<string, unknown>>;
      return analyses.find((a) => a.id === input.analysisId) ?? null;
    }),

  /** Get analyses for a specific hypothesis */
  byHypothesis: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), hypothesisId: z.string() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });
      const data = engagement.data as Record<string, unknown>;
      const analyses = (data.analyses ?? []) as Array<Record<string, unknown>>;
      return analyses.filter((a) => a.hypothesis_id === input.hypothesisId);
    }),

  /** Delete an analysis */
  delete: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), analysisId: z.string() }))
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      const analyses = (data.analyses ?? []) as Array<Record<string, unknown>>;
      data.analyses = analyses.filter((a) => a.id !== input.analysisId);
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { data, version: engagement.version + 1 },
      });

      return { success: true };
    }),

  /** Get analysis coverage — which hypotheses are tested */
  coverage: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });
      const data = engagement.data as Record<string, unknown>;
      const analyses = (data.analyses ?? []) as Array<Record<string, unknown>>;

      const byHypothesis = new Map<string, number>();
      const byMethod = new Map<string, number>();
      for (const a of analyses) {
        const hid = a.hypothesis_id as string;
        byHypothesis.set(hid, (byHypothesis.get(hid) ?? 0) + 1);
        const method = a.method as string;
        byMethod.set(method, (byMethod.get(method) ?? 0) + 1);
      }

      return {
        total_analyses: analyses.length,
        hypotheses_tested: byHypothesis.size,
        by_hypothesis: Object.fromEntries(byHypothesis),
        by_method: Object.fromEntries(byMethod),
      };
    }),
});
