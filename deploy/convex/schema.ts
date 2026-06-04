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
});

export default schema;
