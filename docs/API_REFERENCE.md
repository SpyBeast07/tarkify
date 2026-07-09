# API Reference

> **Scope**: Every backend endpoint, grouped by module.
> **Base**: `/api` (full URL = `BETTER_AUTH_URL`/`FRONTEND_URL` per context).
> **Auth note**: `requireAuth` → 401 if no session; `requireRole` → 403 if insufficient.
> **Errors**: all return `{ error, message, requestId }` (requestId in `X-Request-Id`).

---

## 1. Authentication (`/api/auth/*`)

Mounted directly to Better Auth (`app.on(['POST','GET'], '/api/auth/*', …)`).

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/sign-up/email` | POST | Public | Register (auto-login) |
| `/sign-in/email` | POST | Public | Login (rememberMe → 30d) |
| `/sign-out` | POST | Session | Logout (clears DB session + cookie) |
| `/forget-password` | POST | Public | Request reset (always 200) |
| `/reset-password` | POST | Public (token) | Reset password |
| `/verify-email` | GET | Public (token) | Email verification (triggers linking) |
| `/get-session` | GET | Session | Current `{ user, session }` |
| `/update-session` | POST | Session | Refresh session |
| `/list-sessions` | GET | Session | List user sessions |
| `/revoke-session` | POST | Session | Revoke one session |
| `/revoke-other-sessions` | POST | Session | Revoke all others |
| `/set-password` | POST | Session (OAuth) | Set password for OAuth users |
| `/has-password` | GET | Session | Password presence check |
| `/sign-in/social` | POST | Public | Google OAuth (when enabled) |

**Request (sign-up/email)**: `{ name, email, password }`.
**Request (sign-in/email)**: `{ email, password, rememberMe? }`.
**Errors**: `401` invalid credentials, `422` validation, `429` rate-limited (auth: 10/min).

---

## 2. Customer / Account (`/api/account/*`)

All require a valid session. Client: `src/lib/api/account.ts`.

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/dashboard` | GET | Auth | Summary: counts, recent activity, status, memberSince |
| `/purchases` | GET | Auth | Paginated purchases (`?page=1&limit=20`, max 100) |
| `/purchases/:id` | GET | Auth | Single purchase (404 if not owned) |
| `/downloads` | GET | Auth | Entitlements with download status |
| `/downloads/:purchaseId` | POST | Auth | Generate/reuse download token |
| `/billing` | GET | Auth | Paginated paid/refunded payments |
| `/profile` | GET/PUT | Auth | Alias → `/users/me` |
| `/preferences` | GET/PUT | Auth | Alias → `/users/preferences` |

**Data ownership**: every query filtered by `c.get('user').id`; 404 (not 403) for not-owned resources.

**Errors**: `401 UNAUTHORIZED`, `403 FORBIDDEN` (e.g. purchase not paid), `404 NOT_FOUND`, `400 BAD_REQUEST`.

---

## 3. Users (`/api/users/*`)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/me` | GET | Auth | Full profile (identity + business merged) |
| `/me` | PUT | Auth | Update `displayName`, `timezone` |
| `/preferences` | GET | Auth | Get `preferences` JSONB |
| `/preferences` | PUT | Auth | Update `preferences` |
| `/touch` | GET | Auth | Update `last_activity_at` |
| `/delete-account` | POST | Auth | Delete account |

---

## 4. Products

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/products` | GET | Public | Active products |
| `/products/:slug` | GET | Public | Product by slug (404 if inactive) |

Price is always read from the DB (`getPrice()`); never trusted from the client.

---

## 5. Payments (`/api/payments/*`)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/create-order` | POST | Public (guest email or session) | Create Razorpay order |
| `/verify` | POST | Public | Verify signature, grant entitlement, issue token |

**Request (create-order)**: `{ productSlug, email }`.
- If email matches an existing user → `user_id` set; else `guest_email`.
- Duplicate ownership → `409 ALREADY_PURCHASED` (atomic `INSERT ... WHERE NOT EXISTS` + partial unique index).

**Request (verify)**: `{ order_id, payment_id, signature }`.
- HMAC verified with `timingSafeEqual`.
- On success: `UPDATE` purchase → paid, `INSERT` entitlement, issue `download_token`.
- Returns `downloadToken`, `downloadTokenExpiresAt`, `downloadTokenTtlSeconds`.

**Rate limit**: 30/min. **Errors**: `400 VERIFICATION_FAILED`, `409 ALREADY_PURCHASED`, `429`.

---

## 6. Downloads (token-authorized)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/downloads/:productSlug` | GET | Token in `?token=` | Stream product file |

- Validates token expiry + product match.
- `download_key` resolved from DB → no path traversal.
- **Errors**: `401 UNAUTHORIZED` (missing/expired/invalid token), `404` (missing file/product).

---

## 7. Communication (`/api/*`)

All public, rate-limited, sanitized, and validated. See `ARCHITECTURE.md#communication`.

| Route | Method | Rate | Request |
|-------|--------|------|---------|
| `/contact` | POST | 10/min | `{ name, email, company?, subject, message }` |
| `/feedback` | POST | 20/min | `{ name?, email?, product, rating(1-5), message }` |
| `/newsletter` | POST | 30/min | `{ email }` (idempotent) |
| `/careers` | POST | 10/min | `{ name, email, phone, resume_url, portfolio_url?, cover_letter? }` |

**Responses**: `{ success, message }` (200). Newsletter returns "already subscribed" vs "subscribed" but both 200.
**Errors**: `400 VALIDATION_ERROR`, `413 PAYLOAD_TOO_LARGE` (100KB), `429 RATE_LIMITED`.
**Sanitization**: `<script>`, event handlers, HTML tags, `javascript:`, C0/C1 control chars stripped before storage.

---

## 8. Email (dev/admin)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/test-email` | POST | Public | Send a test email (dev) |
| `/email-previews` | GET | Public | Render all 10 templates with sample data |
| `/email-previews/:filename` | GET | Public | Single template preview |

Templates and lifecycle in `EMAIL_SYSTEM.md`.

---

## 9. Webhooks (`/api/webhooks/razorpay`)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/razorpay` | POST | Razorpay signature | Payment events |

- HMAC SHA-256 verified against `RAZORPAY_WEBHOOK_SECRET`.
- `payment.captured`/`paid` → complete purchase + grant entitlement + issue token (idempotent via `WHERE status='created'`).
- `payment.refunded` → `status='refunded'`, revoke entitlement, expire tokens.
- **Errors**: `400` invalid signature (idempotent; safe to retry).

---

## 10. System

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/` | GET | Public | API root info |
| `/csp-report` | POST | Public | CSP violation reports |

---

## 11. Health & Readiness

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/health` | GET | Public | `{ status, uptime, database, migrations, dbError }` — `ok`/`degraded` |
| `/ready` | GET | Public | Readiness probe (DB connectivity) |

Used by the Docker healthcheck.

---

## 12. Admin (Planned — not implemented)

Reserved under `/api/admin/*`, protected by `requireRole('admin','super_admin')`:

| Route (planned) | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/admin/customers` | GET | Admin | List/search customers |
| `/admin/customers/:id` | GET | Admin | Customer detail + linked purchases |
| `/admin/products` | GET/POST/PUT | Admin | Product CRUD |
| `/admin/purchases` | GET | Admin | Purchase list + refund |
| `/admin/communication/*` | GET | Admin | Unified inbox |
| `/admin/settings*` | GET/PUT | Super Admin | System settings |
| `/admin/admins*` | GET/PUT | Super Admin | Admin management |
| `/admin/analytics/*` | GET | Super Admin | Analytics (future) |

Roles/middleware are ready; see `ADMIN_PORTAL_ARCHITECTURE.md`.

---

*For request/response schemas per endpoint, see the module docs: `CUSTOMER_PORTAL.md` (account UI), `EMAIL_SYSTEM.md` (email triggers).*
