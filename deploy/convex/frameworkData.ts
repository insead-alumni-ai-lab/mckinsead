/**
 * Framework Data — CRUD operations for AI-generated framework outputs.
 *
 * Each engagement can have data for up to 8 frameworks (SWOT, PESTEL, etc.)
 * stored as JSON strings in the frameworkData table.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Queries ──────────────────────────────────────────────────

/** Get all framework data for an engagement. */
export const listByEngagement = query({
  args: { engagementId: v.id("engagements") },
  handler: async (ctx, { engagementId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    // Verify ownership
    const eng = await ctx.db.get(engagementId);
    if (!eng || eng.userId !== userId) return [];

    return await ctx.db
      .query("frameworkData")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", engagementId))
      .collect();
  },
});

/** Get framework data for a specific framework in an engagement. */
export const getByFramework = query({
  args: {
    engagementId: v.id("engagements"),
    framework: v.string(),
  },
  handler: async (ctx, { engagementId, framework }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const eng = await ctx.db.get(engagementId);
    if (!eng || eng.userId !== userId) return null;

    return await ctx.db
      .query("frameworkData")
      .withIndex("by_engagementId_framework", (q) =>
        q.eq("engagementId", engagementId).eq("framework", framework)
      )
      .unique();
  },
});

// ─── Mutations ────────────────────────────────────────────────

/** Save/update framework data (used after AI generation or manual edits). */
export const save = mutation({
  args: {
    engagementId: v.id("engagements"),
    framework: v.string(),
    data: v.string(),
    status: v.union(
      v.literal("empty"),
      v.literal("generating"),
      v.literal("done"),
      v.literal("error"),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(args.engagementId);
    if (!eng || eng.userId !== userId) throw new Error("Not found");

    // Check if entry exists
    const existing = await ctx.db
      .query("frameworkData")
      .withIndex("by_engagementId_framework", (q) =>
        q.eq("engagementId", args.engagementId).eq("framework", args.framework)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        status: args.status,
        error: args.error,
        generatedAt: args.status === "done" ? Date.now() : existing.generatedAt,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("frameworkData", {
        engagementId: args.engagementId,
        framework: args.framework,
        data: args.data,
        status: args.status,
        error: args.error,
        generatedAt: args.status === "done" ? Date.now() : undefined,
      });
    }
  },
});

/** Mark a framework as generating (set status). */
export const setStatus = mutation({
  args: {
    engagementId: v.id("engagements"),
    framework: v.string(),
    status: v.union(
      v.literal("empty"),
      v.literal("generating"),
      v.literal("done"),
      v.literal("error"),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("frameworkData")
      .withIndex("by_engagementId_framework", (q) =>
        q.eq("engagementId", args.engagementId).eq("framework", args.framework)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        error: args.error,
      });
    } else {
      await ctx.db.insert("frameworkData", {
        engagementId: args.engagementId,
        framework: args.framework,
        data: "{}",
        status: args.status,
        error: args.error,
      });
    }
  },
});

/** Initialize all 8 frameworks for a new engagement. */
export const initializeAll = mutation({
  args: { engagementId: v.id("engagements") },
  handler: async (ctx, { engagementId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(engagementId);
    if (!eng || eng.userId !== userId) throw new Error("Not found");

    const frameworks = [
      "swot", "pestel", "porter5", "bcg",
      "ansoff", "sipoc", "value_chain", "root_cause",
    ];

    for (const fw of frameworks) {
      const existing = await ctx.db
        .query("frameworkData")
        .withIndex("by_engagementId_framework", (q) =>
          q.eq("engagementId", engagementId).eq("framework", fw)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("frameworkData", {
          engagementId,
          framework: fw,
          data: "{}",
          status: "empty",
        });
      }
    }
  },
});
