/**
 * Framework AI — Convex actions that call the LLM to generate
 * structured framework analysis for engagements.
 *
 * Each framework has a specialized prompt that produces JSON output.
 * Supports both platform (managed) and user (BYOK) API keys.
 */
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

declare const process: { env: Record<string, string | undefined> };

// ─── Types ────────────────────────────────────────────────────

interface LLMConfig {
  provider: "anthropic" | "openai";
  apiKey: string;
  model: string;
  baseUrl: string;
}

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

// ─── LLM Config Resolution ───────────────────────────────────

async function resolveAiConfig(
  ctx: { runQuery: (fn: any, args: any) => Promise<any> },
  userId: Id<"users">,
): Promise<LLMConfig> {
  // 1. Try user's own keys (BYOK)
  const userConfigs: Array<{ provider: string; apiKey: string; model?: string; baseUrl?: string }> =
    await ctx.runQuery(internal.userAiConfig.listForUser, { userId });

  if (userConfigs.length > 0) {
    // Prefer anthropic, fall back to openai
    const anthropic = userConfigs.find((c: { provider: string }) => c.provider === "anthropic");
    const config = anthropic ?? userConfigs[0];
    return {
      provider: config.provider as "anthropic" | "openai",
      apiKey: config.apiKey,
      model: config.model ?? (config.provider === "anthropic" ? "claude-sonnet-4-20250514" : "gpt-4o"),
      baseUrl: config.baseUrl ?? (config.provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com/v1"),
    };
  }

  // 2. Try platform managed keys
  const platformConfigs: Array<{ provider: string; apiKey: string; model?: string; baseUrl?: string }> =
    await ctx.runQuery(internal.admin.getPlatformAiConfigs, {});

  if (platformConfigs.length > 0) {
    const anthropic = platformConfigs.find((c: { provider: string }) => c.provider === "anthropic");
    const config = anthropic ?? platformConfigs[0];
    return {
      provider: config.provider as "anthropic" | "openai",
      apiKey: config.apiKey,
      model: config.model ?? (config.provider === "anthropic" ? "claude-sonnet-4-20250514" : "gpt-4o"),
      baseUrl: config.baseUrl ?? (config.provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com/v1"),
    };
  }

  // 3. Fall back to env vars
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return {
      provider: "anthropic",
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      baseUrl: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    };
  }

  throw new Error("No AI provider configured. Please set your API keys in Settings.");
}

// ─── Raw LLM call ─────────────────────────────────────────────

async function callLLM(config: LLMConfig, prompt: string): Promise<string> {
  if (config.provider === "anthropic") {
    const res = await fetch(`${config.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        temperature: 0.3,
        system: "You are a senior strategy consultant. Always respond with valid JSON only — no markdown fences, no explanations, no preamble.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    return data.content
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("");
  } else {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        max_tokens: 4096,
        messages: [
          { role: "system", content: "You are a senior strategy consultant. Always respond with valid JSON only — no markdown fences, no explanations, no preamble." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? "";
  }
}

// ─── Parse JSON from LLM response ────────────────────────────

function parseJsonResponse(text: string): unknown {
  // Strip markdown fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

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
      // Resolve AI config (user keys > platform keys > env vars)
      const aiConfig = await resolveAiConfig(ctx, engagement.userId);

      // Build context
      const engCtx: EngagementContext = {
        company: engagement.company,
        industry: engagement.industry,
        question: engagement.question ?? undefined,
        geographies: engagement.geographies ?? undefined,
        competitors: engagement.competitors ?? undefined,
      };

      // Call LLM
      const rawResponse = await callLLM(aiConfig, promptFn(engCtx));

      // Parse JSON
      const parsed = parseJsonResponse(rawResponse);

      // Save result
      await ctx.runMutation(api.frameworkData.save, {
        engagementId,
        framework,
        data: JSON.stringify(parsed),
        status: "done",
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
    return { success: allSuccess, results };
  },
});
