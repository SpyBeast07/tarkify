import { z } from "zod";
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import crypto from "crypto";
import { config } from "./config.js";
import * as userRepository from "./users/repository.js";
import { linkPurchasesToUserByEmail } from "./purchase-linking/service.js";
import * as auditService from "./audit/service.js";
import { emailService } from "./email/index.js";
import { EmailProviderError, EmailConfigurationError } from "./email/errors.js";
import { APIError } from "better-auth";
import { pool } from "./db.js";

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

let authInstance: any;

export function initAuth() {
  if (authInstance) return authInstance as ReturnType<typeof betterAuth>;

  console.info("Initializing Better Auth...");

  authInstance = betterAuth({
    database: new Pool({
      connectionString: config.database.url,
    }),
    secret: config.auth.secret,
    baseURL: config.auth.url,
    trustedOrigins: [
      config.frontendUrl,
    ],

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
      additionalFields: {
        device_id: { type: "string", required: false },
        device_name: { type: "string", required: false },
        device_type: { type: "string", required: false },
        browser: { type: "string", required: false },
        os: { type: "string", required: false },
        last_seen: { type: "string", required: false },
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
      accountLinking: {
        requireLocalEmailVerified: false,
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
        try {
          await emailService.sendPasswordResetEmail({
            email: user.email,
            resetUrl: url,
            userName: user.name ?? undefined,
          });
        } catch (error) {
          console.error('[auth] sendResetPassword failed:', error);
          let statusText: string = 'INTERNAL_SERVER_ERROR';
          let message = 'Unable to send reset email. Please try again in a few minutes.';
          if (error instanceof EmailProviderError) {
            const sc = error.statusCode;
            if (sc === 429) { statusText = 'TOO_MANY_REQUESTS'; message = 'Too many email requests. Please wait before trying again.'; }
            else if (sc === 422) { statusText = 'UNPROCESSABLE_ENTITY'; message = 'Email service is temporarily unavailable.'; }
            else if (sc === 408) { statusText = 'REQUEST_TIMEOUT'; message = 'Email service timed out. Please try again.'; }
            else if (sc === 404) { message = 'Email service is temporarily unavailable.'; }
          } else if (error instanceof EmailConfigurationError) {
            message = 'Email service is temporarily unavailable.';
          }
          throw new APIError(statusText as any, { message, code: 'EMAIL_FAILED' });
        }
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 86400,
      sendVerificationEmail: async ({ user, url }) => {
        try {
          const token = new URL(url).searchParams.get('token');
          const verificationUrl = `${config.frontendUrl}/verify-email?token=${encodeURIComponent(token ?? '')}`;
          await emailService.sendVerificationEmail({
            email: user.email,
            verificationUrl,
            userName: user.name ?? undefined,
          });
        } catch (error) {
          console.error('[auth] sendVerificationEmail failed:', error);
          let statusText: string = 'INTERNAL_SERVER_ERROR';
          let message = 'Unable to send verification email. Please try again in a few minutes.';
          if (error instanceof EmailProviderError) {
            const sc = error.statusCode;
            if (sc === 429) { statusText = 'TOO_MANY_REQUESTS'; message = 'Too many email requests. Please wait before trying again.'; }
            else if (sc === 422) { statusText = 'UNPROCESSABLE_ENTITY'; message = 'Email service is temporarily unavailable.'; }
            else if (sc === 408) { statusText = 'REQUEST_TIMEOUT'; message = 'Email service timed out. Please try again.'; }
            else if (sc === 404) { message = 'Email service is temporarily unavailable.'; }
          } else if (error instanceof EmailConfigurationError) {
            message = 'Email service is temporarily unavailable.';
          }
          throw new APIError(statusText as any, { message, code: 'EMAIL_FAILED' });
        }
      },
    },

    socialProviders: {
      google: {
        clientId: config.auth.googleClientId ?? "",
        clientSecret: config.auth.googleClientSecret ?? "",
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
        update: {
          after: async (session) => {
            try {
              await pool.query('UPDATE session SET last_seen = NOW() WHERE id = $1', [session.id]);
            } catch (err) {
              console.error("Failed to update last_seen:", err);
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
              if (a.providerId === "credential") {
                await auditService.recordAccountCreated(a.userId, undefined, undefined, { provider: "email" });
              } else {
                await auditService.recordAccountCreated(a.userId, undefined, undefined, { provider: a.providerId });
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

  return authInstance;
}

export function getAuth(): ReturnType<typeof betterAuth> {
  if (!authInstance) {
    throw new Error("Better Auth not initialized. Call initAuth() during startup.");
  }
  return authInstance!;
}
