import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

// ─── Plan limits ──────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: { sessionsLimit: 3, price: 0 },
  starter: { sessionsLimit: 10, price: 200000 }, // €2,000 in cents
  premium: { sessionsLimit: 999, price: 1000000 }, // €10,000 in cents
} as const;

// ─── Queries ──────────────────────────────────────────────────

/** Get the current user's subscription (or null if none yet). */
export const current = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();
    return sub;
  },
});

/** Get the current user's profile (onboarding state). */
export const profile = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();
    return profile;
  },
});

/** Get publishable key for client-side Stripe.js (if we ever need it). */
export const stripePublishableKey = query({
  args: {},
  handler: async () => {
    return process.env.STRIPE_PUBLISHABLE_KEY ?? null;
  },
});

// ─── Mutations ────────────────────────────────────────────────

/** Complete onboarding by choosing BYOK (free tier). */
export const chooseBYOK = mutation({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Create or update profile
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        onboardingComplete: true,
        aiMode: "byok",
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        onboardingComplete: true,
        aiMode: "byok",
      });
    }

    // Create free subscription
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();

    if (existingSub) {
      await ctx.db.patch(existingSub._id, {
        plan: "free",
        mode: "byok",
        status: "active",
        sessionsLimit: PLAN_LIMITS.free.sessionsLimit,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId,
        plan: "free",
        mode: "byok",
        status: "active",
        sessionsUsed: 0,
        sessionsLimit: PLAN_LIMITS.free.sessionsLimit,
      });
    }

    return { success: true };
  },
});

/** Increment session usage. Returns false if limit reached. */
export const useSession = mutation({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();

    if (!sub) return { allowed: false, reason: "No subscription" };
    if (sub.status !== "active")
      return { allowed: false, reason: "Subscription not active" };
    if (sub.sessionsUsed >= sub.sessionsLimit) {
      return { allowed: false, reason: "Session limit reached" };
    }

    await ctx.db.patch(sub._id, { sessionsUsed: sub.sessionsUsed + 1 });
    return {
      allowed: true,
      remaining: sub.sessionsLimit - sub.sessionsUsed - 1,
    };
  },
});
