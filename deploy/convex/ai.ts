/**
 * AI Actions — Convex actions for LLM-powered features.
 *
 * Uses the configurable LLM client from llm.ts.
 * Providers, models, and endpoints are set via environment variables.
 */
import { v } from "convex/values";
import { action } from "./_generated/server";
import { chatCompletion, listProviders } from "./llm";

/**
 * General-purpose chat completion action.
 * Uses the default configured provider (Anthropic > OpenAI).
 */
export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(
          v.literal("system"),
          v.literal("user"),
          v.literal("assistant")
        ),
        content: v.string(),
      })
    ),
    systemPrompt: v.optional(v.string()),
    provider: v.optional(
      v.union(v.literal("anthropic"), v.literal("openai"))
    ),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (_ctx, args) => {
    return chatCompletion({
      messages: args.messages,
      systemPrompt: args.systemPrompt,
      provider: args.provider,
      model: args.model,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
    });
  },
});

/**
 * Get the currently configured AI providers and their settings.
 */
export const providers = action({
  args: {},
  returns: v.array(
    v.object({
      provider: v.string(),
      configured: v.boolean(),
      model: v.string(),
      baseUrl: v.string(),
    })
  ),
  handler: async () => {
    return listProviders();
  },
});

/**
 * Quick strategy analysis helper — sends a prompt to the default LLM
 * with the McKinsey-style system context.
 */
export const strategyAnalysis = action({
  args: {
    prompt: v.string(),
    framework: v.optional(v.string()),
    context: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (_ctx, { prompt, framework, context }) => {
    const systemPrompt = [
      "You are a senior strategy consultant trained in McKinsey-style problem solving.",
      "Apply structured frameworks (MECE, hypothesis-driven, so-what discipline).",
      "Be specific, actionable, and grounded in evidence.",
      framework ? `Focus on the ${framework} framework.` : "",
      context ? `Context: ${context}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return chatCompletion({
      messages: [{ role: "user", content: prompt }],
      systemPrompt,
      temperature: 0.3,
    });
  },
});
