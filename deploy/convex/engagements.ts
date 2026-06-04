import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
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

/** Get a single engagement by ID. */
export const get = query({
  args: { id: v.id("engagements") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const eng = await ctx.db.get(id);
    if (!eng || eng.userId !== userId) return null;
    return eng;
  },
});

// ─── Mutations ────────────────────────────────────────────────

/** Create a new engagement. Enforces session limits. */
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
      // Reset sessions for new period (rolling 30-day window from now)
      await ctx.db.patch(sub._id, {
        sessionsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      });
      // Re-read with reset counter
      sub.sessionsUsed = 0;
    }

    // If no period set yet, initialize it
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
    await ctx.db.delete(id);
  },
});
