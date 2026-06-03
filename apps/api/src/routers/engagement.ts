import { z } from "zod";
import { v4 as uuid } from "uuid";
import { router, publicProcedure } from "../lib/trpc";
import { prisma } from "../lib/prisma";
import {
  EngagementSchema,
  EngagementStage,
  CompanyProfileSchema,
  ProblemStatementSchema,
  GATES,
} from "@mckinsead/schemas";
import {
  canAdvanceTo,
  getNextStage,
  isValidPivotTarget,
} from "../services/engagement-state-machine";

export const engagementRouter = router({
  /** List all engagements */
  list: publicProcedure.query(async () => {
    const engagements = await prisma.engagement.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return engagements.map((e) => ({
      id: e.id,
      stage: e.stage,
      version: e.version,
      data: e.data as Record<string, unknown>,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));
  }),

  /** Get a single engagement by ID */
  get: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.id },
        include: { gates: true, auditEntries: { orderBy: { createdAt: "desc" }, take: 50 } },
      });
      return {
        id: engagement.id,
        stage: engagement.stage,
        version: engagement.version,
        data: engagement.data as Record<string, unknown>,
        gates: engagement.gates,
        auditLog: engagement.auditEntries,
        createdAt: engagement.createdAt.toISOString(),
        updatedAt: engagement.updatedAt.toISOString(),
      };
    }),

  /** Create a new engagement with company profile */
  create: publicProcedure
    .input(
      z.object({
        companyProfile: CompanyProfileSchema,
      })
    )
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const engagementId = uuid();

      const engagementData = {
        engagement_id: engagementId,
        tenant_id: uuid(), // M0: auto-generate
        version: 0,
        stage: "scoping" as const,
        company_profile: input.companyProfile,
        analyses: [],
        audit_log: [],
        created_at: now,
        updated_at: now,
      };

      const engagement = await prisma.engagement.create({
        data: {
          id: engagementId,
          version: 0,
          stage: "scoping",
          data: engagementData,
        },
      });

      // Create all gates
      await prisma.gate.createMany({
        data: GATES.map((g) => ({
          engagementId: engagement.id,
          gateId: g.id,
          name: g.name,
          approved: false,
        })),
      });

      // Audit log entry
      await prisma.auditEntry.create({
        data: {
          engagementId: engagement.id,
          agent: "system",
          action: "engagement_created",
          diff: JSON.stringify({ company: input.companyProfile.name }),
        },
      });

      return { id: engagement.id, stage: engagement.stage };
    }),

  /** Update the problem statement (Scoping stage) */
  setProblemStatement: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        problemStatement: ProblemStatementSchema,
      })
    )
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const data = engagement.data as Record<string, unknown>;
      data.problem_statement = input.problemStatement;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: {
          data,
          version: engagement.version + 1,
        },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "scoping",
          action: "problem_statement_set",
          diff: JSON.stringify(input.problemStatement.scqa),
        },
      });

      return { success: true, version: engagement.version + 1 };
    }),

  /** Approve a gate */
  approveGate: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        gateId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const gate = await prisma.gate.update({
        where: {
          engagementId_gateId: {
            engagementId: input.engagementId,
            gateId: input.gateId,
          },
        },
        data: {
          approved: true,
          approvedAt: new Date(),
        },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "user",
          action: `gate_${input.gateId}_approved`,
        },
      });

      return { success: true, gate };
    }),

  /** Advance to the next stage */
  advanceStage: publicProcedure
    .input(z.object({ engagementId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
        include: { gates: true },
      });

      const currentStage = engagement.stage as EngagementStageType;
      const nextStage = getNextStage(currentStage);
      if (!nextStage) {
        throw new Error(`Cannot advance beyond '${currentStage}'`);
      }

      const approvedGates = engagement.gates
        .filter((g) => g.approved)
        .map((g) => g.gateId);

      const { allowed, missingGates } = canAdvanceTo(nextStage, approvedGates);
      if (!allowed) {
        throw new Error(
          `Cannot advance to '${nextStage}': gates not approved: ${missingGates.join(", ")}`
        );
      }

      const data = engagement.data as Record<string, unknown>;
      data.stage = nextStage;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: {
          stage: nextStage,
          version: engagement.version + 1,
          data,
        },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "orchestrator",
          action: `stage_advanced_to_${nextStage}`,
        },
      });

      return { success: true, stage: nextStage };
    }),

  /** Pivot to an earlier stage */
  pivot: publicProcedure
    .input(
      z.object({
        engagementId: z.string().uuid(),
        targetStage: EngagementStage,
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const engagement = await prisma.engagement.findUniqueOrThrow({
        where: { id: input.engagementId },
      });

      const currentStage = engagement.stage as EngagementStageType;
      if (!isValidPivotTarget(currentStage, input.targetStage)) {
        throw new Error(
          `Cannot pivot from '${currentStage}' to '${input.targetStage}' — must be an earlier stage`
        );
      }

      const data = engagement.data as Record<string, unknown>;
      data.stage = input.targetStage;
      data.version = engagement.version + 1;
      data.updated_at = new Date().toISOString();

      await prisma.engagement.update({
        where: { id: input.engagementId },
        data: {
          stage: input.targetStage,
          version: engagement.version + 1,
          data,
        },
      });

      await prisma.auditEntry.create({
        data: {
          engagementId: input.engagementId,
          agent: "orchestrator",
          action: `pivot_to_${input.targetStage}`,
          diff: input.reason,
        },
      });

      return { success: true, stage: input.targetStage };
    }),
});

type EngagementStageType = z.infer<typeof EngagementStage>;
