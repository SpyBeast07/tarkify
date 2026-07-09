# Tarkify Backend

## Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** PostgreSQL (via `pg`)
- **Auth:** Better Auth
- **Payments:** Razorpay

## Setup

```bash
bun install
```

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Generate a Better Auth secret:

```bash
openssl rand -base64 32
```

## Development

Start the database:

```bash
docker compose up --build -d
```

Run migrations:

```bash
bun run db:migrate
```

Start the dev server:

```bash
bun run dev
```

## Email System

The backend sends transactional and marketing emails via **Resend**. All email logic lives under `src/email/`.

### Quick Start

1. Set `RESEND_API_KEY` in `.env` (optional in dev — emails are logged instead of sent)
2. Set `FROM_EMAIL` to an address on a domain verified in the Resend dashboard
3. Set `ADMIN_EMAIL` to receive admin notifications

### Key Files

| File | Purpose |
|---|---|
| `src/email/service.ts` | `EmailService` — 11 send methods with logging, retry, preference checks |
| `src/email/resend.ts` | `ResendProvider` — wraps the Resend SDK with timeout and structured errors |
| `src/email/errors.ts` | Error hierarchy: `EmailError`, `EmailProviderError`, `EmailRateLimitError`, etc. |
| `src/email/logger.ts` | In-memory logger (last 1000 entries) |
| `src/email/retry.ts` | Exponential backoff with full jitter |
| `src/email/preferences/` | User opt-in/opt-out per category (`security` is mandatory) |
| `src/email/templates/` | 10 email templates built from components |
| `src/email/preview.ts` | Preview dashboard at `GET /api/email-previews` |

### Testing

```bash
# Test with the debug endpoint
curl -X POST http://localhost:3009/api/test-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"your@email.com"}'

# Preview templates in browser
open http://localhost:3009/api/email-previews
```

See [docs/EMAIL_SYSTEM.md](../docs/EMAIL_SYSTEM.md) for full documentation.

## Better Auth

Better Auth provides email/password authentication with session management.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Secret key for encryption (min 32 chars). Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Base URL of the API server (used for email links). |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (omit both to disable Google sign-in). |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (omit both to disable Google sign-in). |

### Auth Routes

All auth endpoints are at `/api/auth/*`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-up/email` | Register with email + password |
| POST | `/api/auth/sign-in/email` | Login with email + password |
| POST | `/api/auth/sign-out` | Logout (deletes session) |
| POST | `/api/auth/forget-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/get-session` | Get current session and user |

### Session Middleware

The session validation middleware runs on all routes and attaches `user` and `session` to the request context. Use `requireAuth` to protect routes and `requireRole` for role-based access.

```typescript
import { requireAuth, requireRole } from './middleware/auth.js';

// Protected route
app.get('/api/account/profile', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({ user });
});

// Admin-only route
app.get('/api/admin/customers', requireRole('admin', 'super_admin'), async (c) => {
  // ...
});
```

## Database

Migrations are in `migrations/` directory. Run with:

```bash
bun run db:migrate
```

## Testing

```bash
bun test
```
