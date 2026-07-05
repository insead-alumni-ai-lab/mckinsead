import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  Bot,
  Check,
  Cloud,
  Crown,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../convex/_generated/api";

const PROVIDER_META = {
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

export function AdminPage() {
  const navigate = useNavigate();
  const isAdmin = useQuery(api.admin.isAdmin);
  const stats = useQuery(api.admin.dashboardStats);
  const users = useQuery(api.admin.listUsers);
  const platformConfig = useQuery(api.admin.getPlatformAiConfig);
  const savePlatformConfig = useMutation(api.admin.savePlatformAiConfig);
  const removePlatformConfig = useMutation(api.admin.removePlatformAiConfig);
  const updateUserSessions = useMutation(api.admin.updateUserSessions);

  const [providerForms, setProviderForms] = useState<
    Record<ProviderName, ProviderFormState>
  >({
    anthropic: {
      apiKey: "",
      model: "",
      baseUrl: "",
      showKey: false,
      saving: false,
      saved: false,
      removing: false,
    },
    openai: {
      apiKey: "",
      model: "",
      baseUrl: "",
      showKey: false,
      saving: false,
      saved: false,
      removing: false,
    },
  });

  // Track editing state for user session limits
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editSessionsUsed, setEditSessionsUsed] = useState(0);
  const [editSessionsLimit, setEditSessionsLimit] = useState(0);

  const handleEditUser = (
    userId: string,
    sessionsUsed: number,
    sessionsLimit: number,
  ) => {
    setEditingUser(userId);
    setEditSessionsUsed(sessionsUsed);
    setEditSessionsLimit(sessionsLimit);
  };

  const handleSaveUserSessions = async (userId: string) => {
    await updateUserSessions({
      userId: userId as any,
      sessionsUsed: editSessionsUsed,
      sessionsLimit: editSessionsLimit,
    });
    setEditingUser(null);
  };

  const handleResetSessions = async (userId: string) => {
    await updateUserSessions({
      userId: userId as any,
      sessionsUsed: 0,
    });
  };

  // Sync platform config into forms
  useEffect(() => {
    if (platformConfig) {
      setProviderForms(prev => {
        const next = { ...prev };
        for (const provider of ["anthropic", "openai"] as const) {
          const cfg = platformConfig[provider];
          if (cfg) {
            next[provider] = {
              ...next[provider],
              apiKey:
                next[provider].apiKey || (cfg.apiKey ? "••••••••••••••••" : ""),
              model: next[provider].model || cfg.model || "",
              baseUrl: next[provider].baseUrl || cfg.baseUrl || "",
            };
          }
        }
        return next;
      });
    }
  }, [platformConfig]);

  const updateForm = (
    provider: ProviderName,
    updates: Partial<ProviderFormState>,
  ) => {
    setProviderForms(prev => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates },
    }));
  };

  const handleSave = async (provider: ProviderName) => {
    const form = providerForms[provider];
    if (!form.apiKey.trim() || form.apiKey === "••••••••••••••••") return;
    updateForm(provider, { saving: true, saved: false });
    try {
      await savePlatformConfig({
        provider,
        apiKey: form.apiKey,
        model: form.model || undefined,
        baseUrl: form.baseUrl || undefined,
      });
      updateForm(provider, { saving: false, saved: true });
      setTimeout(() => updateForm(provider, { saved: false }), 2000);
    } catch {
      updateForm(provider, { saving: false });
    }
  };

  const handleRemove = async (provider: ProviderName) => {
    updateForm(provider, { removing: true });
    try {
      await removePlatformConfig({ provider });
      updateForm(provider, {
        apiKey: "",
        model: "",
        baseUrl: "",
        removing: false,
      });
    } catch {
      updateForm(provider, { removing: false });
    }
  };

  // Access check
  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="size-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-muted-foreground mb-4">
          You don't have permission to access this page.
        </p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="size-7 text-primary" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform management and analytics
        </p>
      </div>

      {/* ─── Dashboard Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers ?? "—"}
          sub={`+${stats?.recentSignups ?? 0} this week`}
        />
        <StatCard
          icon={Activity}
          label="Active Subscriptions"
          value={stats?.activeSubscriptions ?? "—"}
          sub={`${stats?.planBreakdown?.starter ?? 0} Starter · ${stats?.planBreakdown?.premium ?? 0} Premium`}
        />
        <StatCard
          icon={Zap}
          label="Sessions Used"
          value={stats?.totalSessionsUsed ?? "—"}
          sub="All time"
        />
        <StatCard
          icon={Activity}
          label="Engagements"
          value={stats?.totalEngagements ?? "—"}
          sub="Total created"
        />
      </div>

      {/* Plan breakdown */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 flex-wrap">
              <PlanBadge
                label="Free (BYOK)"
                count={stats.planBreakdown.free}
                color="emerald"
                icon={Key}
              />
              <PlanBadge
                label="Starter (Cloud)"
                count={stats.planBreakdown.starter}
                color="blue"
                icon={Cloud}
              />
              <PlanBadge
                label="Premium"
                count={stats.planBreakdown.premium}
                color="amber"
                icon={Crown}
              />
              <PlanBadge
                label="No Plan"
                count={stats.planBreakdown.none}
                color="gray"
                icon={Users}
              />
            </div>
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <span>
                BYOK:{" "}
                <strong className="text-foreground">
                  {stats.modeBreakdown.byok}
                </strong>
              </span>
              <span>
                Cloud:{" "}
                <strong className="text-foreground">
                  {stats.modeBreakdown.cloud}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Managed AI Config ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="size-4 text-muted-foreground" />
            Managed AI Providers
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide API keys used for Cloud (managed) tier users. These
            are <em>not</em> visible to end users.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(["anthropic", "openai"] as const).map(provider => {
            const meta = PROVIDER_META[provider];
            const form = providerForms[provider];
            const isConfigured = !!platformConfig?.[provider]?.apiKey;

            return (
              <div key={provider} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center text-xs font-bold uppercase ${isConfigured ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-secondary text-muted-foreground"}`}
                    >
                      {meta.initial}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {meta.label}
                        {isConfigured && (
                          <Badge
                            variant="secondary"
                            className="ml-2 bg-green-500/15 text-green-600 dark:text-green-400 text-[10px]"
                          >
                            Active
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Default: {meta.defaultModel}
                      </p>
                    </div>
                  </div>
                  {isConfigured && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={form.removing}
                      onClick={() => handleRemove(provider)}
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

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">API Key *</Label>
                    <div className="relative">
                      <Input
                        type={form.showKey ? "text" : "password"}
                        placeholder={meta.keyPlaceholder}
                        value={form.apiKey}
                        onChange={e =>
                          updateForm(provider, { apiKey: e.target.value })
                        }
                        onFocus={() => {
                          if (form.apiKey === "••••••••••••••••")
                            updateForm(provider, { apiKey: "" });
                        }}
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          updateForm(provider, { showKey: !form.showKey })
                        }
                        tabIndex={-1}
                      >
                        {form.showKey ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
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
                        onChange={e =>
                          updateForm(provider, { model: e.target.value })
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
                        onChange={e =>
                          updateForm(provider, { baseUrl: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={
                      form.saving ||
                      !form.apiKey.trim() ||
                      form.apiKey === "••••••••••••••••"
                    }
                    onClick={() => handleSave(provider)}
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
        </CardContent>
      </Card>

      {/* ─── User Management ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            Users
            {users && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {users.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!users ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading users…
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">User</th>
                    <th className="pb-2 pr-4 font-medium">Plan</th>
                    <th className="pb-2 pr-4 font-medium">Mode</th>
                    <th className="pb-2 pr-4 font-medium">Sessions</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Joined</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr
                      key={u._id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-1.5">
                              {u.name || "—"}
                              {u.isAdmin && (
                                <ShieldCheck className="size-3.5 text-primary" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {u.email || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {u.plan ? (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] capitalize ${
                              u.plan === "premium"
                                ? "bg-amber-500/15 text-amber-600"
                                : u.plan === "starter"
                                  ? "bg-blue-500/15 text-blue-600"
                                  : "bg-emerald-500/15 text-emerald-600"
                            }`}
                          >
                            {u.plan}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs capitalize">
                        {u.mode || "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs font-mono">
                        {u.sessionsUsed}/{u.sessionsLimit}
                      </td>
                      <td className="py-3 pr-4">
                        {u.status ? (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              u.status === "active"
                                ? "bg-green-500/15 text-green-600"
                                : "bg-yellow-500/15 text-yellow-600"
                            }`}
                          >
                            {u.status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(u._creationTime).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        {editingUser === u._id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editSessionsUsed}
                              onChange={e =>
                                setEditSessionsUsed(Number(e.target.value))
                              }
                              className="w-16 h-7 text-xs"
                              min={0}
                            />
                            <span className="text-xs text-muted-foreground">
                              /
                            </span>
                            <Input
                              type="number"
                              value={editSessionsLimit}
                              onChange={e =>
                                setEditSessionsLimit(Number(e.target.value))
                              }
                              className="w-16 h-7 text-xs"
                              min={1}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveUserSessions(u._id)}
                              className="h-7 px-2"
                            >
                              <Check className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingUser(null)}
                              className="h-7 px-2"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleEditUser(
                                  u._id,
                                  u.sessionsUsed,
                                  u.sessionsLimit,
                                )
                              }
                              className="h-7 px-2 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResetSessions(u._id)}
                              className="h-7 px-2 text-xs"
                              disabled={u.sessionsUsed === 0}
                            >
                              Reset
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function PlanBadge({
  label,
  count,
  color,
  icon: Icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-600",
    blue: "bg-blue-500/15 text-blue-600",
    amber: "bg-amber-500/15 text-amber-600",
    gray: "bg-secondary text-muted-foreground",
  };
  return (
    <div className="flex items-center gap-2">
      <div
        className={`size-8 rounded-full flex items-center justify-center ${colorMap[color]}`}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
