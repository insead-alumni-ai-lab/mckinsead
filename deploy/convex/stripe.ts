import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";
import { PLAN_LIMITS } from "./subscriptions";

declare const process: { env: Record<string, string | undefined> };

// ─── Helpers ──────────────────────────────────────────────────

function stripeKey(): string {
  const key = process.env.STRIPE_RESTRICTED_KEY;
  if (!key) throw new Error("STRIPE_RESTRICTED_KEY not set");
  return key;
}

async function stripeFetch(
  path: string,
  body?: Record<string, string>,
  method = "POST",
): Promise<unknown> {
  const resp = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body
      ? Object.entries(body)
          .map(
            ([k, val]) => `${encodeURIComponent(k)}=${encodeURIComponent(val)}`,
          )
          .join("&")
      : undefined,
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Stripe error:", JSON.stringify(data));
    throw new Error(
      `Stripe API error: ${(data as { error?: { message?: string } }).error?.message ?? resp.statusText}`,
    );
  }
  return data;
}

// ─── Actions ──────────────────────────────────────────────────

/** Create a Stripe Checkout session for a plan. */
export const createCheckout = action({
  args: {
    plan: v.union(v.literal("starter"), v.literal("premium")),
  },
  handler: async (ctx, { plan }): Promise<{ url: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.auth.internalCurrentUser, {});
    const email = user?.email ?? undefined;

    // Find or create Stripe customer
    const existingSub = await ctx.runQuery(
      internal.stripe.internalGetSubscription,
      { userId },
    );
    let customerId = existingSub?.stripeCustomerId;

    if (!customerId) {
      const customer = (await stripeFetch("/customers", {
        ...(email ? { email } : {}),
        "metadata[convex_user_id]": userId,
      })) as { id: string };
      customerId = customer.id;
    }

    const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const priceAmount = plan === "starter" ? "200000" : "1000000";

    const session = (await stripeFetch("/checkout/sessions", {
      customer: customerId,
      mode: "subscription",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": priceAmount,
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][product_data][name]":
        plan === "starter" ? "McKinsead Starter" : "McKinsead Premium",
      "line_items[0][price_data][product_data][description]":
        plan === "starter"
          ? "Cloud AI, 10 strategy sessions/month, support"
          : "30 Starter seats, consultant reviews, forward-deployed consultants",
      "line_items[0][quantity]": "1",
      success_url: `${siteUrl}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/onboarding?checkout=canceled`,
      "metadata[convex_user_id]": userId,
      "metadata[plan]": plan,
      "subscription_data[metadata][convex_user_id]": userId,
      "subscription_data[metadata][plan]": plan,
    })) as { url: string };

    // Save customer ID now
    await ctx.runMutation(internal.stripe.upsertSubscription, {
      userId,
      plan,
      mode: "cloud",
      stripeCustomerId: customerId,
      status: "active",
    });

    return { url: session.url };
  },
});

/** Create a Stripe billing portal session so users can manage subscription. */
export const createPortal = action({
  args: {},
  handler: async (ctx): Promise<{ url: string } | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sub = await ctx.runQuery(internal.stripe.internalGetSubscription, {
      userId,
    });
    if (!sub?.stripeCustomerId) return null;

    const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const session = (await stripeFetch("/billing_portal/sessions", {
      customer: sub.stripeCustomerId,
      return_url: `${siteUrl}/settings`,
    })) as { url: string };

    return { url: session.url };
  },
});

// ─── Internal queries/mutations (for use within actions) ──────

export const internalGetSubscription = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();
  },
});

export const upsertSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("premium"),
    ),
    mode: v.union(v.literal("byok"), v.literal("cloud")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .unique();

    const limits = PLAN_LIMITS[args.plan];

    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        mode: args.mode,
        stripeCustomerId: args.stripeCustomerId ?? existing.stripeCustomerId,
        stripeSubscriptionId:
          args.stripeSubscriptionId ?? existing.stripeSubscriptionId,
        status: args.status,
        sessionsLimit: limits.sessionsLimit,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        plan: args.plan,
        mode: args.mode,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        status: args.status,
        sessionsUsed: 0,
        sessionsLimit: limits.sessionsLimit,
      });
    }
  },
});

export const upsertProfile = internalMutation({
  args: {
    userId: v.id("users"),
    onboardingComplete: v.boolean(),
    aiMode: v.union(v.literal("byok"), v.literal("cloud")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        onboardingComplete: args.onboardingComplete,
        aiMode: args.aiMode,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        onboardingComplete: args.onboardingComplete,
        aiMode: args.aiMode,
      });
    }
  },
});

// Need to import internalQuery for the internal query
import { internalQuery } from "./_generated/server";
