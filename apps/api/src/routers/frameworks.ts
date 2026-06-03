import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import { prisma } from "../lib/prisma";
import {
  SwotSchema,
  PestelSchema,
  Porter5Schema,
  BcgSchema,
  AnsoffSchema,
  SipocSchema,
  ValueChainSchema,
  RootCauseSchema,
} from "@mckinsead/schemas";

/**
 * Framework routers — M1 includes all 10 frameworks (§7).
 * Each framework writes to engagement.data.frameworks.<name>
 */

// ─── Generic helpers ────────────────────────────────────────────────────

async function getFrameworkData(engagementId: string, frameworkKey: string) {
  const engagement = await prisma.engagement.findUniqueOrThrow({
    where: { id: engagementId },
  });
  const data = engagement.data as Record<string, unknown>;
  const frameworks = (data.frameworks ?? {}) as Record<string, unknown>;
  return frameworks[frameworkKey] ?? null;
}

async function saveFrameworkData(
  engagementId: string,
  frameworkKey: string,
  frameworkData: unknown,
  agentName: string,
  auditSummary: Record<string, unknown>
) {
  const engagement = await prisma.engagement.findUniqueOrThrow({
    where: { id: engagementId },
  });

  const data = engagement.data as Record<string, unknown>;
  const frameworks = (data.frameworks ?? {}) as Record<string, unknown>;
  frameworks[frameworkKey] = frameworkData;
  data.frameworks = frameworks;
  data.version = engagement.version + 1;
  data.updated_at = new Date().toISOString();

  await prisma.engagement.update({
    where: { id: engagementId },
    data: { data, version: engagement.version + 1 },
  });

  await prisma.auditEntry.create({
    data: {
      engagementId,
      agent: agentName,
      action: `${frameworkKey}_saved`,
      diff: JSON.stringify(auditSummary),
    },
  });

  return { success: true };
}

// ─── Router ─────────────────────────────────────────────────────────────

export const frameworksRouter = router({
  // ─── SWOT (§7.1) ──────────────────────────────────────────────────
  saveSwot: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), swot: SwotSchema }))
    .mutation(async ({ input }) =>
      saveFrameworkData(input.engagementId, "swot", input.swot, "framework_swot", {
        strengths: input.swot.strengths.length,
        weaknesses: input.swot.weaknesses.length,
        opportunities: input.swot.opportunities.length,
        threats: input.swot.threats.length,
      })
    ),

  getSwot: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(({ input }) => getFrameworkData(input.engagementId, "swot")),

  // ─── PESTEL (§7.2) ────────────────────────────────────────────────
  savePestel: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), pestel: PestelSchema }))
    .mutation(async ({ input }) =>
      saveFrameworkData(input.engagementId, "pestel", input.pestel, "framework_pestel", {
        signal_count: input.pestel.signals.length,
      })
    ),

  getPestel: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(({ input }) => getFrameworkData(input.engagementId, "pestel")),

  // ─── Porter's Five Forces (§7.3) ──────────────────────────────────
  savePorter5: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), porter5: Porter5Schema }))
    .mutation(async ({ input }) =>
      saveFrameworkData(input.engagementId, "porter5", input.porter5, "framework_porter5", {
        overall_attractiveness: input.porter5.overall_attractiveness,
        forces: {
          rivalry: input.porter5.rivalry.intensity,
          new_entrants: input.porter5.new_entrants.intensity,
          substitutes: input.porter5.substitutes.intensity,
          supplier_power: input.porter5.supplier_power.intensity,
          buyer_power: input.porter5.buyer_power.intensity,
        },
      })
    ),

  getPorter5: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(({ input }) => getFrameworkData(input.engagementId, "porter5")),

  // ─── BCG Matrix (§7.4) ────────────────────────────────────────────
  saveBcg: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), bcg: BcgSchema }))
    .mutation(async ({ input }) => {
      const quadrantCounts = input.bcg.items.reduce(
        (acc, item) => {
          acc[item.quadrant] = (acc[item.quadrant] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      return saveFrameworkData(input.engagementId, "bcg", input.bcg, "framework_bcg", {
        item_count: input.bcg.items.length,
        quadrants: quadrantCounts,
      });
    }),

  getBcg: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(({ input }) => getFrameworkData(input.engagementId, "bcg")),

  // ─── Ansoff Matrix (§7.5) ─────────────────────────────────────────
  saveAnsoff: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), ansoff: AnsoffSchema }))
    .mutation(async ({ input }) =>
      saveFrameworkData(input.engagementId, "ansoff", input.ansoff, "framework_ansoff", {
        market_penetration_moves: input.ansoff.market_penetration.moves.length,
        market_development_moves: input.ansoff.market_development.moves.length,
        product_development_moves: input.ansoff.product_development.moves.length,
        diversification_moves: input.ansoff.diversification.moves.length,
      })
    ),

  getAnsoff: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(({ input }) => getFrameworkData(input.engagementId, "ansoff")),

  // ─── SIPOC (§7.6) ─────────────────────────────────────────────────
  saveSipoc: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), sipoc: SipocSchema }))
    .mutation(async ({ input }) =>
      saveFrameworkData(input.engagementId, "sipoc", input.sipoc, "framework_sipoc", {
        process_count: input.sipoc.rows.length,
      })
    ),

  getSipoc: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(({ input }) => getFrameworkData(input.engagementId, "sipoc")),

  // ─── Value Chain (§7.7) ───────────────────────────────────────────
  saveValueChain: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), value_chain: ValueChainSchema }))
    .mutation(async ({ input }) =>
      saveFrameworkData(input.engagementId, "value_chain", input.value_chain, "framework_value_chain", {
        primary_activities: Object.keys(input.value_chain.primary).length,
        support_activities: Object.keys(input.value_chain.support).length,
      })
    ),

  getValueChain: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(({ input }) => getFrameworkData(input.engagementId, "value_chain")),

  // ─── Root Cause (§7.8) ────────────────────────────────────────────
  saveRootCause: publicProcedure
    .input(z.object({ engagementId: z.string().uuid(), root_cause: RootCauseSchema }))
    .mutation(async ({ input }) =>
      saveFrameworkData(input.engagementId, "root_cause", input.root_cause, "framework_root_cause", {
        five_why_chains: input.root_cause.five_whys.length,
        ishikawa_categories: input.root_cause.ishikawa.length,
        total_causes: input.root_cause.ishikawa.reduce((sum, cat) => sum + cat.causes.length, 0),
      })
    ),

  getRootCause: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(({ input }) => getFrameworkData(input.engagementId, "root_cause")),

  // ─── List all frameworks for engagement ────────────────────────────
  listAll: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });
      const data = engagement.data as Record<string, unknown>;
      const frameworks = (data.frameworks ?? {}) as Record<string, unknown>;

      return {
        available: Object.keys(frameworks).filter((k) => frameworks[k] != null),
        swot: frameworks.swot != null,
        pestel: frameworks.pestel != null,
        porter5: frameworks.porter5 != null,
        bcg: frameworks.bcg != null,
        ansoff: frameworks.ansoff != null,
        sipoc: frameworks.sipoc != null,
        value_chain: frameworks.value_chain != null,
        root_cause: frameworks.root_cause != null,
      };
    }),
});
