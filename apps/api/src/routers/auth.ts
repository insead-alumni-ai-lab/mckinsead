import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import { prisma } from "../lib/prisma";
import { randomUUID } from "crypto";

/**
 * Auth router — Multi-tenant + SSO (M1 §15).
 *
 * Supports: email/password (dev), Google OAuth, Azure AD, Okta.
 * Sessions are token-based, stored in DB.
 */
export const authRouter = router({
  /** Register a new tenant + first admin user */
  register: publicProcedure
    .input(
      z.object({
        tenantName: z.string().min(1),
        tenantSlug: z.string().regex(/^[a-z0-9-]+$/),
        email: z.string().email(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const tenant = await prisma.tenant.create({
        data: {
          name: input.tenantName,
          slug: input.tenantSlug,
        },
      });

      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: input.email,
          name: input.name,
          role: "owner",
        },
      });

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          token: randomUUID(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      return {
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token: session.token,
      };
    }),

  /** Login with email (dev mode — SSO handled via callbacks) */
  login: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { slug: input.tenantSlug },
      });

      const user = await prisma.user.findUniqueOrThrow({
        where: { tenantId_email: { tenantId: tenant.id, email: input.email } },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          token: randomUUID(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token: session.token,
      };
    }),

  /** SSO callback — upsert user from SSO provider claims */
  ssoCallback: publicProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        provider: z.enum(["google", "azure_ad", "okta"]),
        email: z.string().email(),
        name: z.string(),
        ssoSubject: z.string(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { slug: input.tenantSlug },
      });

      // Verify tenant SSO provider matches
      if (tenant.ssoProvider !== input.provider) {
        throw new Error(`Tenant ${input.tenantSlug} uses ${tenant.ssoProvider}, not ${input.provider}`);
      }

      // Upsert user
      const user = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: input.email } },
        update: {
          name: input.name,
          ssoSubject: input.ssoSubject,
          avatarUrl: input.avatarUrl,
          lastLogin: new Date(),
        },
        create: {
          tenantId: tenant.id,
          email: input.email,
          name: input.name,
          role: "analyst",
          ssoSubject: input.ssoSubject,
          avatarUrl: input.avatarUrl,
          lastLogin: new Date(),
        },
      });

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          token: randomUUID(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token: session.token,
      };
    }),

  /** Validate session token */
  me: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const session = await prisma.session.findUnique({
        where: { token: input.token },
        include: { user: true, tenant: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          avatarUrl: session.user.avatarUrl,
        },
        tenant: {
          id: session.tenant.id,
          name: session.tenant.name,
          slug: session.tenant.slug,
        },
      };
    }),

  /** Logout */
  logout: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.session.deleteMany({ where: { token: input.token } });
      return { success: true };
    }),

  /** Invite user to tenant */
  invite: publicProcedure
    .input(
      z.object({
        tenantId: z.string().uuid(),
        email: z.string().email(),
        name: z.string(),
        role: z.enum(["admin", "analyst", "viewer"]),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.create({
        data: {
          tenantId: input.tenantId,
          email: input.email,
          name: input.name,
          role: input.role,
        },
      });

      return { id: user.id, email: user.email, role: user.role };
    }),

  /** List tenant users */
  listUsers: publicProcedure
    .input(z.object({ tenantId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.user.findMany({
        where: { tenantId: input.tenantId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          lastLogin: true,
          createdAt: true,
        },
      });
    }),
});
