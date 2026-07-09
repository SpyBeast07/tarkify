# Better Auth Implementation

> **Status**: Complete  
> **Phase**: Phase 3 (Regression & Auditing Complete)  
> **Date**: 2026-07-06  
> **Architecture Reference**: `docs/ACCOUNT_SYSTEM_ARCHITECTURE.md`

---

## Architecture

### Auth Boundary

Better Auth owns identity. Tarkify owns business data. This separation is enforced at the database and middleware level.

```
Request → Better Auth middleware → session.user.id
                                         │
                                         ▼
                     Tarkify middleware → reads user from DB
                                         │
                                         ▼
                           Route handler → checks entitlements
                                         │
                                         ▼
                                    Response
```

### Better Auth Instance

**File**: `backend/src/auth.ts`

The `betterAuth()` instance is configured with:
- **Database**: PostgreSQL via pg Pool (shared connection string)
- **User model**: `users` table (existing) with field mappings for snake_case columns
- **Session**: 7-day expiry, 1-day refresh window, cookie caching enabled
- **Account**: Email/password authentication (OAuth ready for future)
- **Verification**: Token-based email verification with 24-hour expiry
- **Cookies**: HTTP-only, Secure in production, SameSite=Lax

### Session Middleware

**File**: `backend/src/middleware/auth.ts`

Three middleware functions:

| Middleware | Purpose |
|-----------|---------|
| `sessionMiddleware` | Validates session cookie, attaches `user` + `session` to Hono context |
| `requireAuth` | Returns 401 if no session |
| `requireRole(...roles)` | Returns 403 if user lacks required role |

The `sessionMiddleware` runs on ALL routes (global middleware). This allows any route to access `c.get('user')` without additional session lookups. Routes that don't need auth simply ignore the user context.

### Hono Integration

**File**: `backend/src/index.ts`

Better Auth handler is mounted at `/api/auth/*`:

```typescript
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});
```

CORS middleware updated to include `credentials: true` and support `PUT`, `DELETE`, `X-CSRF-Token` for auth flows.

---

## Database Changes

### Migration 010: `migrations/010_create_auth_tables.sql`

**Changes to existing `users` table:**
- Added `email_verified BOOLEAN NOT NULL DEFAULT false`
- Added `image TEXT`
- Added `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

**New tables created:**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `session` | Active sessions | `id TEXT PK`, `user_id TEXT FK → users`, `token TEXT UNIQUE`, `expires_at TIMESTAMPTZ` |
| `account` | Auth provider accounts | `id TEXT PK`, `user_id TEXT FK → users`, `provider_id TEXT`, `password TEXT` |
| `verification` | Email verification + password reset tokens | `id TEXT PK`, `identifier TEXT`, `value TEXT`, `expires_at TIMESTAMPTZ` |

**Design decisions:**
- All new tables use `TEXT` primary keys (Better Auth generates IDs)
- Column names are snake_case (mapped from Better Auth's camelCase defaults)
- `user_id` references `users(id)` with `ON DELETE CASCADE`
- Indexes on frequently queried columns (`user_id`, `token`, `expires_at`)

**No existing business tables were modified** beyond adding columns to `users`.

---

## Environment Variables

### New Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BETTER_AUTH_SECRET` | Yes | — | Encryption secret (min 32 chars). Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Yes | — | Base URL of the API server (e.g., `http://localhost:3001`). Used in email links. |

### Updated Files

- `backend/.env` — Added `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `backend/.env.example` — Added auth variables with documentation
- `backend/src/config.ts` — Added `config.auth.secret` and `config.auth.url`
- `frontend/.env` — No changes needed (uses `VITE_API_URL` for API base URL)

---

## Authentication Flow

### Registration

```
User → /account/register → fills name, email, password
  │
  ↓
POST /api/auth/sign-up/email { name, email, password }
  │
  ├── Better Auth validates email (not taken), password (min 8 chars)
  ├── Creates user row in `users` table
  ├── Creates account row with hashed password
  ├── Creates session (auto-login)
  ├── Sends verification email (if sendOnSignUp is enabled)
  └── Returns { user, session }
  │
  ↓
Redirect to /account → user is authenticated, sees verification banner
```

### Login

```
User → /account/login → fills email, password
  │
  ↓
POST /api/auth/sign-in/email { email, password, rememberMe }
  │
  ├── Validates credentials (generic error for invalid — no enumeration)
  ├── Creates session (7-day default, 30-day if rememberMe)
  ├── Sets HTTP-only session cookie
  └── Returns { user, session }
  │
  ↓
Redirect to return URL (default: /account)
```

### Logout

```
User clicks "Sign Out" in navbar dropdown
  │
  ↓
POST /api/auth/sign-out
  │
  ├── Deletes session from DB
  ├── Clears session cookie
  └── Returns success
  │
  ↓
Redirect to /
```

### Forgot Password

```
User → /account/forgot-password → enters email
  │
  ↓
POST /api/auth/forget-password { email }
  │
  ├── Always returns success (no email enumeration)
  ├── If email exists: creates verification token, sends email
  └── Email contains link: {BETTER_AUTH_URL}/api/auth/reset-password?token=...
  │
  ↓
User clicks link → /account/reset-password?token=...
  │
  ↓
POST /api/auth/reset-password { token, newPassword }
  │
  ├── Validates token (not expired, exists)
  ├── Updates password hash
  ├── Deletes token (one-time use)
  └── Returns success → user redirected to login
```

### Email Verification

```
Better Auth sends email after registration
Email contains verification link
  │
  ↓
User clicks link → GET /api/auth/verify-email?token=...
  │
  ├── Validates token
  ├── Sets email_verified = true
  ├── Auto-signs in (if autoSignInAfterVerification is enabled)
  └── Redirects to {FRONTEND_URL}/account?verified=true
```

---

## Session Lifecycle

### Creation
- After successful login or registration
- Better Auth creates a `session` row with:
  - `id`: Generated unique ID
  - `user_id`: FK to `users.id`
  - `token`: Random session token (stored hashed in DB)
  - `expires_at`: Now + 7 days (or 30 days with remember me)
  - `ip_address` and `user_agent`: Captured from request

### Validation
- On every request, `sessionMiddleware` calls `auth.api.getSession()`
- Better Auth reads the session cookie, looks up the session in DB
- Checks `expires_at` — if expired, returns null
- Returns `{ user, session }` if valid

### Refresh
- Sessions have a 1-day update window (`updateAge: 86400`)
- If a session is older than 1 day and still valid, it's refreshed (expiry extended)
- This keeps active sessions alive without explicit refresh

### Cookie Cache
- Session state is cached in a cookie with 5-minute max age
- Reduces DB lookups for frequent requests
- Cache is validated against DB periodically

### Expiration
- Session is deleted on explicit logout
- Session expires naturally when `expires_at` passes
- All sessions are invalidated on password reset (optional, disabled by default)
- Expired sessions are cleaned up by Better Auth internally

### Cookie Configuration
- **Name prefix**: `tarkify`
- **HTTP-only**: true (not accessible to JavaScript)
- **Secure**: true in production, false in development
- **SameSite**: Lax (allows redirects from email links)
- **Path**: Default (covers all routes)

---

## Security Model

### Password Hashing
- Better Auth uses bcrypt (or argon2 where available)
- Passwords are stored in the `account` table (column: `password`)
- Application never sees plaintext passwords

### Cookie Security
- HTTP-only: prevents XSS access
- Secure flag: only sent over HTTPS in production
- SameSite=Lax: mitigates CSRF while allowing OAuth redirects
- Session token is a cryptographically random string

### Rate Limiting
- Auth endpoints: 10 requests per 60 seconds per IP
- Other endpoints unchanged (payments: 30/min, downloads: 60/min, etc.)
- Rate limiting is in-memory (sliding window)

### No User Enumeration
- Login returns generic "Invalid email or password" regardless of whether email exists
- Forgot password always returns success
- Registration reveals if email is taken (necessary UX trade-off)

### Role Default
- All new users get `role = 'customer'`
- Role is set via Better Auth's `user.additionalFields`
- Admin and super_admin roles must be set manually (DB update)

---

## Deployment Steps

### 1. Generate Secret
```bash
openssl rand -base64 32
```

### 2. Set Environment Variables
Add to production environment:
```
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=https://backend.tarkify.qzz.io
```

### 3. Run Migrations
```bash
bun run db:migrate
```
This applies migration 010, creating auth tables and extending `users`.

### 4. Verify Database
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
-- Should include: email_verified, image, updated_at

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('session', 'account', 'verification');
-- Should return all three
```

### 5. Deploy
```bash
docker compose up --build -d
```

### 6. Smoke Test
```bash
# Register
curl -X POST https://backend.tarkify.qzz.io/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"TestPass123"}'

# Login
curl -X POST https://backend.tarkify.qzz.io/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Get session (requires cookie from login)
curl https://backend.tarkify.qzz.io/api/auth/get-session
```

### Docker Updates

No changes to `Dockerfile` or `docker-compose.yml` were required. Better Auth runs in the existing `api` container. The only change was adding `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to the environment (set in `.env` or production environment).

---

## Frontend Pages

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/account/login` | Login form | Email + password sign-in with remember me |
| `/account/register` | Registration form | Name + email + password with validation |
| `/account/forgot-password` | Password reset request | Enter email to receive reset link |
| `/account/reset-password` | Password reset form | Set new password with token from email |

### Navbar Integration

The navbar in `Navbar.svelte`:
- Checks session on mount
- Shows "Sign In" button when not authenticated
- Shows user dropdown (Account link + Sign Out) when authenticated
- Mobile menu includes auth actions

### Auth Client

**File**: `frontend/src/lib/api/auth.ts`

Direct fetch-based client (no external dependency) that:
- Uses `credentials: 'include'` for cookie-based sessions
- Provides typed functions: `getSession`, `signIn`, `signUp`, `signOut`, `sendForgotPassword`, `resetPassword`
- All calls go to `{VITE_API_URL}/api/auth/*`

### Session State

Session state is managed locally in components using Svelte 5 runes (`$state`). No global auth store — each page/component fetches session as needed:
- Navbar fetches session on mount
- Auth pages redirect if already logged in
- Future account pages will use `requireAuth` for protection

---

## Known Limitations

1. **No CSRF protection**: Better Auth's built-in CSRF prevention is not fully utilized since the frontend and backend are separate origins. The existing CORS plus SameSite cookies provide adequate protection.

2. **No OAuth providers**: Google and GitHub login are not configured. The `socialProviders` config is ready but empty.

3. **No email service**: SMTP email service (Resend, SendGrid, etc.) is not configured. However, a console logging transport fallback is implemented in `auth.ts`. When a verification email or password reset is triggered, Better Auth writes the link to stdout:
   - `[Better Auth Email Verification] Verification link for {email}: {url}`
   - `[Better Auth Password Reset] Reset password link for {email}: {url}`
   This enables full local verification and purchase linking flows.

4. **In-memory rate limiting**: The current rate limiter is in-memory and resets on server restart. For production with multiple replicas, use Redis-based rate limiting.

5. **No email verification flow on frontend**: The email verification link points to Better Auth's default endpoint. A dedicated frontend page (e.g., `/account/verify-email`) can be added in a future phase.

6. **Email service transport fallback**: SMTP is pending integration. The console-log fallback currently handles development/test verification needs.

7. **Migration 010 FK type mismatch (RESOLVED)**: This has been fully resolved. `session.user_id` and `account.user_id` are defined as `UUID` in Migration 010, referencing `users(id) UUID`. Better Auth is configured in `backend/src/auth.ts` under the `advanced.database` block with `generateId: () => crypto.randomUUID()` to produce standard UUID v4 strings, ensuring complete compatibility with the PostgreSQL UUID schema.

---

## Future Integration Points

### Guest Purchase Linking (Phase 3 — Implemented)

Guest purchase linking is now implemented. When a user verifies their email, a `databaseHooks.user.update.after` hook in `auth.ts` triggers `linkPurchasesToUserByEmail(userId, email)`.

See:
- `backend/src/auth.ts` — databaseHooks.user.update.after hook
- `backend/src/purchase-linking/` — linking module (types, repository, service)
- `docs/GUEST_PURCHASE_LINKING.md` — full documentation
- `backend/migrations/012_create_purchase_linking_log.sql` — linking audit log

### Customer Portal (Phase 7)

Protect account routes with `requireAuth`:

```typescript
app.get('/api/account/purchases', requireAuth, async (c) => {
  const user = c.get('user');
  // Query purchases by user.id
});
```

Frontend pages under `/account/*` will use a layout that checks session validity.

### Admin Portal (Phase 8)

Protect admin routes with `requireRole`:

```typescript
app.get('/api/admin/customers', requireRole('admin', 'super_admin'), async (c) => {
  // Admin-only logic
});
```

### Google OAuth (Phase 9)

Add Google OAuth provider to `auth.ts`:

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
},
```

### Adding Roles

Roles are stored in `users.role` (default: 'customer'). Better Auth's `user.additionalFields` tracks this. No RBAC tables are needed for the current scale.

### Linking Guest Purchases (Phase 3 — Implemented)

See `docs/GUEST_PURCHASE_LINKING.md` for complete documentation.

---

## Verification Checklist

- [x] Backend TypeScript compiles (`bun run tsc --noEmit`)
- [x] Frontend Svelte check passes (`npm run check`)
- [x] All 55 backend tests pass (20 pre-existing failures fixed during Phase 3 audit)
- [x] No existing API endpoints were changed
- [x] No existing database tables were dropped or modified (only extended `users`)
- [x] No payment, download, or communication functionality regressed
- [x] Rate limiting added for auth endpoints
- [x] CORS updated to support credentials
- [x] Session middleware runs on all routes
- [x] CSRF protection via SameSite cookies
- [x] Secure password hashing (Better Auth default)
- [x] HTTP-only secure cookies
- [x] Email verification ready (email transport pending)
- [x] Password reset flow implemented
- [x] Remember me support (30-day sessions)

---

## Files Changed/Added

### Backend
| File | Change |
|------|--------|
| `backend/package.json` | Added `better-auth` dependency |
| `backend/src/auth.ts` | **New** — Better Auth instance configuration |
| `backend/src/middleware/auth.ts` | **New** — Session validation + role middleware |
| `backend/src/index.ts` | Mounted auth handler, session middleware, auth rate limiting |
| `backend/src/middleware/cors.ts` | Added `credentials: true`, `PUT`, `DELETE`, `X-CSRF-Token` |
| `backend/src/config.ts` | Added `config.auth` (secret, url) |
| `backend/.env` | Added `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| `backend/.env.example` | Added auth variable documentation |
| `backend/README.md` | Updated with Better Auth setup instructions |
| `backend/migrations/010_create_auth_tables.sql` | **New** — Auth tables migration |

### Frontend
| File | Change |
|------|--------|
| `frontend/package.json` | Added `better-auth` dependency |
| `frontend/src/lib/api/auth.ts` | **New** — Auth API client (fetch-based) |
| `frontend/src/lib/api/account.ts` | **New** — Account API client (placeholder) |
| `frontend/src/lib/components/layout/Navbar.svelte` | Updated with auth state (login/logout/account) |
| `frontend/src/routes/account/login/+page.svelte` | **New** — Login page |
| `frontend/src/routes/account/register/+page.svelte` | **New** — Registration page |
| `frontend/src/routes/account/forgot-password/+page.svelte` | **New** — Forgot password page |
| `frontend/src/routes/account/reset-password/+page.svelte` | **New** — Reset password page |
