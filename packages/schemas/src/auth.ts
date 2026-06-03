import { z } from "zod";

/**
 * Multi-tenant + SSO schemas (M1 §15).
 */

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  sso_provider: z.enum(["google", "azure_ad", "okta", "none"]).default("none"),
  sso_config: z.record(z.string()).optional(),
  created_at: z.string().datetime(),
});

export const UserRoleSchema = z.enum(["owner", "admin", "analyst", "viewer"]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  avatar_url: z.string().url().optional(),
  sso_subject: z.string().optional(),
  last_login: z.string().datetime().optional(),
  created_at: z.string().datetime(),
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export type Tenant = z.infer<typeof TenantSchema>;
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
