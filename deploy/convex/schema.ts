import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Subscription & billing
  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("premium")),
    mode: v.union(v.literal("byok"), v.literal("cloud")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
    ),
    sessionsUsed: v.number(),
    sessionsLimit: v.number(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),

  // User onboarding state
  userProfiles: defineTable({
    userId: v.id("users"),
    onboardingComplete: v.boolean(),
    // For BYOK users — they store their own key client-side (never sent to us)
    aiMode: v.optional(v.union(v.literal("byok"), v.literal("cloud"))),
  }).index("by_userId", ["userId"]),

  // Platform-wide managed AI config (set by admins for Cloud users)
  platformAiConfig: defineTable({
    provider: v.union(v.literal("anthropic"), v.literal("openai")),
    apiKey: v.string(),
    model: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
  }).index("by_provider", ["provider"]),

  // Per-user AI provider config (BYOK keys, models, base URLs)
  userAiConfig: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("anthropic"), v.literal("openai")),
    apiKey: v.string(),
    model: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_provider", ["userId", "provider"]),

  // Strategy engagements
  engagements: defineTable({
    userId: v.id("users"),
    company: v.string(),
    industry: v.string(),
    question: v.optional(v.string()),
    geographies: v.optional(v.string()),
    competitors: v.optional(v.string()),
    stage: v.string(),
    progress: v.number(),
    template: v.optional(v.string()),
    // Persisted stage data (JSON-stringified)
    scopingData: v.optional(v.string()),     // SCQA framework
    hypothesisData: v.optional(v.string()),  // Hypothesis tree
    synthesisData: v.optional(v.string()),   // Pyramid principle
    communicationData: v.optional(v.string()), // Slide structure
    gatesApproved: v.optional(v.string()),   // JSON array of approved gates
  })
    .index("by_userId", ["userId"]),

  // AI-generated framework data per engagement
  frameworkData: defineTable({
    engagementId: v.id("engagements"),
    framework: v.string(), // swot | pestel | porter5 | bcg | ansoff | sipoc | value_chain | root_cause
    data: v.string(), // JSON-stringified framework output
    status: v.union(
      v.literal("empty"),
      v.literal("generating"),
      v.literal("done"),
      v.literal("error"),
    ),
    error: v.optional(v.string()),
    generatedAt: v.optional(v.number()),
  })
    .index("by_engagementId", ["engagementId"])
    .index("by_engagementId_framework", ["engagementId", "framework"]),

  // Chat messages for engagement conversations
  chatMessages: defineTable({
    engagementId: v.id("engagements"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    stage: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_engagementId", ["engagementId"]),
});

export default schema;
