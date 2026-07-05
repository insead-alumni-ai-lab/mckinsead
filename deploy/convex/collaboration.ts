/**
 * Team Collaboration & Sharing (#1)
 * Share engagements via invite links, manage access.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** List shared links for an engagement. */
export const listShares = query({
  args: { engagementId: v.id("engagements") },
  handler: async (ctx, { engagementId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("shares")
      .withIndex("by_engagementId", q => q.eq("engagementId", engagementId))
      .collect();
  },
});

/** Create a share link for an engagement. */
export const createShare = mutation({
  args: {
    engagementId: v.id("engagements"),
    role: v.union(
      v.literal("viewer"),
      v.literal("editor"),
      v.literal("commenter"),
    ),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const engagement = await ctx.db.get(args.engagementId);
    if (!engagement || engagement.userId !== userId)
      throw new Error("Not authorized");

    const token = Array.from(
      { length: 32 },
      () =>
        "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
    ).join("");

    return await ctx.db.insert("shares", {
      engagementId: args.engagementId,
      ownerId: userId,
      sharedWithEmail: args.email,
      role: args.role,
      token,
      active: true,
      createdAt: Date.now(),
    });
  },
});

/** Revoke a share. */
export const revokeShare = mutation({
  args: { id: v.id("shares") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const share = await ctx.db.get(id);
    if (!share || share.ownerId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(id, { active: false });
  },
});

/** Get engagements shared with current user. */
export const sharedWithMe = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user) return [];
    const email = (user as Record<string, unknown>).email as string | undefined;
    if (!email) return [];
    const shares = await ctx.db
      .query("shares")
      .withIndex("by_sharedWithEmail", q => q.eq("sharedWithEmail", email))
      .filter(q => q.eq(q.field("active"), true))
      .collect();
    return shares;
  },
});
