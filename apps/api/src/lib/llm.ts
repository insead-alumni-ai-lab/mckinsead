/**
 * LLM Client Configuration — Flexible AI provider integration.
 *
 * Supports both Anthropic and OpenAI with configurable model and base URL.
 * All configuration is driven by environment variables with sensible defaults.
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY   — Anthropic API key
 *   ANTHROPIC_MODEL     — Model name (default: "claude-sonnet-4-20250514")
 *   ANTHROPIC_BASE_URL  — Base URL (default: "https://api.anthropic.com")
 *
 *   OPENAI_API_KEY      — OpenAI API key
 *   OPENAI_MODEL        — Model name (default: "gpt-4o")
 *   OPENAI_BASE_URL     — Base URL (default: "https://api.openai.com/v1")
 *
 * The base_url + model pattern lets teams point to:
 *   - Official APIs (Anthropic, OpenAI)
 *   - Azure OpenAI endpoints
 *   - Self-hosted models (vLLM, Ollama, LiteLLM proxy, etc.)
 *   - API gateways / routers (Helicone, Portkey, etc.)
 */

// ─── Provider config types ────────────────────────────────────────────

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  provider: "anthropic" | "openai";
}

export interface LLMConfig {
  anthropic: LLMProviderConfig | null;
  openai: LLMProviderConfig | null;
  /** The preferred provider (first available key wins, Anthropic > OpenAI) */
  default: LLMProviderConfig | null;
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

// ─── Config loader ────────────────────────────────────────────────────

function loadProviderConfig(
  provider: "anthropic" | "openai"
): LLMProviderConfig | null {
  const prefix = provider.toUpperCase();
  const apiKey = process.env[`${prefix}_API_KEY`];

  if (!apiKey) return null;

  return {
    provider,
    apiKey,
    model:
      process.env[`${prefix}_MODEL`] || DEFAULTS[provider].model,
    baseUrl:
      process.env[`${prefix}_BASE_URL`] || DEFAULTS[provider].baseUrl,
  };
}

/**
 * Load the full LLM configuration from environment variables.
 * Call once at startup and pass around, or call per-request for dynamic config.
 */
export function loadLLMConfig(): LLMConfig {
  const anthropic = loadProviderConfig("anthropic");
  const openai = loadProviderConfig("openai");

  return {
    anthropic,
    openai,
    default: anthropic ?? openai ?? null,
  };
}

/**
 * Get a specific provider's config, or throw if not configured.
 */
export function requireProvider(
  provider: "anthropic" | "openai"
): LLMProviderConfig {
  const config = loadProviderConfig(provider);
  if (!config) {
    throw new Error(
      `${provider.toUpperCase()}_API_KEY is not set. ` +
        `Configure it in your .env file to use the ${provider} provider.`
    );
  }
  return config;
}

/**
 * Get the default provider config, or throw if none configured.
 */
export function requireDefaultProvider(): LLMProviderConfig {
  const config = loadLLMConfig();
  if (!config.default) {
    throw new Error(
      "No LLM provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env file."
    );
  }
  return config.default;
}

// ─── Generic API call helpers ─────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  provider?: "anthropic" | "openai";
  model?: string; // Override the env/default model for this call
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string; // Convenience: prepended as system message
}

/**
 * Send a chat completion request to the configured provider.
 *
 * Works with both Anthropic and OpenAI API formats.
 * Returns the assistant's text response.
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  const config = options.provider
    ? requireProvider(options.provider)
    : requireDefaultProvider();

  const model = options.model ?? config.model;

  if (config.provider === "anthropic") {
    return anthropicChat(config, model, options);
  } else {
    return openaiChat(config, model, options);
  }
}

// ─── Anthropic implementation ─────────────────────────────────────────

async function anthropicChat(
  config: LLMProviderConfig,
  model: string,
  options: ChatCompletionOptions
): Promise<string> {
  const messages = options.messages.filter((m) => m.role !== "system");
  const systemMessages = options.messages.filter((m) => m.role === "system");
  const systemText = [
    options.systemPrompt,
    ...systemMessages.map((m) => m.content),
  ]
    .filter(Boolean)
    .join("\n\n");

  const body: Record<string, unknown> = {
    model,
    max_tokens: options.maxTokens ?? 4096,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (systemText) {
    body.system = systemText;
  }

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  const response = await fetch(`${config.baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const textBlocks = data.content.filter(
    (block) => block.type === "text" && block.text
  );
  return textBlocks.map((b) => b.text).join("");
}

// ─── OpenAI implementation ────────────────────────────────────────────

async function openaiChat(
  config: LLMProviderConfig,
  model: string,
  options: ChatCompletionOptions
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

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? "";
}

// ─── Utility: list configured providers ───────────────────────────────

export function listProviders(): Array<{
  provider: string;
  configured: boolean;
  model: string;
  baseUrl: string;
}> {
  const config = loadLLMConfig();
  return [
    {
      provider: "anthropic",
      configured: config.anthropic !== null,
      model: config.anthropic?.model ?? DEFAULTS.anthropic.model,
      baseUrl: config.anthropic?.baseUrl ?? DEFAULTS.anthropic.baseUrl,
    },
    {
      provider: "openai",
      configured: config.openai !== null,
      model: config.openai?.model ?? DEFAULTS.openai.model,
      baseUrl: config.openai?.baseUrl ?? DEFAULTS.openai.baseUrl,
    },
  ];
}
