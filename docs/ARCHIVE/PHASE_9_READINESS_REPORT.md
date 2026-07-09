# Phase 9 — Final Production Audit: Authentication System

**Date:** 2026-07-09
**Scope:** Email login/signup, Google login/signup, account linking, logout, session refresh, cookies, SSR, mobile, localhost, production, Docker, VPS, Cloudflare.
**Method:** Static code review of `backend/src/auth.ts`, `middleware/auth.ts`, `index.ts`, `config.ts`, `account/routes.ts`, the Better Auth 1.6.23 distribution, and the frontend auth client/context/pages. Plus `tsc` (backend) and `svelte-check` (frontend). No live DB / Google OAuth credentials were available, so runtime flows were traced from code, not exercised end-to-end.

---

## 1. Verification Matrix

| # | Test area | Result | Notes |
|---|-----------|--------|-------|
| 1 | Email login | ✅ Code OK / ⚠️ Email links broken | `signIn` → `/sign-in/email` works. Password-reset email link is mis-routed (see Issue A). |
| 2 | Email signup | ✅ OK | `signUp` → `/sign-up/email`, autoSignIn, verification email sent. Verification link mis-routed (Issue A/B). |
| 3 | Google login | ✅ OK (same-site only) | `sign-in/social` → callback → session cookie. Works only when frontend & backend share an eTLD+1 (Issue D). |
| 4 | Google signup | ✅ OK (same-site only) | Same as above; new account auto-created on first Google login. |
| 5 | Existing account linking | ✅ OK | `account.accountLinking.requireLocalEmailVerified:false`; Google↔credential linking works for matching emails. |
| 6 | Logout | ✅ OK | `signOut` → `/sign-out` clears backend cookie; `clearUser()`+`broadcast()` update UI across tabs. |
| 7 | Session refresh | ✅ OK | `updateAge:86400` sliding refresh; `cookieCache` (5 min); `expiresIn:30d`; `/update-session` available. |
| 8 | Cookies | ⚠️ SameSite=Lax (same-site only) | `httpOnly`, `secure` in prod, `sameSite:lax`. Cross-site deployments break auth (Issue D). |
| 9 | SSR | ⚠️ Minor | No SSR session hydration; account layout fires `checkSession()` at module top-level during SSR (Issue E). |
| 10 | Mobile | ✅ OK | Responsive pages; device fingerprinting; OAuth via top-level redirect works on mobile. |
| 11 | Localhost | ⚠️ Config gotcha | API port mismatch risk between `bun run` (3001) and frontend default `VITE_API_URL` (3009) (Issue I). |
| 12 | Production | ⚠️ Env-dependent | Correct only if `BETTER_AUTH_URL`/`FRONTEND_URL` are HTTPS + same-site; email links still broken (Issue A/F). |
| 13 | Docker | ⚠️ Env-dependent | Compose defaults `BETTER_AUTH_URL=http://localhost:3009` — must be overridden to HTTPS in prod (Issue F). |
| 14 | VPS | ⚠️ Env-dependent | Same as Docker; plus multi-replica caveats (Issue H). |
| 15 | Cloudflare | ⚠️ Env-dependent | Fine as TLS proxy if `BETTER_AUTH_URL` is the public HTTPS URL; avoid Flexible SSL (Issue F/G). |

---

## 2. Remaining Issues (ranked)

### 🔴 A. Email verification & password-reset links point to the backend, not the frontend (HIGH)
**Files:** `backend/src/auth.ts` (`sendResetPassword` L166-188, `sendVerificationEmail` L195-217); `frontend/src/routes/reset-password/+page.svelte`.

Better Auth builds the email link as `${BETTER_AUTH_URL}/api/auth/verify-email?token=…&callbackURL=%2F` and `${BETTER_AUTH_URL}/api/auth/reset-password?token=…`. These land on the **backend API origin**.
- Clicking the reset link hits the backend `/reset-password` endpoint (a POST-only, token-consuming endpoint), which does nothing useful on a GET and then redirects to `callbackURL` = `/` (the API root, returning JSON). The user **never reaches the frontend `/reset-password` form** that exists at `frontend/src/routes/reset-password/+page.svelte`.
- Clicking the verification link verifies the email, sets the session cookie on the backend domain, then redirects to `/` (API JSON root) instead of the frontend.

**Fix:** Rewrite the `url` inside both callbacks to the frontend origin before emailing:
```ts
const token = new URL(url).searchParams.get("token");
const frontendUrl = `${config.frontendUrl}/reset-password?token=${token}`;   // reset
const frontendVerify = `${config.frontendUrl}/login?verified=true`;          // verify
```
(Requires adding a frontend `/verify-email` landing or reusing `/login?verified=true`.)

### 🔴 B. No frontend `/verify-email` page (HIGH, related to A)
**Files:** `frontend/src/routes` (no `verify-email` route); `docs/BETTER_AUTH_IMPLEMENTATION.md` "Known Limitations" #5 flags this as future work — still unaddressed.

After email verification the user has no frontend destination. Add a `/verify-email` page (or use `/login?verified=true`) and point the email link there (Issue A).

### 🟠 C. `touchSession()` calls a non-existent endpoint (LOW)
**Files:** `frontend/src/lib/api/auth.ts` L179-181 calls `/touch_session`; Better Auth 1.6.23 exposes `/update-session`, not `/touch-session` (confirmed in `node_modules/better-auth/dist/api/index.d.mts`). The function is currently unused, so it is dead/latent code. Delete it or point it at `/update-session`.

### 🟠 D. `SameSite=Lax` cookies break cross-site deployments (MEDIUM, env-dependent)
**File:** `backend/src/auth.ts` L227-238 (`defaultCookieAttributes.sameSite:"lax"`).

The cookie is set on the **backend** origin (`BETTER_AUTH_URL`). The browser only sends `SameSite=Lax` cookies on **same-site** requests. This works for the declared production topology (`tarkify.qzz.io` ↔ `backend.tarkify.qzz.io`, same eTLD+1) and for localhost (port differences are same-site).
- It **breaks** whenever frontend and backend are on different eTLD+1s — e.g. a Vercel preview (`*.vercel.app`) talking to `backend.tarkify.qzz.io`. CORS returns 200 (cookies allowed by `credentials:true`) but the session cookie is never sent, so every user is effectively logged out.
- For any truly cross-site setup, cookies must be `sameSite:"none"; secure:true`.

**Action:** Confirm the production frontend is served from a subdomain of `tarkify.qzz.io` (it is, per `.env.production`). If Vercel preview auth is needed, either use a `*.tarkify.qzz.io` preview domain or switch to `sameSite:"none"`.

### 🟠 E. `checkSession()` invoked at component top-level during SSR (LOW)
**File:** `frontend/src/routes/account/+layout.svelte` L15-17 calls `authState.checkSession()` directly in `<script>` (runs on server + client). On the server this triggers a real `fetch` to `VITE_API_URL` with no user cookies, wasting a request and can error during prerender/SSR if the API is unreachable. `$effect`-based checks already cover the client. Recommend removing the top-level call and relying on the layout-level `$effect`.

### 🟠 F. `BETTER_AUTH_URL` must be the public HTTPS URL in every environment (MEDIUM, config)
**Files:** `backend/.env.example`, `docker-compose.yml` (defaults to `http://localhost:3009`).

`BETTER_AUTH_URL` is used to (a) build OAuth redirect URIs sent to Google and (b) decide secure cookies. Leaving it as `http://localhost:3009` in production causes Google "redirect_uri_mismatch" and insecure-cookie failures. The compose default must be overridden. Add this to the deployment checklist / CI guard.

### 🟠 G. Cloudflare Flexible SSL incompatibility (MEDIUM, config)
If Cloudflare terminates TLS with **Flexible** SSL (HTTPS browser→CF, HTTP CF→origin), the origin sees HTTP while the browser sees HTTPS. `secure` cookies still store (browser sees HTTPS) but `BETTER_AUTH_URL`/trusted-origins must still be the public HTTPS URL, and Better Auth's `useSecureCookies` is keyed on `NODE_ENV`, not the request scheme. **Use Cloudflare Full (Strict)** and keep `BETTER_AUTH_URL=https://…`.

### 🟡 H. In-memory rate limiting & per-device session dedup are per-instance (MEDIUM for scale-out)
**Files:** `backend/src/index.ts` (rate limiter), sign-in/sign-up device dedup (L117-214).

The 10 req/min auth limiter and the per-device session de-duplication (`DELETE … WHERE device_id=… AND token!=…`) live in process memory / per-instance DB logic. With multiple backend replicas behind a load balancer (VPS/Docker swarm), limits reset per instance and a user may get duplicate sessions across instances. Acceptable for a single instance; documented as a scaling limitation in `deployment-hardening-report.md`.

### 🟡 I. Localhost port mismatch (LOW, config)
**Files:** `frontend/.env.example` (`VITE_API_URL=http://localhost:3009`), `backend/.env.example` (dev `bun run` → `:3001`).

Running the backend with `bun run dev` (port 3001) while the frontend default points at `:3009` (docker port) means the frontend cannot reach the API unless `VITE_API_URL` is set. Use Docker for local dev (port 3009) or set `VITE_API_URL=http://localhost:3001`.

### 🟡 J. Backend `tsc --noEmit` fails (pre-existing, not auth-core)
`bun run tsc --noEmit` reports type errors in `account/routes.ts` and `routes/products.ts` (Hono `Context<BlankEnv>` vs `Context<AppEnv>` generic mismatch). These are **not** in `auth.ts`/`middleware/auth.ts`/`config.ts` and do not affect the running server (`bun run src/index.ts` does not typecheck). The auth-adjacent `/has-password` and `/set-password` routes are type-clean. Recommend fixing the Hono generics so CI typecheck is green. (Frontend `svelte-check` passes with **0 errors**.)

### 🟡 K. Google button always visible even when OAuth unconfigured (LOW)
**Files:** `frontend/src/routes/login`, `register` call `signInWithGoogle` unconditionally. If `GOOGLE_CLIENT_ID/SECRET` are absent, the click returns `provider_not_found` (handled gracefully) but the button shouldn't be offered. Gate the button on a `config.googleOAuthEnabled` flag exposed to the frontend.

---

## 3. What Is Solid (verified)
- Session middleware, `requireAuth`/`requireRole`, HTTP-only + secure cookies, 30-day expiry + 1-day sliding refresh, 5-min cookie cache.
- Generic login errors (no enumeration); forgot-password always returns success.
- CORS correctly echoes the matched origin with `credentials:true` (required for cookie auth) and allows `*.vercel.app` previews.
- Google error taxonomy (`OAUTH_ERROR_MESSAGES`) and `parseOAuthErrorFromParams` give clean user-facing messages on the login/register pages.
- Account linking, `set-password`/`has-password` for OAuth users, session listing/revocation, change-password, delete-account all wired correctly against Better Auth 1.6.23 endpoints (`/list-sessions`, `/revoke-session`, `/revoke-other-sessions`, `/set-password`).
- Docker: non-root user, `init:true`, `exec` entrypoint, healthcheck, migrations-before-serve, graceful shutdown — all production-grade.
- Frontend `svelte-check`: **0 errors / 0 warnings**.

---

## 4. Pre-Production Checklist
1. [ ] **Fix email link routing (A/B)** — point verification/reset emails at frontend pages; add `/verify-email` or reuse `/login?verified=true`.
2. [ ] Set `BETTER_AUTH_URL=https://backend.tarkify.qzz.io` and `FRONTEND_URL=https://tarkify.qzz.io` (HTTPS) in prod compose/VPS env (F).
3. [ ] Confirm frontend is served from a `*.tarkify.qzz.io` subdomain so `SameSite=Lax` cookies work (D); otherwise switch to `sameSite:"none"`.
4. [ ] Cloudflare set to **Full (Strict)** SSL (G).
5. [ ] Remove top-level `checkSession()` in `account/+layout.svelte` SSR path (E).
6. [ ] Delete/repoint `touchSession` (C).
7. [ ] Gate Google button on `googleOAuthEnabled` (K).
8. [ ] Green `tsc --noEmit` (fix Hono `Context` generics) (J).
9. [ ] Smoke test on a real device + a Vercel `*.vercel.app` preview to confirm cross-site behavior before declaring GA.

## 5. Readiness Verdict
**Conditional pass.** Core authentication logic (login, signup, Google OAuth, linking, logout, session lifecycle, cookies, security middleware, Docker deployment) is sound and the frontend typechecks cleanly. **Two HIGH-severity gaps must be fixed before launch**: the email verification/password-reset links are routed to the backend API instead of the frontend (A/B), which breaks the self-service email flows. The remaining items are configuration guardrails (HTTPS URLs, same-site topology, Cloudflare SSL) and minor code hygiene.
