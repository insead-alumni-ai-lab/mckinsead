/**
 * Gamification & Learning Mode (#16)
 * XP tracking, badges, and skill progression.
 */
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const BADGES = [
  { id: "first_engagement", name: "First Steps", description: "Create your first engagement", icon: "🎯", xpRequired: 0 },
  { id: "framework_master", name: "Framework Master", description: "Generate all 8 frameworks in one engagement", icon: "🏆", xpRequired: 100 },
  { id: "hypothesis_builder", name: "Hypothesis Builder", description: "Create 5+ hypotheses in a single tree", icon: "🌳", xpRequired: 200 },
  { id: "speed_analyst", name: "Speed Analyst", description: "Complete scoping in under 5 minutes", icon: "⚡", xpRequired: 150 },
  { id: "mece_perfectionist", name: "MECE Perfectionist", description: "Achieve 100% MECE coverage", icon: "✨", xpRequired: 300 },
  { id: "deep_diver", name: "Deep Diver", description: "Use AI chat 20+ times in one engagement", icon: "🤿", xpRequired: 250 },
  { id: "multi_engagement", name: "Portfolio Strategist", description: "Create 5+ engagements", icon: "📊", xpRequired: 500 },
  { id: "version_tracker", name: "Version Tracker", description: "Save 3+ version snapshots", icon: "📸", xpRequired: 180 },
];

/** Get user's gamification profile. */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      return {
        xp: 0,
        level: 1,
        badges: [] as string[],
        streak: 0,
        allBadges: BADGES,
      };
    }

    const earnedBadges: string[] = profile.badges ? JSON.parse(profile.badges) : [];
    return {
      xp: profile.xp,
      level: Math.floor(profile.xp / 100) + 1,
      badges: earnedBadges,
      streak: profile.streak,
      allBadges: BADGES,
    };
  },
});

/** Award XP to the current user. */
export const awardXP = mutation({
  args: { amount: v.number(), reason: v.string() },
  handler: async (ctx, { amount, reason }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        xp: existing.xp + amount,
        lastAction: reason,
        lastActionAt: Date.now(),
      });
    } else {
      await ctx.db.insert("gamification", {
        userId,
        xp: amount,
        badges: "[]",
        streak: 1,
        lastAction: reason,
        lastActionAt: Date.now(),
      });
    }
  },
});

/** Award a badge to the current user. */
export const awardBadge = mutation({
  args: { badgeId: v.string() },
  handler: async (ctx, { badgeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      const badges: string[] = existing.badges ? JSON.parse(existing.badges) : [];
      if (!badges.includes(badgeId)) {
        badges.push(badgeId);
        await ctx.db.patch(existing._id, { badges: JSON.stringify(badges) });
      }
    } else {
      await ctx.db.insert("gamification", {
        userId,
        xp: 0,
        badges: JSON.stringify([badgeId]),
        streak: 1,
        lastAction: `Earned badge: ${badgeId}`,
        lastActionAt: Date.now(),
      });
    }
  },
});

// ─── Internal mutations (called from other backend functions) ─────────

/** Award XP (internal — called from engagements, frameworkAi, etc.). */
export const internalAwardXP = internalMutation({
  args: { userId: v.id("users"), amount: v.number(), reason: v.string() },
  handler: async (ctx, { userId, amount, reason }) => {
    const existing = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        xp: existing.xp + amount,
        lastAction: reason,
        lastActionAt: Date.now(),
      });
    } else {
      await ctx.db.insert("gamification", {
        userId,
        xp: amount,
        badges: "[]",
        streak: 1,
        lastAction: reason,
        lastActionAt: Date.now(),
      });
    }
  },
});

/** Award a badge (internal — called from other backend functions). */
export const internalAwardBadge = internalMutation({
  args: { userId: v.id("users"), badgeId: v.string() },
  handler: async (ctx, { userId, badgeId }) => {
    const existing = await ctx.db
      .query("gamification")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      const badges: string[] = existing.badges ? JSON.parse(existing.badges) : [];
      if (!badges.includes(badgeId)) {
        badges.push(badgeId);
        await ctx.db.patch(existing._id, { badges: JSON.stringify(badges) });
      }
    } else {
      await ctx.db.insert("gamification", {
        userId,
        xp: 0,
        badges: JSON.stringify([badgeId]),
        streak: 1,
        lastAction: `Earned badge: ${badgeId}`,
        lastActionAt: Date.now(),
      });
    }
  },
});
