/**
 * Audit trail & engagement versioning.
 */
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Audit Log ────────────────────────────────────────────────────────

/** Log an action (internal — called from other mutations). */
export const logAction = internalMutation({
  args: {
    userId: v.id("users"),
    engagementId: v.optional(v.id("engagements")),
    action: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLog", {
      userId: args.userId,
      engagementId: args.engagementId,
      action: args.action,
      details: args.details,
      timestamp: Date.now(),
    });
  },
});

/** Get audit trail for an engagement. */
export const listByEngagement = query({
  args: { engagementId: v.id("engagements") },
  handler: async (ctx, { engagementId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", engagementId))
      .collect();
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  },
});

/** Get recent activity for the current user. */
export const recentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit ?? 20);
  },
});

// ─── Engagement Versions ──────────────────────────────────────────────

/** Save a version snapshot of the current engagement state. */
export const saveVersion = mutation({
  args: {
    engagementId: v.id("engagements"),
    label: v.optional(v.string()),
  },
  handler: async (ctx, { engagementId, label }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(engagementId);
    if (!eng || eng.userId !== userId) throw new Error("Not found");

    // Get framework data
    const frameworks = await ctx.db
      .query("frameworkData")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", engagementId))
      .collect();

    // Count existing versions
    const existing = await ctx.db
      .query("engagementVersions")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", engagementId))
      .collect();

    const snapshot = JSON.stringify({
      engagement: {
        company: eng.company,
        industry: eng.industry,
        question: eng.question,
        stage: eng.stage,
        progress: eng.progress,
        scopingData: eng.scopingData,
        hypothesisData: eng.hypothesisData,
        synthesisData: eng.synthesisData,
        communicationData: eng.communicationData,
        gatesApproved: eng.gatesApproved,
      },
      frameworks: frameworks.map((f) => ({
        framework: f.framework,
        data: f.data,
        status: f.status,
      })),
    });

    await ctx.db.insert("engagementVersions", {
      engagementId,
      userId,
      version: existing.length + 1,
      label: label || `Version ${existing.length + 1}`,
      snapshot,
      createdAt: Date.now(),
    });

    const versionNum = existing.length + 1;

    // ── Gamification (#1): Award XP for saving a version ──
    await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
      userId,
      amount: 5,
      reason: `Saved version ${versionNum}`,
    });

    // Award version_tracker badge after 3+ versions
    if (versionNum >= 3) {
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardBadge, {
        userId,
        badgeId: "version_tracker",
      });
    }

    return { version: versionNum };
  },
});

/** List all versions for an engagement. */
export const listVersions = query({
  args: { engagementId: v.id("engagements") },
  handler: async (ctx, { engagementId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const versions = await ctx.db
      .query("engagementVersions")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", engagementId))
      .collect();
    return versions.sort((a, b) => b.version - a.version).map((v) => ({
      _id: v._id,
      version: v.version,
      label: v.label,
      createdAt: v.createdAt,
    }));
  },
});

/** Restore a specific version. */
export const restoreVersion = mutation({
  args: {
    engagementId: v.id("engagements"),
    versionId: v.id("engagementVersions"),
  },
  handler: async (ctx, { engagementId, versionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const eng = await ctx.db.get(engagementId);
    if (!eng || eng.userId !== userId) throw new Error("Not found");

    const version = await ctx.db.get(versionId);
    if (!version || version.engagementId !== engagementId) throw new Error("Version not found");

    const snap = JSON.parse(version.snapshot);

    // Restore engagement fields
    await ctx.db.patch(engagementId, {
      stage: snap.engagement.stage,
      progress: snap.engagement.progress,
      scopingData: snap.engagement.scopingData,
      hypothesisData: snap.engagement.hypothesisData,
      synthesisData: snap.engagement.synthesisData,
      communicationData: snap.engagement.communicationData,
      gatesApproved: snap.engagement.gatesApproved,
    });

    // Restore framework data
    const currentFrameworks = await ctx.db
      .query("frameworkData")
      .withIndex("by_engagementId", (q) => q.eq("engagementId", engagementId))
      .collect();

    for (const fw of snap.frameworks) {
      const existing = currentFrameworks.find((f) => f.framework === fw.framework);
      if (existing) {
        await ctx.db.patch(existing._id, {
          data: fw.data,
          status: fw.status,
        });
      }
    }

    return { success: true };
  },
});
