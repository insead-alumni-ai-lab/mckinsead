/**
 * LLM Client Configuration for Convex actions.
 *
 * Flexible AI provider integration supporting Anthropic and OpenAI
 * with configurable model and base URL via Convex environment variables.
 *
 * Set these in the Convex dashboard or via `npx convex env set`:
 *   ANTHROPIC_API_KEY   — Anthropic API key
 *   ANTHROPIC_MODEL     — Model name (default: "claude-sonnet-4-20250514")
 *   ANTHROPIC_BASE_URL  — Base URL (default: "https://api.anthropic.com")
 *
 *   OPENAI_API_KEY      — OpenAI API key
 *   OPENAI_MODEL        — Model name (default: "gpt-4o")
 *   OPENAI_BASE_URL     — Base URL (default: "https://api.openai.com/v1")
 *
 * Supports custom endpoints: Azure OpenAI, vLLM, Ollama, LiteLLM, etc.
 */

declare const process: { env: Record<string, string | undefined> };

// ─── Types ────────────────────────────────────────────────────────────

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  provider: "anthropic" | "openai";
}

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

// ─── Defaults ─────────────────────────────────────────────────────────

const DEFAULTS = {
  anthropic: {
    model: "claude-sonnet-4-20250514",
    baseUrl: "https://api.anthropic.com",
  },
  openai: {
    model: "gpt-4o",
    baseUrl: "https://api.openai.com/v1",
  },
} as const;

// ─── Config ───────────────────────────────────────────────────────────

function getProviderConfig(
  provider: "anthropic" | "openai"
): LLMProviderConfig | null {
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

export function getDefaultProvider(): LLMProviderConfig {
  const anthropic = getProviderConfig("anthropic");
  if (anthropic) return anthropic;

  const openai = getProviderConfig("openai");
  if (openai) return openai;

  throw new Error(
    "No LLM provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY."
  );
}

export function getProvider(
  provider: "anthropic" | "openai"
): LLMProviderConfig {
  const config = getProviderConfig(provider);
  if (!config) {
    throw new Error(
      `${provider.toUpperCase()}_API_KEY is not set.`
    );
  }
  return config;
}

// ─── Chat completion ──────────────────────────────────────────────────

export async function chatCompletion(options: ChatOptions): Promise<string> {
  const config = options.provider
    ? getProvider(options.provider)
    : getDefaultProvider();

  const model = options.model ?? config.model;

  if (config.provider === "anthropic") {
    return anthropicChat(config, model, options);
  }
  return openaiChat(config, model, options);
}

// ─── Anthropic ────────────────────────────────────────────────────────

async function anthropicChat(
  config: LLMProviderConfig,
  model: string,
  options: ChatOptions
): Promise<string> {
  const userMessages = options.messages.filter((m) => m.role !== "system");
  const systemParts = [
    options.systemPrompt,
    ...options.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content),
  ].filter(Boolean);

  const body: Record<string, unknown> = {
    model,
    max_tokens: options.maxTokens ?? 4096,
    messages: userMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (systemParts.length > 0) {
    body.system = systemParts.join("\n\n");
  }
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  const res = await fetch(`${config.baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Anthropic API error (${res.status}): ${await res.text()}`
    );
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  return data.content
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("");
}

// ─── OpenAI ───────────────────────────────────────────────────────────

async function openaiChat(
  config: LLMProviderConfig,
  model: string,
  options: ChatOptions
): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [];

  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  for (const m of options.messages) {
    messages.push({ role: m.role, content: m.content });
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: options.maxTokens ?? 4096,
  };
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `OpenAI API error (${res.status}): ${await res.text()}`
    );
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? "";
}

// ─── Info ─────────────────────────────────────────────────────────────

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
