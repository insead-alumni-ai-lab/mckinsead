/**
 * Admin functions — platform management for whitelisted admin users.
 *
 * Manages: platform AI config, user listing, dashboard stats.
 */
import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Admin whitelist ──────────────────────────────────────────────────
const ADMIN_EMAILS = [
  "zwajapp@gmail.com",
  "mcguy2008@gmail.com",
  "yawo.kpotufe@gmail.com",
  "lupourvous.paris@gmail.com",
  "y.kpotufe@geronimoo.io",
];

async function requireAdmin(ctx: { db: any; auth: any }) {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    throw new Error("Admin access required");
  }
  return { userId, user };
}

// ─── Platform AI Config ───────────────────────────────────────────────

/**
 * Get the managed (platform-wide) AI configuration.
 * Stored in a special `platformConfig` table.
 */
export const getPlatformAiConfig = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const configs = await ctx.db.query("platformAiConfig").collect();
    const result: Record<string, { apiKey: boolean; model: string; baseUrl: string }> = {};
    for (const c of configs) {
      result[c.provider] = {
        apiKey: !!c.apiKey,
        model: c.model || "",
        baseUrl: c.baseUrl || "",
      };
    }
    return result;
  },
});

/**
 * Save a managed AI provider config.
 */
export const savePlatformAiConfig = mutation({
  args: {
    provider: v.union(v.literal("anthropic"), v.literal("openai")),
    apiKey: v.string(),
    model: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("platformAiConfig")
      .withIndex("by_provider", (q: any) => q.eq("provider", args.provider))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apiKey: args.apiKey,
        model: args.model || undefined,
        baseUrl: args.baseUrl || undefined,
      });
    } else {
      await ctx.db.insert("platformAiConfig", {
        provider: args.provider,
        apiKey: args.apiKey,
        model: args.model || undefined,
        baseUrl: args.baseUrl || undefined,
      });
    }
  },
});

/**
 * Remove a managed AI provider config.
 */
export const removePlatformAiConfig = mutation({
  args: {
    provider: v.union(v.literal("anthropic"), v.literal("openai")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("platformAiConfig")
      .withIndex("by_provider", (q: any) => q.eq("provider", args.provider))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ─── User Management ──────────────────────────────────────────────────

/**
 * List all users with their subscription info.
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();

    const result = [];
    for (const u of users) {
      // Get subscription
      const sub = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q: any) => q.eq("userId", u._id))
        .unique();

      // Get profile
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q: any) => q.eq("userId", u._id))
        .unique();

      result.push({
        _id: u._id,
        _creationTime: u._creationTime,
        name: u.name || null,
        email: u.email || null,
        isAdmin: ADMIN_EMAILS.includes((u.email || "").toLowerCase()),
        plan: sub?.plan || null,
        mode: sub?.mode || null,
        status: sub?.status || null,
        sessionsUsed: sub?.sessionsUsed ?? 0,
        sessionsLimit: sub?.sessionsLimit ?? 0,
        onboardingComplete: profile?.onboardingComplete ?? false,
      });
    }

    // Sort: admins first, then by creation time desc
    result.sort((a, b) => {
      if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
      return b._creationTime - a._creationTime;
    });

    return result;
  },
});

// ─── Dashboard Stats ──────────────────────────────────────────────────

/**
 * Get platform-wide stats for the admin dashboard.
 */
export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const subscriptions = await ctx.db.query("subscriptions").collect();
    const engagements = await ctx.db.query("engagements").collect();

    const totalUsers = users.length;
    const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length;
    const totalEngagements = engagements.length;
    const totalSessionsUsed = subscriptions.reduce((sum, s) => sum + (s.sessionsUsed || 0), 0);

    // Plan breakdown
    const planBreakdown = { free: 0, starter: 0, premium: 0, none: 0 };
    const subByUser = new Map(subscriptions.map((s) => [s.userId.toString(), s]));
    for (const u of users) {
      const sub = subByUser.get(u._id.toString());
      if (sub) {
        planBreakdown[sub.plan as keyof typeof planBreakdown]++;
      } else {
        planBreakdown.none++;
      }
    }

    // Mode breakdown
    const modeBreakdown = { byok: 0, cloud: 0 };
    for (const s of subscriptions) {
      if (s.mode === "byok") modeBreakdown.byok++;
      else if (s.mode === "cloud") modeBreakdown.cloud++;
    }

    // Recent signups (last 7 days)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSignups = users.filter((u) => u._creationTime > oneWeekAgo).length;

    return {
      totalUsers,
      activeSubscriptions,
      totalEngagements,
      totalSessionsUsed,
      recentSignups,
      planBreakdown,
      modeBreakdown,
    };
  },
});

/**
 * Internal query: get all platform AI configs (for framework AI to use).
 * No auth check — only callable from other Convex functions.
 */
export const getPlatformAiConfigs = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("platformAiConfig").collect();
  },
});

/**
 * Check if the current user is an admin.
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    if (!user?.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  },
});
