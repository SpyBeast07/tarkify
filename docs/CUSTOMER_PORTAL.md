# Customer Portal

> **Scope**: The authenticated frontend area at `/account`.
> **Consumes**: Customer API (`/api/account/*`).
> **Client**: `src/lib/api/account.ts`, `src/lib/context/auth.svelte.ts`.

---

## Route Structure

```
/account/
├── +layout.svelte        Auth guard + sidebar + content slot
├── +page.svelte           Dashboard
├── profile/  +page.svelte  Profile editing
├── purchases/
│   ├── +page.svelte        Paginated purchase list
│   └── [id]/+page.svelte  Purchase detail
├── downloads/ +page.svelte  Downloadable products
├── billing/   +page.svelte  Paginated billing history
└── settings/  +page.svelte  Password, sessions, delete account
```

All pages set `ssr = false` and fetch client-side.

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Sidebar.svelte` | `lib/components/account/` | Vertical nav, icon links, mobile toggle |
| `Pagination.svelte` | `lib/components/account/` | Prev/next + numbered buttons |
| `Seo.svelte` | `lib/components/` | SEO meta (reused) |
| `Button.svelte`, `Input.svelte`, `Toast.svelte` | `lib/components/ui/` | Reused UI |

---

## Authentication Flow

1. Root layout initializes auth context (`createAuthState()`).
2. Account `+layout.svelte` checks `authState.loaded`/`user`:
   - Not loaded → calls `checkSession()`.
   - Loaded + no user → redirect to `/account/login?redirect=/account`.
   - Loaded + user → render content.
3. Session expiry → `visibilitychange` rechecks; BroadcastChannel syncs across tabs.
4. Sign out → `clearUser()` + `broadcast()` + redirect.

---

## Pages

### Dashboard (`/account/`)
- **Purpose**: welcome, stats, recent activity, email-verification banner.
- **API**: `GET /api/account/dashboard`.
- **States**: loading (skeleton), error (retry), success.

### Profile (`/account/profile/`)
- **Purpose**: edit `displayName`, `timezone`; view account info.
- **API**: `GET/PUT /api/account/profile` → `/users/me`.
- **Permissions**: own profile only.
- **Error states**: inline field errors; alert on save failure.

### Purchases (`/account/purchases/`)
- **Purpose**: paginated list with status badges.
- **API**: `GET /api/account/purchases?page=&limit=`.
- **Re-fetch** on page change (`$effect`).
- **Empty state**: illustration + CTA to products.

### Purchase Detail (`/account/purchases/[id]/`)
- **Purpose**: full details, copy-to-clipboard for Razorpay IDs.
- **API**: `GET /api/account/purchases/:id`.
- **Error**: 404 → "Purchase not found" card.

### Downloads (`/account/downloads/`)
- **Purpose**: owned products with a Download button (token generation).
- **API**: `GET /api/account/downloads`; `POST /api/account/downloads/:purchaseId`.
- **User action**: click download → generate token → absolute `VITE_API_URL` URL.

### Billing (`/account/billing/`)
- **Purpose**: paginated paid/refunded payment history.
- **API**: `GET /api/account/billing?page=&limit=`.
- **Re-fetch** on page change.

### Settings (`/account/settings/`)
- **Purpose**: change password, manage sessions, delete account.
- **API (auth)**: `changePassword`, `listSessions`, `revokeSession`, `revokeOtherSessions`, `deleteAccount`, `sendVerificationEmail`.
- **Permissions**: own account.

---

## Loading / Error / Empty / Success States

| State | Behavior |
|-------|------------|
| Loading | CSS skeleton animations |
| Empty | Illustration + message + CTA |
| Error | Message + retry button |
| Success | Toast + inline banner |
| Validation | Inline error text below fields |

---

## Navigation

- `Sidebar` (desktop) + mobile overlay.
- Active route highlighted.
- Logged-in navbar shows user dropdown (Account + Sign Out).

---

## Future Improvements

- Client-side caching (SWR / TanStack Query).
- Search/filter purchases by status/date/product.
- Invoice download (PDF receipts).
- Avatar upload.
- Subscription management.
- Notification preferences UI.
- Detailed activity log.
- Per-user dark mode toggle (currently global).

---

*Backend contract: `API_REFERENCE.md#customer--account`. Architecture: `ARCHITECTURE.md#customer-portal-architecture`.*
