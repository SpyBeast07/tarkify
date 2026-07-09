# User Model

> **Status**: Implemented (Phase 2)  
> **Last Updated**: 2026-07-06

## Overview

Tarkify's user model is split across two ownership domains:

| Domain | Owner | Fields |
|--------|-------|--------|
| Identity | Better Auth | `id`, `email`, `name`, `email_verified`, `image`, `created_at`, `updated_at` |
| Business | Tarkify | `role`, `display_name`, `timezone`, `preferences`, `last_login_at`, `last_activity_at`, `account_status` |

Better Auth manages authentication (register, login, sessions, password reset, email verification). Tarkify manages business logic (roles, profile, activity tracking, preferences).

Both sets of fields live in the same `users` table but are clearly separated by ownership.

## Table Schema

The `users` table contains these columns (migration 011):

| Column | Type | Default | Constraints | Owned By |
|--------|------|---------|-------------|----------|
| `id` | UUID | `gen_random_uuid()` | PK | Better Auth |
| `email` | TEXT | — | NOT NULL, UNIQUE | Better Auth |
| `name` | TEXT | — | — | Better Auth |
| `email_verified` | BOOLEAN | `false` | NOT NULL | Better Auth |
| `image` | TEXT | — | — | Better Auth |
| `created_at` | TIMESTAMPTZ | `NOW()` | NOT NULL | Better Auth |
| `updated_at` | TIMESTAMPTZ | `NOW()` | NOT NULL | Better Auth |
| `role` | TEXT | `'customer'` | CHECK (`'customer'`, `'admin'`, `'super_admin'`) | Tarkify |
| `display_name` | TEXT | — | — | Tarkify |
| `timezone` | TEXT | `'UTC'` | — | Tarkify |
| `preferences` | JSONB | `'{}'` | NOT NULL | Tarkify |
| `last_login_at` | TIMESTAMPTZ | — | — | Tarkify |
| `last_activity_at` | TIMESTAMPTZ | — | — | Tarkify |
| `account_status` | TEXT | `'ACTIVE'` | CHECK (`'ACTIVE'`, `'SUSPENDED'`, `'DELETED'`) | Tarkify |

## Roles

Three roles with increasing authority:

| Role | DB Value | Access |
|------|----------|--------|
| Customer | `customer` | Own profile, purchases, downloads |
| Admin | `admin` | All customer capabilities + manage customers, products, purchases, communication |
| Super Admin | `super_admin` | All admin capabilities + manage admins, system settings, analytics |

Roles are stored as a TEXT column with a CHECK constraint. The application enforces role-based access via authorization middleware.

### Authorization Middleware

| Middleware | Allowed Roles |
|-----------|--------------|
| `requireCustomer` | customer, admin, super_admin |
| `requireAdmin` | admin, super_admin |
| `requireSuperAdmin` | super_admin |
| `requireRole(...roles)` | custom list of roles |

Usage:

```typescript
import { requireAdmin } from '../middleware/authorization.js';

adminRoutes.get('/customers', requireAdmin, async (c) => {
  // Only admins can access this
});
```

The existing `requireRole` function from `auth.ts` is also available for custom role combinations:

```typescript
import { requireRole } from '../middleware/auth.js';

app.get('/admin', requireRole('admin', 'super_admin'), handler);
```

## Profile Model

The `Profile` type assembles data from both Better Auth and Tarkify into a unified shape:

```typescript
interface Profile {
  id: string;
  email: string;
  name: string | null;        // Better Auth
  displayName: string | null;  // Tarkify
  image: string | null;        // Better Auth
  role: Role;                  // Tarkify
  timezone: string | null;     // Tarkify
  preferences: Record<string, unknown>; // Tarkify
  accountStatus: AccountStatus; // Tarkify
  emailVerified: boolean;      // Better Auth
  lastLoginAt: string | null;  // Tarkify
  lastActivityAt: string | null; // Tarkify
  createdAt: string;           // Better Auth
  updatedAt: string;           // Better Auth
}
```

The profile is assembled by the user service which reads from both sources.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | Required | Get full profile |
| PUT | `/api/users/me` | Required | Update profile (displayName, timezone) |
| GET | `/api/users/preferences` | Required | Get user preferences |
| PUT | `/api/users/preferences` | Required | Update user preferences |
| GET | `/api/users/touch` | Required | Update `last_activity_at` (lightweight ping) |

## Activity Tracking

Two activity timestamps are tracked:

### `last_login_at`
- Updated when a user logs in (new session created)
- Implemented via Better Auth `databaseHooks.session.create.after`
- Reflects the most recent login time

### `last_activity_at`
- Updated on every call to `GET /api/users/touch`
- The frontend pings this endpoint periodically (debounced, e.g., every 5 minutes)
- Updated alongside `last_login_at` on login events

## Preferences

The `preferences` JSONB column stores user-customizable settings. Current supported keys:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | — | UI theme preference |
| `locale` | `string` | — | Locale code (e.g., `'en-US'`) |
| `emailNotifications` | `boolean` | — | Email notification opt-in |

The schema is extensible — future preferences can be added as new keys without migration.

## Account Status

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Normal account. All features available. |
| `SUSPENDED` | Account temporarily disabled. Cannot log in or access resources. |
| `DELETED` | Account deleted. Data retained for audit but user cannot access. |

## Module Structure

```
backend/src/users/
├── index.ts          (re-exports)
├── types.ts          - TypeScript interfaces (Role, Profile, TarkifyUser, etc.)
├── validation.ts     - Zod schemas for input validation
├── repository.ts     - Raw SQL queries for user CRUD
├── service.ts        - Business logic orchestration
└── routes.ts         - Hono route handlers
```

## Ownership Boundaries

1. **Better Auth must not be modified** to accommodate Tarkify business logic
2. **Tarkify must not write** to Better Auth's managed tables (`session`, `account`, `verification`)
3. **The `users` table is the shared seam**: Better Auth creates/reads rows, Tarkify reads/extends them
4. **Session middleware merges** Better Auth session data with Tarkify user data for a complete Profile view
5. **Role changes** go through Tarkify's repository, not through Better Auth
