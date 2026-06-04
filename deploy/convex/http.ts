import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();
auth.addHttpRoutes(http);

// ─── Stripe webhook ──────────────────────────────────────────
// For now we trust Stripe events by checking the object types.
// In production, add signature verification with STRIPE_WEBHOOK_SECRET.
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    let event: {
      type: string;
      data: {
        object: {
          id?: string;
          customer?: string;
          status?: string;
          metadata?: Record<string, string>;
          current_period_start?: number;
          current_period_end?: number;
        };
      };
    };

    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const obj = event.data.object;
    console.log("Stripe webhook:", event.type, obj.id);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const userId = obj.metadata?.convex_user_id;
      const plan = obj.metadata?.plan;
      if (userId && plan && (plan === "starter" || plan === "premium")) {
        // Map Stripe status to our status
        let status: "active" | "past_due" | "canceled" | "trialing" = "active";
        if (obj.status === "past_due") status = "past_due";
        if (obj.status === "canceled") status = "canceled";
        if (obj.status === "trialing") status = "trialing";

        await ctx.runMutation(internal.stripe.upsertSubscription, {
          userId: userId as never, // Convex ID type
          plan,
          mode: "cloud",
          stripeCustomerId: obj.customer,
          stripeSubscriptionId: obj.id,
          status,
        });

        // Also mark onboarding complete
        await ctx.runMutation(internal.stripe.upsertProfile, {
          userId: userId as never,
          onboardingComplete: true,
          aiMode: "cloud",
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const userId = obj.metadata?.convex_user_id;
      if (userId) {
        await ctx.runMutation(internal.stripe.upsertSubscription, {
          userId: userId as never,
          plan: "free",
          mode: "byok",
          stripeCustomerId: obj.customer,
          status: "canceled",
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
