import type { Context, Next } from "hono";
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

  const betterUser = session.user as Record<string, unknown>;
  const userId = betterUser.id as string;

  let tarkifyUser = null;
  try {
    tarkifyUser = await userRepository.getUserById(userId);
  } catch {
    // Non-critical: proceed with just Better Auth data
  }

  const mergedUser: AuthUser = {
    id: userId,
    name: (betterUser.name as string) ?? "",
    email: betterUser.email as string,
    emailVerified: betterUser.email_verified as boolean ?? false,
    image: (betterUser.image as string | null) ?? null,
    createdAt: betterUser.created_at as Date,
    updatedAt: betterUser.updated_at as Date,
    role: tarkifyUser?.role ?? (betterUser.role as string ?? "customer"),
    displayName: tarkifyUser?.display_name ?? null,
    timezone: tarkifyUser?.timezone ?? "UTC",
    accountStatus: tarkifyUser?.account_status ?? "ACTIVE",
    lastLoginAt: tarkifyUser?.last_login_at ?? null,
    lastActivityAt: tarkifyUser?.last_activity_at ?? null,
  };

  c.set("user", mergedUser);
  c.set("session", session.session as AuthSession);
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
