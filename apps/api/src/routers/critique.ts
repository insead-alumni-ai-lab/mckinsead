import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import { prisma } from "../lib/prisma";
import { CritiqueResultSchema } from "@mckinsead/schemas";

/**
 * Critique router — CritiqueAgent endpoints (§3.1).
 * The CritiqueAgent runs after every other agent as a mandatory linter.
 * Checks: MECE, sourcing, so-what, bias, consistency, completeness, actionability.
 */
export const critiqueRouter = router({
  /** Save a critique result */
  save: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        result: CritiqueResultSchema,
      })
    )
    .mutation(async ({ input }) => {
      await prisma.critique.create({
        data: {
          engagementId: input.engagementId,
          targetAgent: input.result.target_agent,
          targetArtifact: input.result.target_artifact,
          result: input.result as unknown as Record<string, unknown>,
          pass: input.result.pass,
          blockingCount: input.result.blocking_count,
          warningCount: input.result.warning_count,
        },
      });

      // Also store annotations on the engagement data for display
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      const critiques = (data.critique_history ?? []) as Array<unknown>;
      critiques.push(input.result);
      data.critique_history = critiques;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { data, version: engagement.version + 1 },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "critique",
          action: `critique_${input.result.pass ? "passed" : "failed"}`,
          diff: JSON.stringify({
            target: input.result.target_artifact,
            blocking: input.result.blocking_count,
            warnings: input.result.warning_count,
          }),
        },
      });

      return { success: true, pass: input.result.pass };
    }),

  /** List all critiques for an engagement */
  list: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.critique.findMany({
        where: { engagementId: input.engagementId },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** Get latest critique for a specific artifact */
  latest: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        targetArtifact: z.string(),
      })
    )
    .query(async ({ input }) => {
      return prisma.critique.findFirst({
        where: {
          engagementId: input.engagementId,
          targetArtifact: input.targetArtifact,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** Resolve a specific annotation */
  resolveAnnotation: publicProcedure
    .input(
      z.object({
        critiqueId: z.string().uuid(),
        annotationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const critique = await prisma.critique.findUniqueOrThrow({
        where: { id: input.critiqueId },
      });

      const result = critique.result as Record<string, unknown>;
      const annotations = result.annotations as Array<Record<string, unknown>>;
      const annotation = annotations.find((a) => a.id === input.annotationId);
      if (annotation) {
        annotation.resolved = true;
        annotation.resolved_at = new Date().toISOString();
      }

      // Recalculate blocking count
      const blockingCount = annotations.filter(
        (a) => a.severity === "blocking" && !a.resolved
      ).length;
      const pass = blockingCount === 0;

      await prisma.critique.update({
        where: { id: input.critiqueId },
        data: { result, pass, blockingCount },
      });

      return { success: true, pass };
    }),
});
