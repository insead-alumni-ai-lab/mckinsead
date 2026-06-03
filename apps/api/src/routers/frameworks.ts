import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import { prisma } from "../lib/prisma";
import { SwotSchema, PestelSchema } from "@mckinsead/schemas";

/**
 * Framework routers — M0 includes SWOT and PESTEL.
 * Each framework writes to engagement.data.frameworks.<name>
 */
export const frameworksRouter = router({
  /** Save SWOT analysis results */
  saveSwot: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        swot: SwotSchema,
      })
    )
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      const frameworks = (data.frameworks ?? {}) as Record<string, unknown>;
      frameworks.swot = input.swot;
      data.frameworks = frameworks;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { data, version: engagement.version + 1 },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "framework_swot",
          action: "swot_saved",
          diff: JSON.stringify({
            strengths: input.swot.strengths.length,
            weaknesses: input.swot.weaknesses.length,
            opportunities: input.swot.opportunities.length,
            threats: input.swot.threats.length,
          }),
        },
      });

      return { success: true };
    }),

  /** Get SWOT for an engagement */
  getSwot: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });
      const data = engagement.data as Record<string, unknown>;
      const frameworks = (data.frameworks ?? {}) as Record<string, unknown>;
      return frameworks.swot ?? null;
    }),

  /** Save PESTEL analysis results */
  savePestel: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        pestel: PestelSchema,
      })
    )
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      const frameworks = (data.frameworks ?? {}) as Record<string, unknown>;
      frameworks.pestel = input.pestel;
      data.frameworks = frameworks;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: { data, version: engagement.version + 1 },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "framework_pestel",
          action: "pestel_saved",
          diff: JSON.stringify({ signal_count: input.pestel.signals.length }),
        },
      });

      return { success: true };
    }),

  /** Get PESTEL for an engagement */
  getPestel: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });
      const data = engagement.data as Record<string, unknown>;
      const frameworks = (data.frameworks ?? {}) as Record<string, unknown>;
      return frameworks.pestel ?? null;
    }),
});
