import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { config } from "./config.js";
import * as userRepository from "./users/repository.js";
import { linkPurchasesToUserByEmail } from "./purchase-linking/service.js";

export const auth = betterAuth({
  database: new Pool({
    connectionString: config.database.url,
  }),

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
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    expiresIn: 604800,
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
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 86400,
  },

  advanced: {
    useSecureCookies: config.nodeEnv === "production",
    cookiePrefix: "tarkify",
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: config.nodeEnv === "production",
      httpOnly: true,
    },
  },

  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          try {
            const u = user as Record<string, unknown>;
            const isVerified = Boolean(u.emailVerified ?? u.email_verified ?? false);
            if (isVerified) {
              const uid = (u.id ?? u.userId) as string;
              const email = u.email as string;
              if (uid && email) {
                const result = await linkPurchasesToUserByEmail(uid, email);
                if (result.purchasesLinked > 0 || result.entitlementsLinked > 0) {
                  console.info(
                    `Linked ${result.purchasesLinked} purchase(s) and ${result.entitlementsLinked} entitlement(s) to user ${uid}`
                  );
                }
              }
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
          } catch (err) {
            console.error("Failed to update last_login_at:", err);
          }
        },
      },
    },
  },
});
