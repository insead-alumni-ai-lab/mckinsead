import { initTRPC } from "@trpc/server";
import superjson from "superjson";

/**
 * tRPC initialization for mckinsead API.
 * M0: No auth context — single tenant.
 */

export const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
