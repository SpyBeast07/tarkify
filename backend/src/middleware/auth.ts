import type { Context, Next } from "hono";
import { z } from "zod";
import { auth } from "../auth.js";
import * as userRepository from "../users/repository.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  displayName: string | null;
  timezone: string | null;
  accountStatus: string;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
};

export type AuthSession = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser | null;
    session: AuthSession | null;
  }
}

const betterAuthUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional().default(""),
  email: z.string(),
  email_verified: z.union([z.boolean(), z.string()]).optional().default(false),
  image: z.string().nullable().optional().default(null),
  created_at: z.union([z.string(), z.date()]).optional(),
  updated_at: z.union([z.string(), z.date()]).optional(),
  role: z.string().optional().default("customer"),
}).passthrough();

const authSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullable().default(null),
  userAgent: z.string().nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
}).passthrough();

export async function sessionMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  const parsedUser = betterAuthUserSchema.safeParse(session.user);
  if (!parsedUser.success) {
    console.error("Failed to parse Better Auth user data:", parsedUser.error);
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  const betterUser = parsedUser.data;
  const userId = betterUser.id;

  let tarkifyUser = null;
  try {
    tarkifyUser = await userRepository.getUserById(userId);
  } catch {
    // Non-critical: proceed with just Better Auth data
  }

  const mergedUser: AuthUser = {
    id: userId,
    name: betterUser.name ?? "",
    email: betterUser.email,
    emailVerified: Boolean(betterUser.email_verified),
    image: betterUser.image ?? null,
    createdAt: betterUser.created_at instanceof Date ? betterUser.created_at : new Date(betterUser.created_at ?? Date.now()),
    updatedAt: betterUser.updated_at instanceof Date ? betterUser.updated_at : new Date(betterUser.updated_at ?? Date.now()),
    role: tarkifyUser?.role ?? betterUser.role,
    displayName: tarkifyUser?.display_name ?? null,
    timezone: tarkifyUser?.timezone ?? "UTC",
    accountStatus: tarkifyUser?.account_status ?? "ACTIVE",
    lastLoginAt: tarkifyUser?.last_login_at ?? null,
    lastActivityAt: tarkifyUser?.last_activity_at ?? null,
  };

  c.set("user", mergedUser);

  const parsedSession = authSessionSchema.safeParse(session.session);
  if (!parsedSession.success) {
    console.error("Failed to parse Better Auth session data:", parsedSession.error);
    c.set("session", null);
    await next();
    return;
  }
  c.set("session", parsedSession.data);
  await next();
}

export async function requireAuth(c: Context, next: Next) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "UNAUTHORIZED", message: "Authentication required" }, 401);
  }
  await next();
}

export function requireRole(...roles: string[]) {
  return async function roleMiddleware(c: Context, next: Next) {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "UNAUTHORIZED", message: "Authentication required" }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: "FORBIDDEN", message: "Insufficient permissions" }, 403);
    }
    await next();
  };
}
