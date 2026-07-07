import { z } from "zod";
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import crypto from "crypto";
import { config } from "./config.js";
import * as userRepository from "./users/repository.js";
import { linkPurchasesToUserByEmail } from "./purchase-linking/service.js";
import * as auditService from "./audit/service.js";
import * as emailService from "./email/service.js";

const userHookSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  email: z.string().optional(),
  emailVerified: z.union([z.boolean(), z.string()]).optional(),
  email_verified: z.union([z.boolean(), z.string()]).optional(),
}).passthrough();

const sessionHookSchema = z.object({
  id: z.string().optional(),
  token: z.string().optional(),
  ipAddress: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
}).passthrough();

const accountHookSchema = z.object({
  password: z.string().nullable().optional(),
}).passthrough();

const accountCreateHookSchema = z.object({
  userId: z.string(),
  providerId: z.string(),
}).passthrough();

export const auth = betterAuth({
  database: new Pool({
    connectionString: config.database.url,
  }),
  secret: config.auth.secret,
  baseURL: config.auth.url,
  trustedOrigins: [config.frontendUrl],

  user: {
    modelName: "users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      display_name: {
        type: "string",
        required: false,
        input: false,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "UTC",
        input: false,
      },
      preferences: {
        type: "string",
        required: false,
        defaultValue: "{}",
        input: false,
      },
      account_status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
        input: false,
      },
      last_login_at: {
        type: "string",
        required: false,
        input: false,
      },
      last_activity_at: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  session: {
    modelName: "session",
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    expiresIn: 2592000,
    updateAge: 86400,
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },

  account: {
    modelName: "account",
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      idToken: "id_token",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  verification: {
    modelName: "verification",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await emailService.send({
        to: user.email,
        subject: "Reset your Tarkify password",
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 86400,
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.send({
        to: user.email,
        subject: "Verify your Tarkify email",
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
      });
    },
  },

  advanced: {
    useSecureCookies: config.nodeEnv === "production",
    cookiePrefix: "tarkify",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: config.nodeEnv === "production",
      httpOnly: true,
    },
    database: {
      /**
       * Generate UUID v4 strings for all Better Auth tables.
       * The users.id column is UUID (not TEXT), so we must produce
       * UUID-format strings that PostgreSQL will accept for the UUID column
       * and all FK references (session.user_id, account.user_id).
       */
      generateId: () => crypto.randomUUID(),
    },
  },

  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          try {
            const u = userHookSchema.parse(user);
            const isVerified = Boolean(u.emailVerified ?? u.email_verified ?? false);
            const uid = u.id ?? u.userId;
            const email = u.email;
            if (isVerified && uid && email) {
              const result = await linkPurchasesToUserByEmail(uid, email);
              if (result.purchasesLinked > 0 || result.entitlementsLinked > 0) {
                console.info(
                  `Linked ${result.purchasesLinked} purchase(s) and ${result.entitlementsLinked} entitlement(s) to user ${uid}`
                );
              }
              await auditService.recordEmailVerified(uid, undefined, undefined, { email });
            }
          } catch (err) {
            console.error("Failed to link guest purchases after email verification:", err);
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          try {
            await userRepository.updateLastLogin(session.userId);
            const s = sessionHookSchema.parse(session);
            await auditService.recordLogin(
              session.userId,
              s.ipAddress ?? s.ip_address ?? undefined,
              s.userAgent ?? s.user_agent ?? undefined,
            );
          } catch (err) {
            console.error("Failed to update last_login_at:", err);
          }
        },
      },
      delete: {
        after: async (session) => {
          try {
            const s = sessionHookSchema.parse(session);
            await auditService.recordSessionRevoked(
              session.userId,
              s.ipAddress ?? s.ip_address ?? undefined,
              s.userAgent ?? s.user_agent ?? undefined,
              { session_id: s.id ?? s.token?.substring(0, 8) },
            );
          } catch (err) {
            console.error("Failed to record session revocation audit:", err);
          }
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          try {
            const a = accountCreateHookSchema.parse(account);
            // "credential" is the providerId Better Auth uses for
            // built-in email/password accounts (confirmed in
            // better-auth/dist/api/routes/sign-up.mjs:237, v1.6.23).
            // OAuth providers (Google, GitHub, etc.) use their own
            // providerId and are intentionally excluded here — account
            // creation through OAuth linking is not a registration.
            if (a.providerId === "credential") {
              await auditService.recordAccountCreated(a.userId);
            }
          } catch (err) {
            console.error("Failed to record account creation audit:", err);
          }
        },
      },
      update: {
        after: async (account) => {
          try {
            const a = accountHookSchema.parse(account);
            if (a.password) {
              await auditService.recordPasswordChanged(account.userId);
            }
          } catch (err) {
            console.error("Failed to record password change audit:", err);
          }
        },
      },
    },
  },
});
