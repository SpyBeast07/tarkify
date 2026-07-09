# Security

> **Scope**: Auth, authorization, cookies, sessions, OAuth, CSP, CSRF, rate limiting, headers, input validation, audit logs, secrets, env vars, deployment security, future hardening.
> **Related**: `ARCHITECTURE.md#authentication--authorization`, `API_REFERENCE.md`, `DEPLOYMENT.md`, `EMAIL_SYSTEM.md`.

---

## 1. Authentication

- **Better Auth** owns identity: register, login, sessions, email verification, password reset, OAuth.
- **Password hashing**: bcrypt / argon2 (Better Auth default). Application never sees plaintext.
- **Session cookie**: `HttpOnly`, `Secure` (prod), `SameSite=Lax`, prefix `tarkify`.
- **Lifetime**: 7-day default; 30-day with "Remember me"; 1-day sliding refresh (`updateAge`); 5-minute cookie cache.
- **Email verification** required before guest purchase linking.
- **No user enumeration**: login returns generic errors; forgot-password always returns success.

---

## 2. Authorization

- Roles in `users.role` (TEXT, CHECK): `customer`, `admin`, `super_admin`.
- Middleware: `requireAuth` (any session), `requireCustomer`, `requireAdmin`, `requireSuperAdmin`, `requireRole(...)`.
- Route matrix: `/api/account/*` any authenticated; `/api/admin/*` admin/super-admin; settings/admins super-admin only.

---

## 3. RBAC

- Coarse roles, no granular permission tables (sufficient at current scale).
- Extensible later via a `role_permissions` table without touching business tables.
- Admin Portal plan: `ADMIN_PORTAL_ARCHITECTURE.md#rbac`.

---

## 4. Cookies

| Attribute | Value |
|-----------|-------|
| `HttpOnly` | true (not JS-accessible) |
| `Secure` | true in production |
| `SameSite` | `Lax` (allows OAuth/same-site redirects) |
| Prefix | `tarkify` |
| Path | default (all routes) |

Cross-site deployments require `SameSite=None; Secure` — confirm frontend/backend share an eTLD+1.

---

## 5. Sessions

- DB-backed `session` table.
- Revocation: `revoke-session`, `revoke-other-sessions`.
- `last_login_at` updated on session create; `last_activity_at` on `/users/touch`.
- Delete account supported (`/users/delete-account`).

---

## 6. OAuth

- Google OAuth **implemented** (migration `016_add_oauth_support.sql`, `socialProviders`).
- **Disabled by default**: login/register OAuth buttons gated on `googleOAuthEnabled` (true only when both `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` set).
- Account linking for matching emails supported.
- Partial OAuth config (one of id/secret) **throws** at startup.

---

## 7. CSP

Comprehensive `Content-Security-Policy`:
- Allows Razorpay Checkout scripts/frames, Google Fonts, self-origin assets.
- Blocks `object`/`plugin` execution.
- `frame-ancestors 'none'`.
- Violations reported to `POST /api/csp-report`.

---

## 8. CSRF

- Better Auth issues `csrf_token` cookie + expects `X-CSRF-Token` header.
- CORS uses `credentials: true` and echoes only whitelisted origins; Vercel preview patterns allowed.
- `SameSite=Lax` cookies mitigate cross-site request forgery for same-site deployments.

---

## 9. Rate Limiting

- **In-memory IP-based sliding window** (no external store).
- Limits: auth 10/min, payments 30/min, downloads 60/min, contact 10/min, feedback 20/min, newsletter 30/min, careers 10/min.
- `X-RateLimit-Limit` headers; `429` after threshold.
- **Limitation**: resets on restart, per-instance — not safe for multi-replica scale-out (use Redis when scaling).

---

## 10. Headers

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | set (prod) |
| `Referrer-Policy` | set |
| `Permissions-Policy` | set |
| `Content-Security-Policy` | comprehensive |
| `X-Request-Id` | UUID per response |

---

## 11. Input Validation

- **Parameterized SQL** everywhere (`$1`, `$2`, …); no string concatenation.
- **Validation**: Zod schemas; email (lowercase+trimmed, alphabetic TLD), phone (digits + allowed chars, 7–20), URL (`http(s)://`, ≤2048), explicit per-field length limits.
- **Sanitization** (before storage): `<script>` blocks, event-handler attributes, remaining HTML tags, `javascript:` protocol, C0 + C1 control chars stripped. Order: script → handlers → tags → protocol → controls.
- **Body size limit**: 100KB via `Content-Length` + raw-body clone (chunked encoding).
- **Malformed JSON**: `400 BAD_REQUEST`, never `500`.

---

## 12. Audit Logs

- `audit_logs` table records `account_created`, `login`, `logout`, and other account events via `src/audit/`.
- Every response carries a `X-Request-Id` UUID for traceability.
- **PII is never logged** (emails, messages, phone omitted).

---

## 13. Secrets

- **Startup validation** (`src/config.ts`): fails fast on missing required vars; production guardrails enforce `https://` URLs, `RESEND_API_KEY` presence, and `BETTER_AUTH_SECRET` ≥ 32 chars.
- **OAuth**: requires both Google id+secret or neither.
- **No secrets in code**; `.env.example` uses placeholders.
- **Live payment keys**: historical reports flagged live Razorpay keys in `.env` — rotate to production-approved values before public launch.
- **DB credentials**: supplied via compose variable substitution, not hardcoded.

---

## 14. Environment Variables

| Group | Required | Notes |
|-------|----------|-------|
| `NODE_ENV` | Optional (default `production`) | `development` for local. |
| `DATABASE_URL` | **Required** | PostgreSQL connection. |
| `BETTER_AUTH_SECRET` | **Required** | ≥32 chars. |
| `BETTER_AUTH_URL` | **Required** | `https://` in prod; used for OAuth + email links. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional (pair) | Enables OAuth. |
| `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` | **Required** | Payments + webhook HMAC. |
| `RESEND_API_KEY` | Prod only | `re_...`. |
| `FROM_EMAIL` / `REPLY_TO_EMAIL` | Optional | Verified domain in prod. |
| `ADMIN_EMAIL` | **Required** | Admin notifications. |
| `FRONTEND_URL` | Optional | `https://` in prod; CORS + redirects. |
| `PORT` / `STORAGE_PATH` / `DOWNLOAD_TOKEN_TTL_SECONDS` | Optional | Defaults 3001 / `./storage` / 600. |

See `DEPLOYMENT.md#environment-variables` and `PROJECT_STATUS.md#current-authentication-model`.

---

## 15. Deployment Security

- Backend container runs as **non-root `appuser`**.
- Docker `init: true` + `exec` entrypoint for signal propagation.
- Postgres port `expose`d only (not published to host).
- Logs rotated (json-file, 10MB × 3).
- Cloudflare **Full (Strict)** SSL; avoid Flexible (origin sees HTTP).
- Same-site subdomains so `SameSite=Lax` cookies work.
- Migrations fail fast on error; `_migrations` prevents duplicates.

---

## 16. Future Hardening

- **Redis** shared rate limiting + session dedup for multi-replica.
- **MFA** (two-factor) for sensitive accounts.
- **CAPTCHA** on public forms (validation hooks already return `ValidationResult`).
- **Continuous CSP tuning** from violation reports.
- **Secrets manager** (e.g. Vault) instead of compose env for production.
- **Connection pool monitoring** + compound indexes for scale.
- **Admin action audit** expansion (every admin mutation → `audit_logs`).

---

*For the auth boundary and request flow, see `ARCHITECTURE.md`. For endpoint auth requirements, see `API_REFERENCE.md`.*
