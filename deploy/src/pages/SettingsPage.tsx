import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  Bot,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Cloud,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Moon,
  Palette,
  Save,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "../../convex/_generated/api";

const PROVIDER_DEFAULTS = {
  anthropic: {
    label: "Anthropic",
    initial: "A",
    defaultModel: "claude-sonnet-4-20250514",
    defaultBaseUrl: "https://api.anthropic.com",
    keyPlaceholder: "sk-ant-api03-...",
  },
  openai: {
    label: "OpenAI",
    initial: "O",
    defaultModel: "gpt-4o",
    defaultBaseUrl: "https://api.openai.com/v1",
    keyPlaceholder: "sk-...",
  },
} as const;

type ProviderName = "anthropic" | "openai";

interface ProviderFormState {
  apiKey: string;
  model: string;
  baseUrl: string;
  showKey: boolean;
  saving: boolean;
  saved: boolean;
  removing: boolean;
}

export function SettingsPage() {
  const user = useQuery(api.auth.currentUser);
  const { theme, toggleTheme, switchable } = useTheme();
  const { signIn, signOut } = useAuthActions();
  const deleteAccount = useMutation(api.users.deleteAccount);
  const navigate = useNavigate();

  // AI config
  const userAiConfigs = useQuery(api.userAiConfig.list) ?? [];
  const saveAiConfig = useMutation(api.userAiConfig.save);
  const removeAiConfig = useMutation(api.userAiConfig.remove);

  // Subscription
  const subscription = useQuery(api.subscriptions.current);
  const createPortal = useAction(api.stripe.createPortal);
  const [portalLoading, setPortalLoading] = useState(false);

  // Password / account
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordStep, setPasswordStep] = useState<"request" | "verify">("request");

  // AI provider form states
  const [providerForms, setProviderForms] = useState<Record<ProviderName, ProviderFormState>>({
    anthropic: { apiKey: "", model: "", baseUrl: "", showKey: false, saving: false, saved: false, removing: false },
    openai: { apiKey: "", model: "", baseUrl: "", showKey: false, saving: false, saved: false, removing: false },
  });

  // Sync existing configs into form state
  useEffect(() => {
    if (userAiConfigs.length > 0) {
      setProviderForms((prev) => {
        const next = { ...prev };
        for (const cfg of userAiConfigs) {
          const p = cfg.provider as ProviderName;
          next[p] = {
            ...next[p],
            apiKey: next[p].apiKey || (cfg.apiKeySet ? "••••••••••••••••" : ""),
            model: next[p].model || cfg.model || "",
            baseUrl: next[p].baseUrl || cfg.baseUrl || "",
          };
        }
        return next;
      });
    }
  }, [userAiConfigs]);

  const updateProviderForm = (provider: ProviderName, updates: Partial<ProviderFormState>) => {
    setProviderForms((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates },
    }));
  };

  const handleSaveProvider = async (provider: ProviderName) => {
    const form = providerForms[provider];
    if (!form.apiKey.trim() || form.apiKey === "••••••••••••••••") {
      // If key is masked and user hasn't changed it, skip
      const existingCfg = userAiConfigs.find((c) => c.provider === provider);
      if (existingCfg?.apiKeySet && form.apiKey === "••••••••••••••••") {
        // Only updating model/baseUrl — we need a real key though
        // For now, we can't patch without re-entering the key
        return;
      }
      return;
    }

    updateProviderForm(provider, { saving: true, saved: false });
    try {
      await saveAiConfig({
        provider,
        apiKey: form.apiKey,
        model: form.model || undefined,
        baseUrl: form.baseUrl || undefined,
      });
      updateProviderForm(provider, { saving: false, saved: true });
      setTimeout(() => updateProviderForm(provider, { saved: false }), 2000);
    } catch {
      updateProviderForm(provider, { saving: false });
    }
  };

  const handleRemoveProvider = async (provider: ProviderName) => {
    updateProviderForm(provider, { removing: true });
    try {
      await removeAiConfig({ provider });
      updateProviderForm(provider, {
        apiKey: "",
        model: "",
        baseUrl: "",
        removing: false,
      });
    } catch {
      updateProviderForm(provider, { removing: false });
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", user?.email || "");
    formData.append("flow", "reset");

    try {
      await signIn("password", formData);
      setPasswordStep("verify");
    } catch {
      setError("Could not send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("email", user?.email || "");
    formData.append("flow", "reset-verification");

    try {
      await signIn("password", formData);
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        setChangePasswordOpen(false);
        setPasswordStep("request");
        setSuccess("");
      }, 1500);
    } catch {
      setError("Invalid code or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError("");

    try {
      await deleteAccount();
      await signOut();
      navigate("/");
    } catch {
      setError("Could not delete account. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="-mt-10 pb-6">
          <div className="flex items-end gap-4">
            <Avatar className="size-16 border-4 border-background shadow-lg">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || <User className="size-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <p className="font-semibold">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-muted-foreground" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div
                  className={`size-10 rounded-full flex items-center justify-center ${
                    subscription.plan === "premium"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : subscription.plan === "starter"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {subscription.plan === "premium" ? (
                    <Crown className="size-5" />
                  ) : subscription.plan === "starter" ? (
                    <Cloud className="size-5" />
                  ) : (
                    <Key className="size-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm capitalize">
                    {subscription.plan} Plan
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        subscription.status === "active"
                          ? "bg-green-500/15 text-green-600 dark:text-green-400"
                          : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subscription.mode === "byok" ? "Bring Your Own Key" : "Cloud AI"} ·{" "}
                    {subscription.sessionsUsed} / {subscription.sessionsLimit} sessions used this month
                  </p>
                </div>
              </div>
              {subscription.stripeCustomerId && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={portalLoading}
                  onClick={async () => {
                    setPortalLoading(true);
                    try {
                      const result = await createPortal();
                      if (result?.url) window.location.href = result.url;
                    } finally {
                      setPortalLoading(false);
                    }
                  }}
                >
                  {portalLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Manage <ExternalLink className="size-3 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground px-4">No active subscription</p>
          )}
        </CardContent>
      </Card>

      {/* AI Providers — editable forms */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-muted-foreground" />
            AI Providers
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your API keys and model preferences. Keys are stored securely on the server.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(["anthropic", "openai"] as const).map((provider) => {
            const meta = PROVIDER_DEFAULTS[provider];
            const form = providerForms[provider];
            const existingCfg = userAiConfigs.find((c) => c.provider === provider);
            const isConfigured = !!existingCfg?.apiKeySet;

            return (
              <div key={provider} className="rounded-lg border p-4 space-y-4">
                {/* Provider header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center text-xs font-bold uppercase ${
                        isConfigured
                          ? "bg-green-500/15 text-green-600 dark:text-green-400"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {meta.initial}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {meta.label}
                        {isConfigured && (
                          <Badge variant="secondary" className="ml-2 bg-green-500/15 text-green-600 dark:text-green-400 text-[10px]">
                            Connected
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Default model: {meta.defaultModel}
                      </p>
                    </div>
                  </div>
                  {isConfigured && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={form.removing}
                      onClick={() => handleRemoveProvider(provider)}
                    >
                      {form.removing ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      <span className="ml-1 text-xs">Remove</span>
                    </Button>
                  )}
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">API Key *</Label>
                    <div className="relative">
                      <Input
                        type={form.showKey ? "text" : "password"}
                        placeholder={meta.keyPlaceholder}
                        value={form.apiKey}
                        onChange={(e) =>
                          updateProviderForm(provider, { apiKey: e.target.value })
                        }
                        onFocus={() => {
                          if (form.apiKey === "••••••••••••••••") {
                            updateProviderForm(provider, { apiKey: "" });
                          }
                        }}
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() =>
                          updateProviderForm(provider, { showKey: !form.showKey })
                        }
                        tabIndex={-1}
                      >
                        {form.showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Model</Label>
                      <Input
                        type="text"
                        placeholder={meta.defaultModel}
                        value={form.model}
                        onChange={(e) =>
                          updateProviderForm(provider, { model: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Base URL</Label>
                      <Input
                        type="text"
                        placeholder={meta.defaultBaseUrl}
                        value={form.baseUrl}
                        onChange={(e) =>
                          updateProviderForm(provider, { baseUrl: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={
                      form.saving ||
                      !form.apiKey.trim() ||
                      form.apiKey === "••••••••••••••••"
                    }
                    onClick={() => handleSaveProvider(provider)}
                    className="gap-1.5"
                  >
                    {form.saving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : form.saved ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    {form.saved ? "Saved!" : "Save"}
                  </Button>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground px-1">
            Your API keys are stored securely and only used to make requests on your behalf.
            Supports custom endpoints (Azure OpenAI, vLLM, Ollama, LiteLLM, etc.) via Base URL.
          </p>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-muted-foreground" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {switchable ? (
            <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
                  {theme === "light" ? (
                    <Moon className="size-5 text-foreground" />
                  ) : (
                    <Sun className="size-5 text-foreground" />
                  )}
                </div>
                <div>
                  <Label htmlFor="dark-mode" className="font-medium">Dark mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
              </div>
              <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground px-4 py-2">
              Theme follows your system preference
            </p>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-muted-foreground" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <button
            onClick={() => setChangePasswordOpen(true)}
            className="w-full flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 text-left"
          >
            <div>
              <p className="font-medium text-sm">Change password</p>
              <p className="text-sm text-muted-foreground">Update your password</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setDeleteAccountOpen(true)}
            className="w-full flex items-center justify-between rounded-lg border border-destructive/20 p-4 transition-colors hover:bg-destructive/5 text-left"
          >
            <div>
              <p className="font-medium text-sm text-destructive">Delete account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account</p>
            </div>
            <ChevronRight className="size-4 text-destructive" />
          </button>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              {passwordStep === "request"
                ? "We'll send a verification code to your email."
                : "Enter the code from your email and your new password."}
            </DialogDescription>
          </DialogHeader>

          {passwordStep === "request" ? (
            <form onSubmit={handleRequestPasswordReset}>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  A reset code will be sent to:{" "}
                  <span className="font-medium text-foreground">{user?.email}</span>
                </p>
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">{error}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Send Code
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input id="code" name="code" type="text" placeholder="Enter code from email" autoComplete="one-time-code" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" placeholder="••••••••" minLength={6} autoComplete="new-password" required />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">{success}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setPasswordStep("request"); setError(""); }}>Back</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Change Password
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Are you sure you want to delete your account?</p>
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAccountOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
