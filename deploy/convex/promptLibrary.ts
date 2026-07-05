/**
 * Prompt Library — save, manage, and reuse custom prompts.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_PROMPTS = [
  {
    title: "SWOT Deep Dive",
    prompt:
      "Analyze the SWOT for this engagement in detail, providing at least 5 items per quadrant with supporting evidence.",
    category: "framework",
  },
  {
    title: "Competitive Moat Analysis",
    prompt:
      "What are the key competitive advantages for this company? Evaluate the strength and durability of each moat.",
    category: "analysis",
  },
  {
    title: "Risk Assessment Matrix",
    prompt:
      "Identify the top 10 risks for this strategic initiative. Rate each by likelihood (1-5) and impact (1-5).",
    category: "analysis",
  },
  {
    title: "McKinsey 7S Alignment",
    prompt:
      "Evaluate this organization through the McKinsey 7S framework: Strategy, Structure, Systems, Shared Values, Style, Staff, Skills.",
    category: "framework",
  },
  {
    title: "Blue Ocean Strategy",
    prompt:
      "Apply the Blue Ocean Strategy framework. What factors can be eliminated, reduced, raised, or created?",
    category: "framework",
  },
  {
    title: "Executive Summary Draft",
    prompt:
      "Draft a concise executive summary of the findings so far, structured with: Context, Key Findings, Recommendations, Next Steps.",
    category: "general",
  },
  {
    title: "Devil's Advocate",
    prompt:
      "Challenge every assumption and hypothesis in this engagement. What could go wrong? What are we missing?",
    category: "analysis",
  },
  {
    title: "Stakeholder Impact Map",
    prompt:
      "Map out all key stakeholders affected by this strategy. For each: their interests, level of influence, and recommended engagement approach.",
    category: "general",
  },
];

/** Get all prompts for the current user (including defaults). */
export const list = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const userPrompts = await ctx.db
      .query("promptLibrary")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();

    // If user has no prompts, they haven't been initialized — return defaults
    if (userPrompts.length === 0) {
      return DEFAULT_PROMPTS.map((p, i) => ({
        _id: `default-${i}`,
        ...p,
        isDefault: true,
        userId,
      }));
    }

    return userPrompts;
  },
});

/** Initialize default prompts for a user. */
export const initDefaults = mutation({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("promptLibrary")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
    if (existing.length > 0) return; // Already initialized

    for (const p of DEFAULT_PROMPTS) {
      await ctx.db.insert("promptLibrary", {
        userId,
        title: p.title,
        prompt: p.prompt,
        category: p.category,
        isDefault: true,
      });
    }
  },
});

/** Create a custom prompt. */
export const create = mutation({
  args: {
    title: v.string(),
    prompt: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("promptLibrary", {
      userId,
      title: args.title,
      prompt: args.prompt,
      category: args.category,
    });
  },
});

/** Update a prompt. */
export const update = mutation({
  args: {
    id: v.id("promptLibrary"),
    title: v.string(),
    prompt: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.id, {
      title: args.title,
      prompt: args.prompt,
      category: args.category,
    });
  },
});

/** Remove a prompt. */
export const remove = mutation({
  args: { id: v.id("promptLibrary") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});
