/**
 * User AI Config — per-user API keys, models, and base URLs for BYOK users.
 *
 * Users configure their own provider credentials from the Settings page.
 * Keys are stored server-side in Convex (encrypted at rest by Convex).
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

/**
 * List all AI configs for the current user.
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("userAiConfig"),
      _creationTime: v.number(),
      provider: v.union(v.literal("anthropic"), v.literal("openai")),
      apiKeySet: v.boolean(),
      model: v.optional(v.string()),
      baseUrl: v.optional(v.string()),
    }),
  ),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const configs = await ctx.db
      .query("userAiConfig")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();

    return configs.map(c => ({
      _id: c._id,
      _creationTime: c._creationTime,
      provider: c.provider,
      apiKeySet: !!c.apiKey,
      model: c.model,
      baseUrl: c.baseUrl,
    }));
  },
});

/**
 * Save (upsert) an AI provider config for the current user.
 */
export const save = mutation({
  args: {
    provider: v.union(v.literal("anthropic"), v.literal("openai")),
    apiKey: v.string(),
    model: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find existing config for this provider
    const existing = await ctx.db
      .query("userAiConfig")
      .withIndex("by_userId_provider", q =>
        q.eq("userId", userId).eq("provider", args.provider),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        apiKey: args.apiKey,
        model: args.model || undefined,
        baseUrl: args.baseUrl || undefined,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("userAiConfig", {
        userId,
        provider: args.provider,
        apiKey: args.apiKey,
        model: args.model || undefined,
        baseUrl: args.baseUrl || undefined,
      });
    }
  },
});

/**
 * Remove an AI provider config for the current user.
 */
export const remove = mutation({
  args: {
    provider: v.union(v.literal("anthropic"), v.literal("openai")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userAiConfig")
      .withIndex("by_userId_provider", q =>
        q.eq("userId", userId).eq("provider", args.provider),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Internal query: get a user's AI config for a specific provider.
 * Used by AI actions to fetch BYOK keys.
 */
export const getForUser = internalQuery({
  args: {
    userId: v.id("users"),
    provider: v.union(v.literal("anthropic"), v.literal("openai")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userAiConfig")
      .withIndex("by_userId_provider", q =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .unique();
  },
});

/**
 * Internal query: get all AI configs for a user.
 * Used by AI actions to determine which provider to use.
 */
export const listForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userAiConfig")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .collect();
  },
});
