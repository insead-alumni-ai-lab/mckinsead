/**
 * User Preferences — persisted settings (#7).
 * Replaces localStorage for white-label, localization, webhook, and notification preferences.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Get all preferences for the current user. */
export const getAll = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return {};
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
    const result: Record<string, string> = {};
    for (const p of prefs) {
      result[p.key] = p.value;
    }
    return result;
  },
});

/** Get a single preference value. */
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const pref = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId_key", q => q.eq("userId", userId).eq("key", key))
      .first();
    return pref?.value ?? null;
  },
});

/** Set a preference (upsert). */
export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId_key", q => q.eq("userId", userId).eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("userPreferences", { userId, key, value });
    }
  },
});

/** Set multiple preferences at once. */
export const setMany = mutation({
  args: { prefs: v.array(v.object({ key: v.string(), value: v.string() })) },
  handler: async (ctx, { prefs }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    for (const { key, value } of prefs) {
      const existing = await ctx.db
        .query("userPreferences")
        .withIndex("by_userId_key", q => q.eq("userId", userId).eq("key", key))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { value });
      } else {
        await ctx.db.insert("userPreferences", { userId, key, value });
      }
    }
  },
});

/** Delete a preference. */
export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId_key", q => q.eq("userId", userId).eq("key", key))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
