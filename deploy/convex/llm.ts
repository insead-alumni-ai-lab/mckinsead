/**
 * Shared LLM utilities — deduplicated from chat.ts and frameworkAi.ts.
 * Includes AI config resolution, LLM API calls, and prompt sanitization (#4, #6).
 */
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

declare const process: { env: Record<string, string | undefined> };

// ─── Types ────────────────────────────────────────────────────

export interface LLMConfig {
  provider: "anthropic" | "openai";
  apiKey: string;
  model: string;
  baseUrl: string;
}

// ─── Prompt Sanitization (#6) ─────────────────────────────────

/**
 * Strip common prompt-injection patterns from user-supplied text
 * before it reaches the LLM context window.
 */
export function sanitizeForLLM(input: string): string {
  let text = input;
  // Remove special-token delimiters
  text = text.replace(/<\|.*?\|>/g, "");
  // Remove Llama-style instruction wrappers
  text = text.replace(/\[INST\][\s\S]*?\[\/INST\]/gi, "");
  text = text.replace(/<<SYS>>[\s\S]*?<<\/SYS>>/gi, "");
  // Defuse common injection phrases (case-insensitive)
  text = text.replace(/\bignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)\b/gi, "[filtered]");
  text = text.replace(/\byou\s+are\s+now\b/gi, "[filtered]");
  text = text.replace(/\bpretend\s+(to\s+be|you\s+are)\b/gi, "[filtered]");
  text = text.replace(/\bsystem\s*:\s*/gi, "system - ");
  return text.trim();
}

// ─── AI Config Resolution ─────────────────────────────────────

/**
 * Resolve the best available LLM configuration for a given user.
 * Priority: user BYOK keys > platform managed keys > env vars.
 */
export async function resolveAiConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: { runQuery: (...a: any[]) => Promise<any> },
  userId: Id<"users">,
): Promise<LLMConfig> {
  // 1. User BYOK keys
  const userConfigs = (await ctx.runQuery(internal.userAiConfig.listForUser, { userId })) as Array<{
    provider: string;
    apiKey: string;
    model?: string;
    baseUrl?: string;
  }>;

  if (userConfigs.length > 0) {
    const anthropic = userConfigs.find((c) => c.provider === "anthropic");
    const config = anthropic ?? userConfigs[0];
    return {
      provider: config.provider as "anthropic" | "openai",
      apiKey: config.apiKey,
      model: config.model ?? (config.provider === "anthropic" ? "claude-sonnet-4-20250514" : "gpt-4o"),
      baseUrl: config.baseUrl ?? (config.provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com/v1"),
    };
  }

  // 2. Platform managed keys
  const platformConfigs = (await ctx.runQuery(internal.admin.getPlatformAiConfigs, {})) as Array<{
    provider: string;
    apiKey: string;
    model?: string;
    baseUrl?: string;
  }>;

  if (platformConfigs.length > 0) {
    const anthropic = platformConfigs.find((c) => c.provider === "anthropic");
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

// ─── LLM Calls ────────────────────────────────────────────────

/**
 * Call LLM with a single prompt (used for framework JSON generation).
 * System message is hardcoded to enforce JSON-only output.
 */
export async function callLLMPrompt(config: LLMConfig, prompt: string): Promise<string> {
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

    const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
    return data.content.filter((b) => b.type === "text" && b.text).map((b) => b.text).join("");
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

    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? "";
  }
}

/**
 * Call LLM with a system prompt and message history (used for chat).
 */
export async function callLLMChat(
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
    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
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

// ─── JSON Parsing Helper ──────────────────────────────────────

/**
 * Parse JSON from an LLM response, stripping markdown fences if present.
 */
export function parseJsonResponse(text: string): unknown {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

// ─── Legacy API (used by convex/ai.ts) ────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  provider?: "anthropic" | "openai";
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

const DEFAULTS = {
  anthropic: { model: "claude-sonnet-4-20250514", baseUrl: "https://api.anthropic.com" },
  openai: { model: "gpt-4o", baseUrl: "https://api.openai.com/v1" },
} as const;

function getProviderConfig(provider: "anthropic" | "openai"): LLMConfig | null {
  const prefix = provider.toUpperCase();
  const apiKey = process.env[`${prefix}_API_KEY`];
  if (!apiKey) return null;
  return {
    provider,
    apiKey,
    model: process.env[`${prefix}_MODEL`] || DEFAULTS[provider].model,
    baseUrl: process.env[`${prefix}_BASE_URL`] || DEFAULTS[provider].baseUrl,
  };
}

function getDefaultProvider(): LLMConfig {
  const anthropic = getProviderConfig("anthropic");
  if (anthropic) return anthropic;
  const openai = getProviderConfig("openai");
  if (openai) return openai;
  throw new Error("No LLM provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
}

export async function chatCompletion(options: ChatOptions): Promise<string> {
  const config = options.provider ? getProviderConfig(options.provider)! : getDefaultProvider();
  const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = options.messages;
  return callLLMChat(config, options.systemPrompt ?? "", messages);
}

export function listProviders(): Array<{
  provider: string;
  configured: boolean;
  model: string;
  baseUrl: string;
}> {
  return (["anthropic", "openai"] as const).map((p) => {
    const cfg = getProviderConfig(p);
    return {
      provider: p,
      configured: cfg !== null,
      model: cfg?.model ?? DEFAULTS[p].model,
      baseUrl: cfg?.baseUrl ?? DEFAULTS[p].baseUrl,
    };
  });
}
