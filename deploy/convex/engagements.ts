import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────────

/** List all engagements for the current user (newest first). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const engs = await ctx.db
      .query("engagements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return engs;
  },
});

/** Get a single engagement by ID (owner OR shared user). */
export const get = query({
  args: { id: v.id("engagements") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const eng = await ctx.db.get(id);
    if (!eng) return null;

    // Owner check
    if (eng.userId === userId) return eng;

    // Collaboration check (#3): look up shares for this engagement + user email
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const email = (user as Record<string, unknown>).email as string | undefined;
    if (email) {
      const share = await ctx.db
        .query("shares")
        .withIndex("by_engagementId", (q) => q.eq("engagementId", id))
        .filter((q) =>
          q.and(
            q.eq(q.field("sharedWithEmail"), email),
            q.eq(q.field("active"), true),
          ),
        )
        .first();
      if (share) return eng;
    }

    return null;
  },
});

// ─── Mutations ────────────────────────────────────────────────

/** Create a new engagement. Enforces session limits. Wires gamification & audit. */
export const create = mutation({
  args: {
    company: v.string(),
    industry: v.string(),
    question: v.optional(v.string()),
    geographies: v.optional(v.string()),
    competitors: v.optional(v.string()),
    template: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // ── Check subscription & session limit ──
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!sub) {
      return { success: false, reason: "No subscription. Please complete onboarding." };
    }
    if (sub.status !== "active") {
      return { success: false, reason: "Subscription not active." };
    }

    // Monthly reset check: if currentPeriodEnd has passed, reset counter
    const now = Date.now();
    if (sub.currentPeriodEnd && now > sub.currentPeriodEnd) {
      await ctx.db.patch(sub._id, {
        sessionsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      });
      sub.sessionsUsed = 0;
    }

    if (!sub.currentPeriodStart) {
      await ctx.db.patch(sub._id, {
        currentPeriodStart: now,
        currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      });
    }

    if (sub.sessionsUsed >= sub.sessionsLimit) {
      const plan = sub.plan;
      const limit = sub.sessionsLimit;
      return {
        success: false,
        reason: `You've used all ${limit} session${limit === 1 ? "" : "s"} for this month on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan. Upgrade to get more sessions.`,
        limitReached: true,
        currentPlan: plan,
        sessionsUsed: sub.sessionsUsed,
        sessionsLimit: limit,
      };
    }

    // ── Create the engagement ──
    const engId = await ctx.db.insert("engagements", {
      userId,
      company: args.company,
      industry: args.industry,
      question: args.question,
      geographies: args.geographies,
      competitors: args.competitors,
      stage: "scoping",
      progress: 0,
      template: args.template,
    });

    // ── Increment session counter ──
    await ctx.db.patch(sub._id, { sessionsUsed: sub.sessionsUsed + 1 });

    // ── Gamification (#1): Award XP and badge ──
    await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
      userId,
      amount: 10,
      reason: "Created engagement",
    });
    await ctx.scheduler.runAfter(0, internal.gamification.internalAwardBadge, {
      userId,
      badgeId: "first_engagement",
    });

    // Check for multi_engagement badge
    const allEngs = await ctx.db
      .query("engagements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    if (allEngs.length >= 5) {
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardBadge, {
        userId,
        badgeId: "multi_engagement",
      });
    }

    // ── Audit trail (#2) ──
    await ctx.scheduler.runAfter(0, internal.audit.logAction, {
      userId,
      engagementId: engId,
      action: "engagement.created",
      details: JSON.stringify({ company: args.company, industry: args.industry }),
    });

    return {
      success: true,
      engagementId: engId,
      remaining: sub.sessionsLimit - sub.sessionsUsed - 1,
    };
  },
});

/** Update engagement stage / progress. */
export const updateStage = mutation({
  args: {
    id: v.id("engagements"),
    stage: v.optional(v.string()),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, { id, stage, progress }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(id);
    if (!eng || eng.userId !== userId) throw new Error("Not found");
    const patch: Record<string, unknown> = {};
    if (stage !== undefined) patch.stage = stage;
    if (progress !== undefined) patch.progress = progress;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }

    // ── Audit trail (#2) ──
    if (stage !== undefined) {
      await ctx.scheduler.runAfter(0, internal.audit.logAction, {
        userId,
        engagementId: id,
        action: "engagement.stageChanged",
        details: JSON.stringify({ stage, progress }),
      });
    }
  },
});

/** Save stage-specific data (SCQA, hypothesis tree, synthesis, etc.). */
export const saveStageData = mutation({
  args: {
    id: v.id("engagements"),
    scopingData: v.optional(v.string()),
    hypothesisData: v.optional(v.string()),
    synthesisData: v.optional(v.string()),
    communicationData: v.optional(v.string()),
    gatesApproved: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...data }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(id);
    if (!eng || eng.userId !== userId) throw new Error("Not found");

    const patch: Record<string, string> = {};
    if (data.scopingData !== undefined) patch.scopingData = data.scopingData;
    if (data.hypothesisData !== undefined) patch.hypothesisData = data.hypothesisData;
    if (data.synthesisData !== undefined) patch.synthesisData = data.synthesisData;
    if (data.communicationData !== undefined) patch.communicationData = data.communicationData;
    if (data.gatesApproved !== undefined) patch.gatesApproved = data.gatesApproved;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }
  },
});

/** Clone an engagement (deep copy with all stage data). */
export const clone = mutation({
  args: { id: v.id("engagements") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(id);
    if (!eng || eng.userId !== userId) throw new Error("Not found");

    // Check session limit
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!sub || sub.status !== "active") throw new Error("No active subscription");
    if (sub.sessionsUsed >= sub.sessionsLimit) {
      return { success: false, reason: "Session limit reached. Upgrade to clone more engagements." };
    }

    // Create the clone
    const cloneId = await ctx.db.insert("engagements", {
      userId,
      company: `${eng.company} (copy)`,
      industry: eng.industry,
      question: eng.question,
      geographies: eng.geographies,
      competitors: eng.competitors,
      stage: eng.stage,
      progress: eng.progress,
      template: eng.template,
      scopingData: eng.scopingData,
      hypothesisData: eng.hypothesisData,
      synthesisData: eng.synthesisData,
      communicationData: eng.communicationData,
      gatesApproved: eng.gatesApproved,
    });

    // Clone framework data
    const frameworks = await ctx.db
      .query("frameworkData")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", id))
      .collect();
    for (const fw of frameworks) {
      await ctx.db.insert("frameworkData", {
        engagementId: cloneId,
        framework: fw.framework,
        data: fw.data,
        status: fw.status,
        error: fw.error,
        generatedAt: fw.generatedAt,
      });
    }

    // Increment session counter
    await ctx.db.patch(sub._id, { sessionsUsed: sub.sessionsUsed + 1 });

    // ── Gamification (#1) ──
    await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
      userId,
      amount: 5,
      reason: "Cloned engagement",
    });

    // ── Audit trail (#2) ──
    await ctx.scheduler.runAfter(0, internal.audit.logAction, {
      userId,
      engagementId: cloneId,
      action: "engagement.cloned",
      details: JSON.stringify({ sourceId: id, company: eng.company }),
    });

    return { success: true, engagementId: cloneId };
  },
});

/** Toggle archived status on an engagement. */
export const toggleArchive = mutation({
  args: { id: v.id("engagements") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(id);
    if (!eng || eng.userId !== userId) throw new Error("Not found");
    const newArchived = !eng.archived;
    await ctx.db.patch(id, { archived: newArchived });
    return { archived: newArchived };
  },
});

/** Delete an engagement. */
export const remove = mutation({
  args: { id: v.id("engagements") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(id);
    if (!eng || eng.userId !== userId) throw new Error("Not found");

    // ── Audit trail (#2) ──
    await ctx.scheduler.runAfter(0, internal.audit.logAction, {
      userId,
      action: "engagement.deleted",
      details: JSON.stringify({ company: eng.company, industry: eng.industry }),
    });

    await ctx.db.delete(id);
  },
});
