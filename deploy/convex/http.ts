import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();
auth.addHttpRoutes(http);

// ─── Stripe signature verification helpers ───────────────────
async function verifyStripeSignature(
  body: string,
  sigHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    })
  );
  const timestamp = parts["t"];
  const expectedSig = parts["v1"];
  if (!timestamp || !expectedSig) return false;

  // Tolerance: 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const payload = `${timestamp}.${body}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === expectedSig;
}

declare const process: { env: Record<string, string | undefined> };

// ─── Stripe webhook ──────────────────────────────────────────
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const sigHeader = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret) {
      const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
      if (!valid) {
        console.error("Stripe webhook: invalid signature");
        return new Response("Invalid signature", { status: 401 });
      }
    }

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
