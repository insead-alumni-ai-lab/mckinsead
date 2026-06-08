/**
 * Chat — backend for the conversational engagement sidebar.
 *
 * The AI acts as a McKinsey-style strategy consultant guiding the user
 * through each engagement stage (Scope → Diagnose → Hypothesize → Analyze
 * → Synthesize → Communicate). It references framework data already
 * generated and asks the right questions at each gate.
 */
import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

declare const process: { env: Record<string, string | undefined> };

// ─── Queries ──────────────────────────────────────────────────────────

/**
 * List all chat messages for an engagement, ordered chronologically.
 */
export const list = query({
  args: { engagementId: v.id("engagements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", args.engagementId))
      .collect();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────

/**
 * Add a message to the chat (used by both user and AI).
 */
export const addMessage = mutation({
  args: {
    engagementId: v.id("engagements"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    stage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      engagementId: args.engagementId,
      role: args.role,
      content: args.content,
      stage: args.stage,
      timestamp: Date.now(),
    });
  },
});

/**
 * Clear all messages for an engagement.
 */
export const clearHistory = mutation({
  args: { engagementId: v.id("engagements") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", args.engagementId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});

// ─── AI Chat Action ──────────────────────────────────────────────────

/**
 * Send a message and get an AI response.
 * The AI has context about the engagement, current stage, and framework data.
 */
export const sendMessage = action({
  args: {
    engagementId: v.id("engagements"),
    message: v.string(),
    stage: v.optional(v.string()),
    researchMode: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // 1. Save user message
      await ctx.runMutation(api.chat.addMessage, {
        engagementId: args.engagementId,
        role: "user",
        content: args.message,
        stage: args.stage,
      });

      // 2. Get engagement context
      const engagement = await ctx.runQuery(api.engagements.get, { id: args.engagementId });
      if (!engagement) throw new Error("Engagement not found");

      // 3. Get all framework data for context
      const frameworkData = await ctx.runQuery(api.frameworkData.listByEngagement, {
        engagementId: args.engagementId,
      });

      // 4. Get chat history (last 20 messages for context window)
      const allMessages = await ctx.runQuery(api.chat.list, {
        engagementId: args.engagementId,
      });
      const recentMessages = allMessages.slice(-20);

      // 4b. Cross-engagement memory (#10) — fetch recent insights from other engagements
      let crossEngagementContext = "";
      try {
        const allEngagements = await ctx.runQuery(api.engagements.list, {});
        const otherEngagements = allEngagements.filter((e: { _id: string }) => e._id !== args.engagementId).slice(0, 5);
        if (otherEngagements.length > 0) {
          const summaries = otherEngagements.map((e: { company: string; industry: string; stage: string; progress: number }) =>
            `- ${e.company} (${e.industry}): ${e.stage} stage, ${e.progress}% complete`
          );
          crossEngagementContext = `\n\n## Other Active Engagements (for cross-reference)\n${summaries.join("\n")}`;
        }
      } catch {
        // Non-critical — continue without cross-engagement context
      }

      // 5. Build system prompt (with cross-engagement memory)
      const systemPrompt = buildSystemPrompt(engagement, frameworkData, args.stage, args.researchMode) + crossEngagementContext;

      // 6. Resolve AI config
      const userId = engagement.userId as Id<"users">;
      const aiConfig = await resolveAiConfig(ctx, userId);

      // 7. Build message array for API
      const apiMessages = recentMessages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      // 8. Call LLM
      const response = await callLLM(aiConfig, systemPrompt, apiMessages);

      // 9. Save assistant response
      await ctx.runMutation(api.chat.addMessage, {
        engagementId: args.engagementId,
        role: "assistant",
        content: response,
        stage: args.stage,
      });

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Chat error:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },
});

// ─── System Prompt Builder ────────────────────────────────────────────

interface FrameworkDataItem {
  framework: string;
  data: string;
  status: string;
}

function buildSystemPrompt(
  engagement: { company: string; industry: string; question?: string | null; geographies?: string | null; competitors?: string | null; stage: string },
  frameworkData: FrameworkDataItem[],
  currentStage?: string,
  researchMode?: boolean,
): string {
  const stage = currentStage || engagement.stage;

  // Summarize framework data
  const fwSummary = frameworkData
    .filter((f) => f.status === "done" && f.data !== "{}")
    .map((f) => {
      try {
        const parsed = JSON.parse(f.data);
        return `### ${f.framework.toUpperCase()}\n${JSON.stringify(parsed, null, 1).slice(0, 800)}`;
      } catch {
        return `### ${f.framework.toUpperCase()}\n(data available but not parseable)`;
      }
    })
    .join("\n\n");

  const stageGuidance: Record<string, string> = {
    scoping: `The user is in the SCOPING stage. Help them frame the strategic problem using the SCQA framework (Situation, Complication, Question, Answer/Hypothesis). Ask probing questions to sharpen the problem definition. Ensure the question is specific, measurable, and actionable. When satisfied, recommend they approve Gate G1.`,
    frameworks: `The user is in the DIAGNOSE stage. Help them interpret the framework analyses (SWOT, PESTEL, Porter's 5, BCG, Ansoff, SIPOC, Value Chain, Root Cause). Point out key insights, contradictions, and themes across frameworks. Suggest which frameworks are most relevant for their question. If frameworks haven't been generated yet, suggest they use the "Generate with AI" buttons.`,
    hypothesis: `The user is in the HYPOTHESIS stage. Help them build a MECE hypothesis tree. Each hypothesis should be testable, specific, and falsifiable. Guide them to structure hypotheses hierarchically — governing hypothesis → sub-hypotheses → data requirements. Ensure MECE (Mutually Exclusive, Collectively Exhaustive) at each level.`,
    analysis: `The user is in the ANALYSIS stage. Help them design tests for each hypothesis. Suggest the right analysis method (descriptive, comparative, causal, forecasting, qualitative) for each hypothesis. Guide on data sources, benchmarks, and metrics.`,
    synthesis: `The user is in the SYNTHESIS stage. Help them structure the narrative using the Pyramid Principle (Governing Thought → Key Lines → Supporting Evidence). Ensure the "so-what" is clear at every level. The governing thought should directly answer the strategic question.`,
    communication: `The user is in the COMMUNICATION stage. Help them build consulting-style slides. Each slide should have: action title (≤14 words, starts with a verb), body evidence, and source citations. Guide on data visualization best practices.`,
    export: `The user is in the EXPORT stage. Help them finalize the deliverable and choose the right export format.`,
  };

  return `You are a senior McKinsey-style strategy consultant embedded in the mckinsead platform. You guide users through rigorous strategic analysis following consulting best practices.

## Current Engagement
- **Company**: ${engagement.company}
- **Industry**: ${engagement.industry}
${engagement.question ? `- **Strategic Question**: ${engagement.question}` : ""}
${engagement.geographies ? `- **Geographies**: ${engagement.geographies}` : ""}
${engagement.competitors ? `- **Competitors**: ${engagement.competitors}` : ""}
- **Current Stage**: ${stage}

## Stage Guidance
${stageGuidance[stage] || "Help the user with their strategy engagement."}

${fwSummary ? `## Framework Analyses Available\n${fwSummary}` : "## No framework analyses generated yet."}

${researchMode ? `## 🔍 RESEARCH MODE ACTIVE
You are now in Research Mode. The user wants external data and market intelligence. Provide:
- Industry market size, growth rates, and trends (cite approximate figures and sources like Statista, IBISWorld, McKinsey Global Institute, Gartner, etc.)
- Competitive landscape data (market share, key players, recent M&A)
- Regulatory environment and upcoming changes
- Technology trends and disruption vectors
- Customer/consumer behavior shifts
- Relevant case studies and analogies from your training data
- Always caveat data with "based on publicly available data as of [date]" and recommend verification
- Structure your response with clear headers and data points
- Provide specific numbers wherever possible, even if approximate
- Suggest the user verify critical data points with live sources
` : `
## Data Enrichment
When the user asks about market data, competitor info, or industry trends, suggest enabling Research Mode (the toggle in the chat) for richer, data-driven responses.
`}
## Communication Style
- Be concise but substantive — like a partner in a case interview
- Use bullet points for key insights
- Reference specific data from the frameworks when available
- Ask one focused question at a time (don't overwhelm)
- Use consulting language: "so-what", "MECE", "hypothesis-driven", "pyramid principle"
- When recommending next steps, be specific about what to do and why
- Keep responses under 300 words unless the user asks for detail
- Use markdown formatting (bold, bullets, numbered lists) for readability`;
}

// ─── LLM Call ─────────────────────────────────────────────────────────

interface LLMConfig {
  provider: "anthropic" | "openai";
  apiKey: string;
  model: string;
  baseUrl: string;
}

async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
): Promise<string> {
  if (config.provider === "anthropic") {
    const userMessages = messages.filter((m) => m.role !== "system");
    const systemParts = [
      systemPrompt,
      ...messages.filter((m) => m.role === "system").map((m) => m.content),
    ].filter(Boolean);

    const body: Record<string, unknown> = {
      model: config.model,
      max_tokens: 2048,
      messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (systemParts.length > 0) body.system = systemParts.join("\n\n");

    const res = await fetch(`${config.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Anthropic API error (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
    return data.content.filter((b) => b.type === "text" && b.text).map((b) => b.text).join("");
  } else {
    // OpenAI
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ model: config.model, messages: apiMessages, max_tokens: 2048 }),
    });

    if (!res.ok) throw new Error(`OpenAI API error (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? "";
  }
}

// ─── AI Config Resolution (reused from frameworkAi) ───────────────────

async function resolveAiConfig(
  ctx: { runQuery: (fn: any, args: any) => Promise<any> },
  userId: Id<"users">,
): Promise<LLMConfig> {
  // 1. User BYOK keys
  const userConfigs: Array<{ provider: string; apiKey: string; model?: string; baseUrl?: string }> =
    await ctx.runQuery(internal.userAiConfig.listForUser, { userId });

  if (userConfigs.length > 0) {
    const anthropic = userConfigs.find((c: { provider: string }) => c.provider === "anthropic");
    const config = anthropic ?? userConfigs[0];
    return {
      provider: config.provider as "anthropic" | "openai",
      apiKey: config.apiKey,
      model: config.model ?? (config.provider === "anthropic" ? "claude-sonnet-4-20250514" : "gpt-4o"),
      baseUrl: config.baseUrl ?? (config.provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com/v1"),
    };
  }

  // 2. Platform managed keys
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

  // 3. Environment variables
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

  throw new Error("No AI provider configured. Set API keys in Settings, Admin, or environment variables.");
}
