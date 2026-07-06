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

## Better Auth

Better Auth provides email/password authentication with session management.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Secret key for encryption (min 32 chars). Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Base URL of the API server (used for email links). |

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
