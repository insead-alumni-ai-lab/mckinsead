import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import { prisma } from "../lib/prisma";
import { HypothesisTreeSchema } from "@mckinsead/schemas";

/**
 * Hypothesis Tree router — M0: manual tree editing.
 * Per §7.9: Governing hypothesis at root, MECE children, falsifiable leaves.
 */
export const hypothesisRouter = router({
  /** Save/update the hypothesis tree */
  save: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        hypothesisTree: HypothesisTreeSchema,
      })
    )
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      data.hypothesis_tree = input.hypothesisTree;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { data, version: engagement.version + 1 },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "hypothesis",
          action: "hypothesis_tree_saved",
          diff: JSON.stringify({
            governing: input.hypothesisTree.governing,
            child_count: input.hypothesisTree.children.length,
          }),
        },
      });

      return { success: true };
    }),

  /** Get the hypothesis tree */
  get: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });
      const data = engagement.data as Record<string, unknown>;
      return data.hypothesis_tree ?? null;
    }),
});
