/**
 * Framework AI — Convex actions that call the LLM to generate
 * structured framework analysis for engagements.
 *
 * Uses shared LLM utilities from llm.ts (#4).
 * Wires gamification (#1) and audit trail (#2).
 */
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { resolveAiConfig, callLLMPrompt, parseJsonResponse, sanitizeForLLM } from "./llm";

// ─── Types ────────────────────────────────────────────────────

interface EngagementContext {
  company: string;
  industry: string;
  question?: string;
  geographies?: string;
  competitors?: string;
}

// ─── Framework Prompts ────────────────────────────────────────

const FRAMEWORK_PROMPTS: Record<string, (ctx: EngagementContext) => string> = {
  swot: (ctx) => `You are a senior McKinsey-style strategy consultant performing a SWOT analysis.

Company: ${ctx.company}
Industry: ${ctx.industry}
${ctx.question ? `Strategic Question: ${ctx.question}` : ""}
${ctx.geographies ? `Geographies: ${ctx.geographies}` : ""}
${ctx.competitors ? `Key Competitors: ${ctx.competitors}` : ""}

Produce a thorough SWOT analysis with 4-6 items per quadrant. Each item should be specific, actionable, and grounded in realistic industry dynamics.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "strengths": ["item1", "item2", ...],
  "weaknesses": ["item1", "item2", ...],
  "opportunities": ["item1", "item2", ...],
  "threats": ["item1", "item2", ...]
}`,

  pestel: (ctx) => `You are a senior McKinsey-style strategy consultant performing a PESTEL analysis.

Company: ${ctx.company}
Industry: ${ctx.industry}
${ctx.question ? `Strategic Question: ${ctx.question}` : ""}
${ctx.geographies ? `Geographies: ${ctx.geographies}` : ""}

Analyze the macro-environment through 6 lenses. Provide 2-4 specific, current factors per category that are most relevant to this company.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "political": ["factor1", "factor2", ...],
  "economic": ["factor1", "factor2", ...],
  "social": ["factor1", "factor2", ...],
  "technological": ["factor1", "factor2", ...],
  "environmental": ["factor1", "factor2", ...],
  "legal": ["factor1", "factor2", ...]
}`,

  porter5: (ctx) => `You are a senior McKinsey-style strategy consultant performing Porter's Five Forces analysis.

Company: ${ctx.company}
Industry: ${ctx.industry}
${ctx.competitors ? `Key Competitors: ${ctx.competitors}` : ""}
${ctx.question ? `Strategic Question: ${ctx.question}` : ""}

Assess each competitive force with an intensity score (1-5) and a concise but specific analysis of the industry dynamics.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "forces": [
    {"name": "Competitive Rivalry", "intensity": 4, "notes": "specific analysis..."},
    {"name": "Threat of New Entrants", "intensity": 3, "notes": "specific analysis..."},
    {"name": "Bargaining Power of Buyers", "intensity": 3, "notes": "specific analysis..."},
    {"name": "Bargaining Power of Suppliers", "intensity": 2, "notes": "specific analysis..."},
    {"name": "Threat of Substitutes", "intensity": 3, "notes": "specific analysis..."}
  ]
}`,

  bcg: (ctx) => `You are a senior McKinsey-style strategy consultant creating a BCG Growth-Share Matrix.

Company: ${ctx.company}
Industry: ${ctx.industry}
${ctx.question ? `Strategic Question: ${ctx.question}` : ""}

Based on your knowledge of this company/industry, identify 4-6 product lines, business units, or market segments and classify them in the BCG matrix. Use realistic estimates.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "products": [
    {"name": "Product Name", "growth": 25, "share": 65, "revenue": 30, "quadrant": "star"},
    {"name": "Product Name", "growth": 5, "share": 55, "revenue": 15, "quadrant": "cash-cow"},
    {"name": "Product Name", "growth": 40, "share": 10, "revenue": 5, "quadrant": "question-mark"},
    {"name": "Product Name", "growth": -5, "share": 15, "revenue": 8, "quadrant": "dog"}
  ]
}
Valid quadrants: "star", "cash-cow", "question-mark", "dog"`,

  ansoff: (ctx) => `You are a senior McKinsey-style strategy consultant creating an Ansoff Growth Matrix.

Company: ${ctx.company}
Industry: ${ctx.industry}
${ctx.question ? `Strategic Question: ${ctx.question}` : ""}
${ctx.geographies ? `Geographies: ${ctx.geographies}` : ""}

For each Ansoff quadrant, propose 2-4 specific, actionable growth strategies.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "cells": [
    {"label": "Market Penetration", "risk": "Low", "strategies": ["strategy1", "strategy2", ...]},
    {"label": "Product Development", "risk": "Medium", "strategies": ["strategy1", "strategy2", ...]},
    {"label": "Market Development", "risk": "Medium", "strategies": ["strategy1", "strategy2", ...]},
    {"label": "Diversification", "risk": "High", "strategies": ["strategy1", "strategy2", ...]}
  ]
}`,

  sipoc: (ctx) => `You are a senior McKinsey-style strategy consultant creating a SIPOC process map.

Company: ${ctx.company}
Industry: ${ctx.industry}
${ctx.question ? `Strategic Question: ${ctx.question}` : ""}

Identify 3-5 critical business processes and map each one across Suppliers, Inputs, Process, Outputs, Customers.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "rows": [
    {"suppliers": "Supplier details", "inputs": "Input details", "process": "Process name & description", "outputs": "Output details", "customers": "Customer details"},
    ...
  ]
}`,

  value_chain: (ctx) => `You are a senior McKinsey-style strategy consultant performing a Porter Value Chain analysis.

Company: ${ctx.company}
Industry: ${ctx.industry}
${ctx.question ? `Strategic Question: ${ctx.question}` : ""}

Map primary and support activities with cost share estimates and differentiation potential.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "primary": [
    {"activity": "Inbound Logistics", "cost": 8, "diff": "Low", "notes": "description"},
    {"activity": "Operations", "cost": 35, "diff": "High", "notes": "description"},
    {"activity": "Outbound Logistics", "cost": 5, "diff": "Medium", "notes": "description"},
    {"activity": "Marketing & Sales", "cost": 30, "diff": "Medium", "notes": "description"},
    {"activity": "Service", "cost": 12, "diff": "High", "notes": "description"}
  ],
  "support": ["Firm Infrastructure", "HR Management", "Technology Development", "Procurement"]
}
The "cost" values should sum to approximately 90 (leaving ~10% margin). "diff" must be "Low", "Medium", or "High".`,

  root_cause: (ctx) => `You are a senior McKinsey-style strategy consultant performing a root cause analysis.

Company: ${ctx.company}
Industry: ${ctx.industry}
${ctx.question ? `Strategic Question / Problem: ${ctx.question}` : ""}

Perform both a 5 Whys analysis and an Ishikawa (fishbone) categorization.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "problem": "Clear problem statement",
  "whys": ["Why 1 - symptom", "Why 2 - deeper cause", "Why 3 - systemic issue", "Why 4 - structural root", "Why 5 - fundamental root cause"],
  "ishikawa": [
    {"name": "Man", "items": ["cause1", "cause2"]},
    {"name": "Machine", "items": ["cause1", "cause2"]},
    {"name": "Method", "items": ["cause1", "cause2"]},
    {"name": "Material", "items": ["cause1", "cause2"]},
    {"name": "Measurement", "items": ["cause1", "cause2"]},
    {"name": "Milieu", "items": ["cause1", "cause2"]}
  ]
}`,
};

// ─── Main Generate Action ─────────────────────────────────────

export const generateFramework = action({
  args: {
    engagementId: v.id("engagements"),
    framework: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, { engagementId, framework }) => {
    // Get user identity
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return { success: false, error: "Not authenticated" };

    // Get engagement details
    const engagement = await ctx.runQuery(api.engagements.get, { id: engagementId });
    if (!engagement) return { success: false, error: "Engagement not found" };

    // Get the prompt generator
    const promptFn = FRAMEWORK_PROMPTS[framework];
    if (!promptFn) return { success: false, error: `Unknown framework: ${framework}` };

    // Mark as generating
    await ctx.runMutation(api.frameworkData.save, {
      engagementId,
      framework,
      data: "{}",
      status: "generating",
    });

    try {
      // Resolve AI config via shared utility (#4)
      const aiConfig = await resolveAiConfig(ctx, engagement.userId);

      // Build context — sanitize user-supplied fields (#6)
      const engCtx: EngagementContext = {
        company: sanitizeForLLM(engagement.company),
        industry: sanitizeForLLM(engagement.industry),
        question: engagement.question ? sanitizeForLLM(engagement.question) : undefined,
        geographies: engagement.geographies ? sanitizeForLLM(engagement.geographies) : undefined,
        competitors: engagement.competitors ? sanitizeForLLM(engagement.competitors) : undefined,
      };

      // Call LLM via shared utility (#4)
      const rawResponse = await callLLMPrompt(aiConfig, promptFn(engCtx));

      // Parse JSON
      const parsed = parseJsonResponse(rawResponse);

      // Save result
      await ctx.runMutation(api.frameworkData.save, {
        engagementId,
        framework,
        data: JSON.stringify(parsed),
        status: "done",
      });

      // ── Gamification (#1): Award XP for generating a framework ──
      await ctx.runMutation(internal.gamification.internalAwardXP, {
        userId: engagement.userId,
        amount: 15,
        reason: `Generated ${framework} analysis`,
      });

      // ── Audit trail (#2) ──
      await ctx.runMutation(internal.audit.logAction, {
        userId: engagement.userId,
        engagementId,
        action: "framework.generated",
        details: JSON.stringify({ framework }),
      });

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(api.frameworkData.save, {
        engagementId,
        framework,
        data: "{}",
        status: "error",
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },
});

/** Generate all 8 frameworks for an engagement. */
export const generateAll = action({
  args: {
    engagementId: v.id("engagements"),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      framework: v.string(),
      success: v.boolean(),
      error: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, { engagementId }) => {
    const frameworks = [
      "swot", "pestel", "porter5", "bcg",
      "ansoff", "sipoc", "value_chain", "root_cause",
    ];

    const results: Array<{ framework: string; success: boolean; error?: string }> = [];

    for (const fw of frameworks) {
      const result = await ctx.runAction(api.frameworkAi.generateFramework, {
        engagementId,
        framework: fw,
      });
      results.push({
        framework: fw,
        success: result.success,
        error: result.error ?? undefined,
      });
    }

    const allSuccess = results.every((r) => r.success);

    // ── Gamification (#1): Award badge if all 8 generated successfully ──
    if (allSuccess) {
      const engagement = await ctx.runQuery(api.engagements.get, { id: engagementId });
      if (engagement) {
        await ctx.runMutation(internal.gamification.internalAwardBadge, {
          userId: engagement.userId,
          badgeId: "framework_master",
        });
      }
    }

    return { success: allSuccess, results };
  },
});
