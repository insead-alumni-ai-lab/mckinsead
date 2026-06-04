import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import {
  Check,
  Crown,
  Key,
  Cloud,
  Loader2,
  Sparkles,
  Users,
  ArrowRight,
  Zap,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    subtitle: "Bring Your Own Key",
    price: "€0",
    period: "/month",
    icon: Key,
    color: "text-emerald-500",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    features: [
      "Use your own API key (OpenAI or Anthropic)",
      "1 strategy session per month",
      "All 10 frameworks included",
      "PPTX export",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    id: "starter" as const,
    name: "Starter",
    subtitle: "Cloud AI Included",
    price: "€2,000",
    period: "/month",
    icon: Cloud,
    color: "text-blue-500",
    borderColor: "border-blue-500/50",
    bgColor: "bg-blue-500/5",
    features: [
      "Cloud AI — no API key needed",
      "10 strategy sessions per month",
      "All 10 frameworks included",
      "PPTX export",
      "Priority support",
    ],
    cta: "Subscribe — €2,000/mo",
    popular: true,
  },
  {
    id: "premium" as const,
    name: "Premium",
    subtitle: "Enterprise + Consultants",
    price: "€10,000",
    period: "/month",
    icon: Crown,
    color: "text-amber-500",
    borderColor: "border-amber-500/50",
    bgColor: "bg-amber-500/5",
    features: [
      "Everything in Starter",
      "30 Starter seats included",
      "True consultant reviews",
      "Forward-deployed consultants",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Subscribe — €10,000/mo",
    popular: false,
  },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const profile = useQuery(api.subscriptions.profile);
  const chooseBYOK = useMutation(api.subscriptions.chooseBYOK);
  const createCheckout = useAction(api.stripe.createCheckout);

  // If checkout was successful, redirect to dashboard
  const checkoutStatus = searchParams.get("checkout");
  if (checkoutStatus === "success") {
    // The webhook will have set up the subscription
    navigate("/dashboard", { replace: true });
    return null;
  }

  // If already onboarded, go to dashboard
  if (profile?.onboardingComplete) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSelect = async (planId: "free" | "starter" | "premium") => {
    setLoading(planId);
    try {
      if (planId === "free") {
        await chooseBYOK();
        navigate("/dashboard", { replace: true });
      } else {
        const result = await createCheckout({ plan: planId });
        if (result?.url) {
          window.location.href = result.url;
        }
      }
    } catch (err) {
      console.error("Plan selection error:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            M
          </div>
          <span className="font-semibold text-lg">McKinsead</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="size-4" />
            Welcome to McKinsead
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Choose how you want to use AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Bring your own API key for free, or let us handle the infrastructure with a Cloud plan.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-all hover:shadow-lg",
                plan.popular && "ring-2 ring-blue-500 shadow-lg scale-[1.02]",
                plan.borderColor,
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white hover:bg-blue-600 gap-1">
                    <Zap className="size-3" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className={cn("inline-flex items-center gap-2 mb-2", plan.color)}>
                  <plan.icon className="size-5" />
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.subtitle}</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn("size-4 mt-0.5 shrink-0", plan.color)} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleSelect(plan.id)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      {plan.id === "free" ? "Setting up…" : "Redirecting to Stripe…"}
                    </>
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="size-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="size-4" />
            <span>BYOK keys never leave your browser</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="size-4" />
            <span>Priority support for paid plans</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4" />
            <span>Team seats on Premium</span>
          </div>
        </div>
      </main>
    </div>
  );
}
