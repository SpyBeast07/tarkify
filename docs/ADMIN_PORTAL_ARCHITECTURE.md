# Admin Portal Architecture

> **Status:** Phase 7 — Communication Center **implemented**. Business modules: planned (Phases 8+).
> **Purpose:** Single source of truth for the Tarkify Admin Portal.
> **Related:** `ARCHITECTURE.md`, `API_REFERENCE.md`, `SECURITY.md`, `DATABASE.md`, `DESIGN_SYSTEM.md`, `CUSTOMER_PORTAL.md`, `DEVELOPMENT_GUIDE.md`.

This document defines the design. Implementation is tracked by phase — see [Phase 1 — Admin Foundation](#appendix-phase-1--admin-foundation-implemented) below.

---

## 1. Admin Portal Overview

### 1.1 Purpose

The Admin Portal is the internal control plane for Tarkify. It lets privileged staff (admins) operate the business: manage the catalog, inspect orders and payments, monitor downloads, support customers, triage the communication inbox, observe email delivery, review analytics, watch system health, tune settings, and audit sensitive actions.

### 1.2 Customer Portal vs Admin Portal

| Aspect | Customer Portal | Admin Portal |
|--------|-----------------|--------------|
| Audience | Customers (`role = customer`) | Staff (`role = admin`) |
| Entry route | `/account/*`, public marketing site | `/admin/*` |
| Login | `/login` (Email/Password **+ Google OAuth**) | `/admin/login` (**Email/Password only**) |
| Registration | Self-service `/register` | **None** — accounts created via backend/DB only |
| Data scope | Own profile, purchases, downloads | All customers, all orders, all system data |
| Discoverability | Public, SEO-indexed | `noindex,nofollow`, unlinked from public site |
| Backend | Shared Tarkify API | **Same** shared Tarkify API, `/api/admin/*` namespace |
| Session infra | Better Auth session cookie | **Same** Better Auth session cookie |

**They are two separate frontends sharing one backend.** Both are served by the same SvelteKit app and talk to the same Hono/Bun API and the same PostgreSQL database. Separation is enforced by route namespace (`/admin/*` vs `/account/*`) and by an explicit **role check** on both the frontend layout and every backend admin route — never by session existence alone.

### 1.3 Authentication flow (summary)

Admins authenticate through the **existing Better Auth** email/password flow (`POST /api/auth/sign-in/email`). A successful sign-in issues the standard Tarkify session cookie. The admin layout and admin API then verify `user.role === 'admin'` before granting access. Full detail in §2.

### 1.4 Authorization flow (summary)

Two roles exist: `customer` and `admin`. Only `admin` may reach any `/admin` page or `/api/admin/*` endpoint. A valid customer session grants **no** admin access. Full detail in §3.

### 1.5 Module overview

Dashboard · Products · Orders · Payments · Downloads · Customers · Communication (Contact / Feedback / Newsletter / Careers) · Emails · Analytics · System · Settings · Audit. Each maps to a backend module and a frontend route group (§5, §7).

### 1.6 Future scalability

The design is additive: new modules are new route files + a new backend module folder, with no changes to existing business tables. Multiple admin roles, CMS, subscriptions, licensing, automation, an AI assistant, feature flags, plugins, and multi-tenancy are documented as future possibilities in §12 and are **out of scope now**.

---

## 2. Authentication Architecture

### 2.1 Admin login flow

```
Admin
  ↓
/admin/login  (Email + Password form)
  ↓
POST /api/auth/sign-in/email   (existing Better Auth handler)
  ↓
Session Cookie  (tarkify.* httpOnly cookie, shared session infra)
  ↓
ADMIN verification  (role === 'admin' checked in admin layout + admin API)
  ↓
Admin Portal  (/admin/dashboard)
```

### 2.2 Rules

- **No Google OAuth** on the admin login page. Email + Password only.
- **No admin registration.** There is no `/admin/register` and no "Create Admin" button anywhere in the UI.
- **No Forgot Password** on admin login initially (future enhancement).
- **Admin accounts are created only through the backend/database** (see §2.4).
- Admin login uses **Email + Password** exclusively.
- Uses the **existing Better Auth implementation** (`backend/src/auth.ts`) — no new auth system.
- Shares the **same session infrastructure** as the Customer Portal (same cookie, same `session` table, same `sessionMiddleware`).
- The session's user carries `role = 'admin'`, resolved from the DB by `sessionMiddleware` (`backend/src/middleware/auth.ts`).

### 2.3 Reused Better Auth surface

| Concern | Existing mechanism | Admin use |
|---------|--------------------|-----------|
| Sign-in | `POST /api/auth/sign-in/email` | Admin login form posts here |
| Session read | `GET /api/auth/get-session` → `authState` context | Admin layout reads user + role |
| Sign-out | `POST /api/auth/sign-out` | Header "Logout" |
| Session cookie | `tarkify.*`, httpOnly, `sameSite: lax`, secure in prod | Unchanged |
| Role resolution | `sessionMiddleware` merges `users.role` onto `c.get('user')` | Source of truth for authz |
| Rate limiting | `authLimit` on `/api/auth/*` (10/min) | Applies to admin login |
| Account status gate | Sign-in rejects non-`ACTIVE` accounts | Suspended admins cannot log in |

> Note: The device-dedup logic on `/api/auth/sign-in/email` (`backend/src/index.ts`) applies to admins too and needs no change.

### 2.4 Creating admin accounts (out-of-band)

Admins are provisioned **outside the UI**. A backend script / SQL updates an existing user's role, e.g. `UPDATE users SET role = 'admin' WHERE email = $1`, or a seed/CLI script that creates the Better Auth user (so the password is hashed by Better Auth) and then elevates the role. A dedicated provisioning script (e.g. `backend/scripts/create-admin.ts`) will be specified in the implementation phase. No self-service path is exposed.

### 2.5 Session expiry & logout

Sessions follow the existing config (`expiresIn: 2592000`, `updateAge: 86400`, `cookieCache 300s`). On expiry or logout the admin layout redirects to `/admin/login`. Cross-tab logout is already handled by the `tarkify-auth` BroadcastChannel in `auth.svelte.ts`.

---

## 3. Authorization

### 3.1 Roles (now)

```
customer   → Customer Portal only. Can NEVER access /admin.
admin      → Full access to every admin page and every /api/admin/* endpoint.
```

Only **one** admin role exists today. Future roles may be added later — **do not implement them now** (§12).

> **Codebase note:** the `users.role` CHECK currently allows `customer/admin/super_admin`, and legacy middleware `requireSuperAdmin` exists. For this phase we treat `admin` as the single privileged role. `super_admin` is left dormant as a reserved value for future RBAC and is **not** used to gate any admin feature. All admin routes gate on `admin` (implemented via `requireRole('admin')` / `requireAdmin`).

### 3.2 Rules

- Customers can **never** access `/admin` (frontend) or `/api/admin/*` (backend).
- Admins can access **every** admin page.
- A valid Customer Portal session must **not** grant admin access simply because it is valid. The admin layout must **explicitly verify `user.role === 'admin'`** before rendering any admin content, and every admin API route must independently enforce the same check.

### 3.3 Enforcement (defense in depth)

| Layer | Mechanism | Failure behavior |
|-------|-----------|------------------|
| Frontend layout | `frontend/src/routes/admin/+layout.svelte` reads `authState`, checks `loaded` + `user.role === 'admin'` | Not authed → redirect `/admin/login`; authed non-admin → redirect `/` (or `/403`) |
| Backend middleware | `admin` route group mounts `requireAuth` + `requireRole('admin')` | No session → `401 UNAUTHORIZED`; wrong role → `403 FORBIDDEN` |
| Data layer | Services scope every query; repositories parameterize all SQL | — |

The frontend guard is UX only; the **backend is the security boundary**. Every admin endpoint is protected server-side regardless of what the UI does.

### 3.4 Route protection matrix

| Route pattern | customer | admin |
|---------------|:--------:|:-----:|
| `/api/admin/**` | ✗ (403) | ✓ |
| `/admin/**` (frontend) | ✗ (redirect) | ✓ |
| `/admin/login` | ✓ (public) | ✓ (redirect to dashboard if already admin) |

Unauthorized responses: **`401`** (no/invalid session) or redirect to **`/admin/login`**; **`403`** when authenticated but not an admin.

---

## 4. Route Structure (Frontend)

All under `/admin`. Every route except `/admin/login` requires `role = admin`.

```
/admin                 → redirect to /admin/dashboard
/admin/login           → public (email + password)
/admin/dashboard       → overview widgets
/admin/products        → catalog management
/admin/orders          → orders (purchases table)
/admin/payments        → payment records & reconciliation
/admin/downloads       → download tokens & activity
/admin/customers       → customer management
/admin/contact         → communication: contact messages
/admin/feedback        → communication: feedback
/admin/newsletter      → communication: newsletter subscribers
/admin/careers         → communication: career applications
/admin/emails          → email delivery logs
/admin/analytics       → aggregate metrics & charts
/admin/system          → system health & diagnostics
/admin/settings        → admin-configurable settings
/admin/audit           → audit logs
```

**Access control:** every route above (except `/admin/login`) requires `ADMIN`. Unauthorized users receive `401` or are redirected to `/admin/login`; authenticated non-admins are redirected away (`/` or `/403`).

> The `/admin/contact`, `/admin/feedback`, `/admin/newsletter`, `/admin/careers` pages are grouped under a **Communication** section in navigation (§8) and under a `communication/` folder on disk (§5), while keeping the flat URLs above.

---

## 5. Folder Structure

### 5.1 Frontend (`frontend/src/`)

```
routes/
  admin/
    +layout.svelte              # ADMIN guard + AdminLayout shell (sidebar/header/breadcrumbs)
    +layout.ts                  # noindex; optional server-side session prefetch
    +page.svelte                # redirect → /admin/dashboard
    login/
      +page.svelte              # email + password (no OAuth, no register, no forgot)
    dashboard/
      +page.svelte
    products/
      +page.svelte              # list
      [id]/+page.svelte         # detail / edit
      new/+page.svelte          # create
    orders/
      +page.svelte
      [id]/+page.svelte
    payments/
      +page.svelte
      [id]/+page.svelte
    downloads/
      +page.svelte
    customers/
      +page.svelte
      [id]/+page.svelte
    communication/
      contact/+page.svelte
      feedback/+page.svelte
      newsletter/+page.svelte
      careers/+page.svelte
    emails/
      +page.svelte
    analytics/
      +page.svelte
    system/
      +page.svelte
    settings/
      +page.svelte
    audit/
      +page.svelte

lib/
  admin/
    api/                        # typed admin API clients (one file per module)
      client.ts                 # shared adminFetch wrapper (credentials: include)
      dashboard.ts  products.ts  orders.ts  payments.ts  downloads.ts
      customers.ts  communication.ts  emails.ts  analytics.ts
      system.ts     settings.ts  audit.ts
    components/                 # admin-only composite components (see §10)
      AdminSidebar.svelte  AdminHeader.svelte  Breadcrumbs.svelte
      DataTable.svelte     StatCard.svelte     DetailDrawer.svelte
      FilterBar.svelte     QuickActions.svelte
    layouts/
      AdminLayout.svelte        # sidebar + header + content slot
    stores/                     # admin UI state (Svelte 5 runes .svelte.ts)
      sidebar.svelte.ts  notifications.svelte.ts
    types/                      # shared admin TS types (mirror backend contracts)
      index.ts
    utils/                      # formatting, guards, query helpers
      guards.ts  format.ts
```

> Reuse existing primitives from `lib/components/ui/` and the existing `lib/api/fetch.ts`/`config.ts`. `lib/admin/` holds only what is genuinely admin-specific. **Do not duplicate** shared UI (§10).

### 5.2 Backend (`backend/src/`)

Follows the existing per-module convention (as in `communication/*`): `routes.ts`, `service.ts`, `repository.ts`, `validation.ts`, `types.ts`.

```
admin/
  index.ts                      # Hono sub-app; mounts requireAuth + requireRole('admin')
  dashboard/
    routes.ts  service.ts  repository.ts  types.ts
  products/
    routes.ts  service.ts  repository.ts  validation.ts  types.ts
  orders/
    routes.ts  service.ts  repository.ts  validation.ts  types.ts
  payments/
    routes.ts  service.ts  repository.ts  validation.ts  types.ts
  downloads/
    routes.ts  service.ts  repository.ts  types.ts
  customers/
    routes.ts  service.ts  repository.ts  validation.ts  types.ts
  communication/
    routes.ts  service.ts  repository.ts  validation.ts  types.ts
  emails/
    routes.ts  service.ts  repository.ts  types.ts
  analytics/
    routes.ts  service.ts  repository.ts  types.ts
  system/
    routes.ts  service.ts  repository.ts  types.ts
  settings/
    routes.ts  service.ts  repository.ts  validation.ts  types.ts
  audit/
    routes.ts  service.ts  repository.ts  types.ts
```

Mounted in `backend/src/index.ts`:

```ts
import admin from './admin/index.js';
app.use('/api/admin/*', adminLimit);      // rate limit (e.g. 120/min)
app.route('/api/admin', admin);           // admin sub-app applies requireAuth + requireRole('admin')
```

Business logic stays in `service.ts`; SQL stays in `repository.ts` (§6).

---

## 6. Backend Architecture

Every admin module follows the established layered flow:

```
Route  →  Validation  →  Service  →  Repository  →  Database
```

Rules (consistent with the existing codebase):

- **No SQL inside routes.** Routes parse input, call a service, and shape the HTTP response using the shared helpers (`lib/response.ts` → `AppEnv`, `errorResponse`; or `communication/shared/response.ts` → `success`, `badRequest`).
- **No business logic inside repositories.** Repositories only run parameterized queries and map rows to typed objects.
- **Validation** uses `zod` schemas (per module `validation.ts`), matching existing patterns.
- **Services** own business rules, orchestration, and cross-module calls; they never touch `Context`.
- **Authorization** is applied once at the sub-app level (`requireAuth` + `requireRole('admin')` in `admin/index.ts`); individual routes may add stricter checks if ever needed.
- **Auditing:** every state-changing admin action (refund, product edit, customer suspend, settings change, message status change) writes to `audit_logs` via the audit service. This requires extending `AUDIT_EVENTS` (`backend/src/audit/types.ts`) with admin events (e.g. `admin_refund_issued`, `admin_product_updated`, `admin_customer_suspended`, `admin_settings_updated`).
- **Errors:** consistent envelope `{ success: false, error: CODE, message, requestId }` with proper status codes, matching `index.ts` conventions.

---

## 7. API Structure (Planned)

All endpoints are under **`/api/admin/*`**, all require **`ADMIN`** (`requireAuth` + `requireRole('admin')`). Standard errors apply to every endpoint: **`401`** (no session), **`403`** (not admin), **`400`** (validation), **`404`** (not found), **`429`** (rate limit), **`500`** (server). Below, only the notable additional errors are listed per endpoint.

Response envelope: success returns JSON payloads (list endpoints return `{ items, page, limit, total }`); errors return `{ success: false, error, message, requestId }`.

### 7.1 Dashboard

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/dashboard` | GET | Admin | — | `{ metrics, recent, systemHealth }` aggregates for widgets (§9) | — |

### 7.2 Products

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/products` | GET | Admin | `?page&limit&q&active` | `{ items: Product[], page, limit, total }` | — |
| `/admin/products/:id` | GET | Admin | — | `Product` | 404 |
| `/admin/products` | POST | Admin | `{ slug, name, description, type, price, currency, download_key, active }` | `Product` (201) | 400, 409 (slug taken) |
| `/admin/products/:id` | PUT | Admin | partial product fields | `Product` | 400, 404, 409 |
| `/admin/products/:id` | DELETE | Admin | — | `{ success }` | 404, 409 (has purchases) |

### 7.3 Orders (`purchases` table)

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/orders` | GET | Admin | `?page&limit&status&q&productId&from&to` | `{ items: Order[], page, limit, total }` | — |
| `/admin/orders/:id` | GET | Admin | — | `Order` + product + customer/guest + entitlement | 404 |

### 7.4 Payments

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/payments` | GET | Admin | `?page&limit&status&provider&from&to` | `{ items: Payment[], page, limit, total }` | — |
| `/admin/payments/:id` | GET | Admin | — | payment detail incl. razorpay ids | 404 |
| `/admin/payments/:id/refund` | POST | Admin | `{ reason }` | `{ success, refund }` | 400, 404, 409 (already refunded), 502 (provider) |

Refund is audited (`admin_refund_issued`).

### 7.5 Downloads

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/downloads` | GET | Admin | `?page&limit&productId&purchaseId&active` | `{ items: DownloadToken[], page, limit, total }` | — |
| `/admin/downloads/:id/revoke` | POST | Admin | — | `{ success }` | 404 |

### 7.6 Customers

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/customers` | GET | Admin | `?page&limit&q&status` | `{ items: Customer[], page, limit, total }` | — |
| `/admin/customers/:id` | GET | Admin | — | customer + purchases + entitlements + sessions | 404 |
| `/admin/customers/:id/status` | PATCH | Admin | `{ status: 'ACTIVE'|'SUSPENDED' }` | `Customer` | 400, 404 |

Status change is audited (`admin_customer_suspended` / `admin_customer_reactivated`). Admin role assignment is **not** exposed here (out-of-band only, §2.4).

### 7.7 Communication

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/communication/contact` | GET | Admin | `?page&limit&status&q` | contact messages page | — |
| `/admin/communication/feedback` | GET | Admin | `?page&limit&status&rating` | feedback page | — |
| `/admin/communication/newsletter` | GET | Admin | `?page&limit&active` | subscribers page | — |
| `/admin/communication/careers` | GET | Admin | `?page&limit&status` | applications page | — |
| `/admin/communication/:type/:id` | GET | Admin | — | single record | 404 |
| `/admin/communication/:type/:id/status` | PATCH | Admin | `{ status: NEW|READ|REPLIED|ARCHIVED }` | updated record | 400, 404 |

`type ∈ {contact, feedback, newsletter, careers}`. Status changes are audited.

### 7.8 Emails

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/emails` | GET | Admin | `?page&limit&status&template&recipient&from&to` | `email_logs` page | — |
| `/admin/emails/:id` | GET | Admin | — | single email log | 404 |
| `/admin/emails/:id/resend` | POST | Admin | — | `{ success }` (future) | 404, 502 |

### 7.9 Analytics

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/analytics/overview` | GET | Admin | `?from&to` | revenue, orders, conversion aggregates | — |
| `/admin/analytics/revenue` | GET | Admin | `?from&to&interval` | time series | — |
| `/admin/analytics/products` | GET | Admin | `?from&to` | top products | — |

Read-only, derived from existing tables (`purchases.created_at/status/amount`, etc.).

### 7.10 System

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/system/health` | GET | Admin | — | db, migrations, storage, email provider status | — |
| `/admin/system/info` | GET | Admin | — | version, uptime, env (non-secret) | — |

Reuses signals from existing `/api/health` and `/api/ready`.

### 7.11 Settings

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/settings` | GET | Admin | — | current settings | — |
| `/admin/settings` | PUT | Admin | settings object | updated settings | 400 |

Setting changes are audited (`admin_settings_updated`). A `settings` table (or JSONB config row) is introduced in the implementation phase.

### 7.12 Audit

| Route | Method | Auth | Request | Response | Notable errors |
|-------|--------|------|---------|----------|----------------|
| `/admin/audit` | GET | Admin | `?page&limit&event&userId&from&to` | `audit_logs` page | — |
| `/admin/audit/:id` | GET | Admin | — | single audit entry | 404 |

Read-only. Sourced from the existing `audit_logs` table.

---

## 8. Navigation

### 8.1 Sidebar

```
Dashboard
Products
Orders
Payments
Downloads
Customers
Communication
  ├─ Contact
  ├─ Feedback
  ├─ Newsletter
  └─ Careers
Emails
Analytics
System
Settings
Audit Logs
```

- Rendered by `AdminSidebar.svelte`. Active route highlighted (via `$page.url.pathname`).
- "Communication" is a collapsible group; children link to `/admin/contact|feedback|newsletter|careers`.
- Collapses to an overlay on mobile (pattern mirrors `account/Sidebar.svelte`).
- Uses `@lucide/svelte` icons (already a dependency).

### 8.2 Header

```
Search   Notifications   Profile   Theme   Logout
```

- **Search:** global/contextual quick search (scaffold now, wire per module later).
- **Notifications:** bell with unread count from `notifications.svelte.ts` store (e.g. new messages/orders); backend feed is future.
- **Profile:** admin name/email + link; no role switching.
- **Theme:** reuses existing `theme.svelte.ts` (light/dark).
- **Logout:** calls `POST /api/auth/sign-out`, clears `authState`, redirects to `/admin/login`.

### 8.3 Breadcrumbs

Derived from the pathname (same approach as `account/+layout.svelte`), e.g. `Admin → Orders → #ORD-123`. Rendered by `Breadcrumbs.svelte`.

### 8.4 Quick Actions

`QuickActions.svelte` surfaces common tasks (e.g. "New Product", "Search Orders", "View Audit"), shown on the dashboard and optionally in the header.

---

## 9. Dashboard Planning

### 9.1 Metric widgets (`StatCard`)

| Widget | Source |
|--------|--------|
| Revenue | `SUM(purchases.amount) WHERE status='paid'` (+ period delta) |
| Orders | count of `purchases` (by status) |
| Payments | paid vs failed vs refunded counts |
| Downloads | active `download_tokens` / recent downloads |
| Products | active product count |
| Customers | total customers, new this period |
| System Health | db/migrations/storage/email status badge |

### 9.2 Recent activity lists

- Recent Purchases (latest orders)
- Recent Messages (contact)
- Recent Feedback
- Recent Careers (applications)
- Recent Emails (email log tail)

### 9.3 Quick Actions

Shortcut buttons (§8.4) — create product, go to orders, open audit, etc.

### 9.4 Recent Activity (audit)

Compact feed of the latest `audit_logs` entries (who did what, when).

All dashboard data comes from a single `GET /admin/dashboard` aggregate (§7.1) to minimize round-trips; each widget supports the standard states in §11.

---

## 10. Shared UI

Reuse the existing Tarkify design system — **do not duplicate components.**

Reuse from `lib/components/ui/`:

| Need | Existing component |
|------|--------------------|
| Cards | `Card.svelte`, `SectionCard.svelte` |
| Alerts | `Alert.svelte` |
| Empty / Error / Loading states | `StateCard.svelte`, `Loading.svelte`, `Skeleton.svelte` |
| Status badges | `StatusBadge.svelte`, `Badge.svelte` |
| Modals / Confirmation dialogs | `Modal.svelte`, `Dialog.svelte` |
| Forms / inputs | `Input.svelte`, `Button.svelte`, `Dropdown.svelte` |
| Pagination | `account/Pagination.svelte` |
| Toasts | `Toast.svelte` + `toast.svelte.ts` |
| Auth page shell | `AuthLayout.svelte` (for `/admin/login`) |

**New admin-only composites** (only where nothing suitable exists), in `lib/admin/components/`:

| Component | Why it's new |
|-----------|--------------|
| `DataTable` | Sortable/filterable/paginated table shared across list pages |
| `StatCard` | Dashboard metric tile (thin wrapper over `Card`) |
| `DetailDrawer` | Slide-over detail panel for order/customer/etc. |
| `FilterBar` | Standard filters (status, date range, search) |
| `AdminSidebar` / `AdminHeader` / `Breadcrumbs` / `QuickActions` | Admin chrome |

Maintain the existing Tarkify design language: semantic color tokens, glass surfaces, spacing scale, light+dark, subtle 150–300ms transitions, WCAG AA — per `DESIGN_SYSTEM.md`.

---

## 11. Error Handling

Every admin page supports these states, using the shared components in §10:

| State | Component / behavior |
|-------|----------------------|
| Loading | `Skeleton` / `Loading` placeholders |
| Empty | `StateCard` empty variant with guidance |
| Error | `StateCard`/`Alert` error variant |
| Success | rendered content (+ `Toast` for actions) |
| Retry | retry button on error state re-invokes the loader |
| Unauthorized (401) | redirect to `/admin/login` |
| Forbidden (403) | redirect to `/` or a `/403` state (non-admin) |
| Not Found (404) | `StateCard` not-found variant |

The shared `adminFetch` (`lib/admin/api/client.ts`) normalizes the backend error envelope (mirroring `lib/api/fetch.ts` / `client.ts`) into typed errors so pages map status → state consistently. `401`/`403` are handled centrally (redirect); other errors render inline.

---

## 12. Future Scalability (Documentation Only)

Do **not** implement now. Recorded so the architecture stays additive:

- **More admin roles** — reuse the reserved `super_admin` value and/or add a `role_permissions` table for granular RBAC, without touching business tables.
- **CMS** — manage marketing/site content from the admin portal.
- **Subscription management** — build on `products.type = SUBSCRIPTION`.
- **License management** — issue/track licenses per entitlement.
- **Automation** — scheduled jobs, workflows, triggers.
- **AI assistant** — admin copilot over orders/customers/analytics.
- **Feature flags** — runtime toggles via the settings module.
- **Plugin system** — modular admin extensions.
- **Multi-tenancy** — tenant scoping across tables and sessions.

Each is a new module (new route files + new backend module folder) or an additive migration — no rewrite of existing modules required.

---

*Planning document only. Business module implementation begins in Phase 2 after this foundation is confirmed stable.*

---

## Appendix: Phase 1 — Admin Foundation (Implemented)

### Scope

Built the shared Admin Portal infrastructure. No business modules were implemented.

### Files created (19 files)

```
frontend/src/
  routes/admin/
    +layout.svelte            Admin guard + AdminLayout shell
    +page.svelte              Landing page (placeholder)
    login/+page.svelte        Email/password login (no OAuth/register/forgot)

  lib/admin/
    types/index.ts            Shared admin TypeScript types
    stores/sidebar.svelte.ts  Sidebar mobile open/close state
    api/client.ts             Typed fetch wrapper for /api/admin/*
    components/
      AdminLayout.svelte        Shell: sidebar + header + content
      AdminSidebar.svelte       Navigation sidebar with groups + mobile drawer
      AdminHeader.svelte        Breadcrumbs + search + notifications + theme + logout
      AdminBreadcrumbs.svelte   Auto-generated breadcrumbs from pathname
      AdminSearch.svelte        Search trigger + dropdown (UI only)
      AdminNotificationMenu.svelte  Bell icon + dropdown (UI only, empty state)
      AdminPage.svelte          Loading/error/content state container
      AdminPageHeader.svelte    Title + description + actions
      AdminSection.svelte       Glass card section wrapper
      AdminTableContainer.svelte  Styled table wrapper
      AdminEmptyState.svelte    Empty state via existing StateCard
      AdminLoading.svelte       Skeleton loading variants (page/table/card)
      AdminError.svelte         Error state with retry (401/403/404/500/offline)
```

### Files modified (2 files)

| File | Change |
|------|--------|
| `frontend/src/routes/+layout.svelte` | Conditionally hide Navbar/Footer/InteractiveBg on `/admin/*` routes |
| `docs/ADMIN_PORTAL_ARCHITECTURE.md` | This appendix |

### Component hierarchy

```
+layout.svelte (root)
  ├── (admin routes) → admin/+layout.svelte
  │     ├── AdminGuard (auth check + role verification)
  │     │     ├── not loaded → spinner
  │     │     ├── forbidden → "Access Denied" screen
  │     │     └── ready → AdminLayout
  │     │           ├── AdminSidebar (fixed left, mobile overlay)
  │     │           ├── AdminHeader
  │     │           │     ├── Sidebar toggle (mobile)
  │     │           │     ├── AdminBreadcrumbs
  │     │           │     ├── AdminSearch (UI only)
  │     │           │     ├── AdminNotificationMenu (UI only)
  │     │           │     ├── Theme toggle
  │     │           │     ├── Admin profile
  │     │           │     └── Logout button
  │     │           └── <main>@render children()</main>
  │     └── page content (wrapped in AdminLayout)
  └── (public routes) → Navbar + Footer + children
```

### Authentication flow

```
Admin → /admin/login → POST /api/auth/sign-in/email (Better Auth)
  → session cookie set
  → if role !== 'admin': signOut() + redirect /admin/login?error=forbidden
  → if role === 'admin': goto /admin
```

### Route guard flow

```
Request to /admin/*
  → root layout renders without Navbar/Footer
  → admin/+layout.svelte:
      authState.loaded? → no → spinner
      is login page? → yes → render (no guard)
      user exists? → no → redirect /admin/login
      user.role !== 'admin'? → signOut + redirect /admin/login?error=forbidden
      all clear → render AdminLayout + page
```

### Security

- Role verification happens on **every** navigation (layout runs for each route change).
- Customers who somehow reach `/admin/*` are immediately signed out and redirected.
- The admin login page checks role after sign-in and refuses non-admin users.
- Backend will add `requireRole('admin')` middleware when business APIs are implemented.

### Verification

- `svelte-check` — 0 errors, 1 a11y warning (`autofocus` on search, intentional)
- `tsc --noEmit` — 0 errors from admin code (1 pre-existing error in `sitemap.xml/+server.ts`)
- Customer Portal unchanged — root layout condition renders identical template for non-admin routes
- Better Auth unchanged — all auth goes through existing `/api/auth/*` endpoints
- No CSS duplication — reuses existing design system tokens and `ui/` components
- Auth state — uses existing `authState` context; no second auth system created
- Theme — uses existing `themeState` context; no duplication
- Icons — reuses existing `@lucide/svelte` dependency

---

## Appendix: Phase 2 — Admin Dashboard (Implemented)

### Scope

Built the read-only Admin Dashboard as the central business overview, displaying key metrics and recent activity.

### Backend module

```
backend/src/admin/
  index.ts                      Mounts admin routes with requireAuth + requireRole('admin')
  dashboard/
    types.ts                    DashboardResponse, DashboardSummary, widget item types
    repository.ts               SQL queries (aggregate COUNT, indexed LIMIT lookups, no N+1)
    service.ts                  Orchestrates 12 parallel queries via Promise.all
    routes.ts                   GET /api/admin/dashboard endpoint with error handling
```

Mounted at `/api/admin/dashboard`, rate-limited (120/min), protected by `requireAuth` + `requireRole('admin')`.

### Dashboard API

`GET /api/admin/dashboard` returns everything in one request:

```json
{
  "summary": {
    "revenue":      { "total", "paidOrders", "pendingPayments", "failedPayments" },
    "orders":       { "total" },
    "customers":    { "total", "verified", "unverified", "newThisMonth" },
    "downloads":    { "total", "activeTokens", "expiredTokens", "today" },
    "products":     { "published", "inactive", "latest": { "id", "name", "slug" } }
  },
  "recentOrders":   [],  // max 5
  "recentContacts": [],  // max 5
  "recentFeedback": [],  // max 5
  "recentCareers":  [],  // max 5
  "recentEmails":   [],  // max 5
  "recentActivity": [],  // max 10 (from audit_logs)
  "systemHealth":   { "backend", "database", "email", "payments", "storage", "oauth" }
}
```

### SQL query summary

| Data | Query pattern | Indexes used |
|------|--------------|--------------|
| Revenue aggregate | `SUM/COUNT FILTER WHERE status IN (...) FROM purchases` | `idx_purchases_status` |
| Customer count | `COUNT FILTER WHERE role='customer' AND email_verified/created_at` | `idx_users_role` |
| Download count | `COUNT FILTER FROM download_tokens` by expiry/created | PK indexes |
| Product count | `COUNT FILTER FROM products` by active flag | PK |
| Recent orders | `SELECT ... FROM purchases LEFT JOIN users+products ORDER BY created_at DESC LIMIT 5` | `idx_purchases_user_id`, `created_at` PK |
| Recent contacts | `SELECT FROM contact_messages ORDER BY created_at DESC LIMIT 5` | PK |
| Recent feedback | `SELECT FROM feedback ORDER BY created_at DESC LIMIT 5` | PK |
| Recent careers | `SELECT FROM career_applications ORDER BY created_at DESC LIMIT 5` | PK |
| Recent emails | `SELECT FROM email_logs ORDER BY sent_at DESC LIMIT 5` | PK |
| Recent activity | `SELECT FROM audit_logs LEFT JOIN users ORDER BY created_at DESC LIMIT 10` | PK |
| DB health | `SELECT 1` | — |

All 12 queries run concurrently via `Promise.all` in the service layer.

### Frontend page

`frontend/src/routes/admin/dashboard/+page.svelte`

### Widget layout

```
┌─────────────────────────────────────────────────────┐
│ Dashboard (title + description)       [Quick Actions]│
├─────────────────┬───────────────────────────────────┤
│ Summary Cards   │                                   │
│ [Revenue][Orders][Customers][Downloads][Products]   │
├─────────────────┼───────────────────────────────────┤
│ Grid Left       │ Grid Right                        │
│                 │                                   │
│ Revenue         │ Customers (total/verified/unver./  │
│   Total + break │           new this month)         │
│   down by status│                                   │
│                 │ Downloads (total/active/expired/   │
│ Recent Orders   │           today)                  │
│   table (5)     │                                   │
│                 │ Products (published/inactive/      │
│ Recent Messages │           latest product)          │
│   table (5)     │                                   │
│                 │ System Health                      │
│ Recent Feedback │   (status indicators per service)  │
│   table (5)     │                                   │
│                 │ Recent Activity                    │
│ Recent Careers  │   (timeline, last 10 actions)      │
│   table (5)     │                                   │
│                 │                                   │
│ Recent Emails   │                                   │
│   table (5)     │                                   │
└─────────────────┴───────────────────────────────────┘
```

- Desktop: Two-column grid (left = 1fr, right = 320px)
- Tablet: Right column becomes 2-column sub-grid
- Mobile: Single column, summary cards shrink to 160px min

### Component hierarchy

```
dashboard/+page.svelte
  ├── AdminPageHeader (title + quick actions)
  ├── AdminPage (loading / error / success wrapper)
  │     ├── Summary Stats grid
  │     │     └── DashboardStatCard × 5 (revenue, orders, customers, downloads, products)
  │     ├── Grid Left
  │     │     ├── AdminSection × 1 (Revenue: total + paid/pending/failed breakdown)
  │     │     └── AdminSection × 5 (Recent Orders/Contacts/Feedback/Careers/Emails)
  │     │           ├── AdminEmptyState (when empty)
  │     │           └── AdminTableContainer > table (when data exists)
  │     └── Grid Right
  │           ├── AdminSection × 4 (Customers/Downloads/Products/System Health)
  │           └── AdminSection × 1 (Recent Activity: timeline list)
```

### Error handling

- **Loading**: `AdminPage` shows `AdminLoading` skeleton while fetching
- **Global error**: `AdminPage` shows `AdminError` with retry button
- **Empty widgets**: Each table section shows `AdminEmptyState` with contextual message
- **Partial data**: The API returns all-or-nothing; if the endpoint fails, the entire page shows an error. Individual widgets handle their empty states independently.
- **Isolation**: Each widget is a separate block — if one were to fail (handled by the data structure), others remain unaffected

### Files created (5 backend, 2 frontend)

```
backend/src/admin/
  index.ts
  dashboard/
    types.ts
    repository.ts
    service.ts
    routes.ts

frontend/src/
  routes/admin/dashboard/+page.svelte
  lib/admin/components/DashboardStatCard.svelte
```

### Files modified (1 backend, 1 doc)

| File | Change |
|------|--------|
| `backend/src/index.ts` | Imported + mounted `/api/admin/*` with rate limiting |
| `docs/ADMIN_PORTAL_ARCHITECTURE.md` | This appendix |

### Verification

- `bun test` — 78 pass, 0 fail (all existing tests unchanged)
- `tsc --noEmit` — 0 errors from admin code (backend + frontend)
- `svelte-check` — 0 errors, 1 a11y warning (pre-existing autofocus on search)
- Customer Portal unchanged — no modifications to any customer route or component
- Authentication unchanged — uses existing Better Auth + sessionMiddleware
- Role enforcement — `requireAuth` + `requireRole('admin')` on every admin API route
- Single API request — dashboard loads everything in one `GET /api/admin/dashboard`
- Read-only — no mutations, no CRUD, no edit/delete functionality
- No CSS duplication — all styles use existing design tokens; no new global CSS

---

## Appendix: Phase 3 — Product Management (Implemented)

### Scope

Complete CRUD product management module: list, create, edit, publish, unpublish, archive, restore products with full validation, search, filters, pagination, audit logging, and SEO support.

### Database Migration

`backend/migrations/017_add_product_fields.sql`

New columns added to `products` table:

| Column | Type | Default | Constraint |
|--------|------|---------|------------|
| `status` | TEXT | `'published'` | `CHECK (draft/published/archived)` |
| `visibility` | TEXT | `'public'` | `CHECK (public/hidden)` |
| `short_description` | TEXT | — | — |
| `category` | TEXT | `'General'` | — |
| `tags` | JSONB | `'[]'` | — |
| `seo_title` | TEXT | — | — |
| `seo_description` | TEXT | — | — |
| `og_image` | TEXT | — | — |
| `version` | TEXT | `'1.0.0'` | — |
| `release_date` | TIMESTAMPTZ | — | — |
| `release_notes` | TEXT | — | — |

Indexes: `idx_products_status`, `idx_products_category`, `idx_products_visibility`.

The existing `active` boolean is derived from `status` (`published` = `active=true`). Existing rows are migrated: `active=true` → `published`, `active=false` → `archived`.

### Backend Architecture

```
backend/src/admin/products/
  types.ts         Product interfaces, list response/params types
  validation.ts    Zod schemas for create (17 fields) and update (16 fields)
  repository.ts    SQL queries with parameterized filters, pagination, sorting
  service.ts       Business logic, audit logging, error handling
  routes.ts        8 endpoints mounted at /api/admin/products
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/products` | List with `?search`, `?status`, `?visibility`, `?category`, `?sort`, `?page`, `?perPage` |
| `GET` | `/api/admin/products/categories` | Distinct category names |
| `GET` | `/api/admin/products/:id` | Full product detail + audit log |
| `POST` | `/api/admin/products` | Create product (returns 201) |
| `PUT` | `/api/admin/products/:id` | Update product fields |
| `POST` | `/api/admin/products/:id/publish` | Set status → `published` |
| `POST` | `/api/admin/products/:id/unpublish` | Set status → `draft` |
| `POST` | `/api/admin/products/:id/archive` | Set status → `archived` |
| `POST` | `/api/admin/products/:id/restore` | Set status → `draft` |

All endpoints require `requireAuth` + `requireRole('admin')`.

### Audit Events Added

| Event | Trigger |
|-------|---------|
| `product_created` | POST create |
| `product_updated` | PUT update |
| `product_published` | POST publish |
| `product_unpublished` | POST unpublish |
| `product_archived` | POST archive |
| `product_restored` | POST restore |

Events logged via `backend/src/audit/service.ts` → `insertAuditLog()` with user ID, product metadata, IP, and user agent.

### Frontend Architecture

```
frontend/src/routes/admin/products/
  +page.svelte              List page (search, filters, sort, pagination)
  new/+page.svelte          Create product form
  [id]/+page.svelte         Product detail (read-only)
  [id]/edit/+page.svelte    Edit product form

frontend/src/lib/admin/components/
  ProductForm.svelte        Reusable create/edit form with all fields
  ProductStatusBadge.svelte Color-coded status badge (draft/published/archived)
  TagInput.svelte           Tag input with add/remove/keyboard support
```

### Component Hierarchy

```
Products List (+page.svelte)
  AdminPageHeader (title + "New Product" button)
  AdminPage (loading/error/content)
    Search bar + filter toggle
    Filters bar (status, visibility, category, sort)
    AdminTableContainer > table (name, slug, price, status, visibility, category, version, updated)
    Pagination (page nav, info)

Product Detail ([id]/+page.svelte)
  AdminPageHeader (back, edit, publish/unpublish/archive/restore buttons)
  AdminPage (loading/error/content)
    Grid Left:
      SectionCard "Overview" (name, slug, description, category, tags)
      SectionCard "Pricing" (price, type)
      SectionCard "SEO" (title, description, og_image)
      AdminSection "Audit Summary" (table)
    Grid Right:
      SectionCard "Status & Visibility" (status badge, visibility, created, updated)
      SectionCard "Versions" (current version, release date)
      SectionCard "Release Notes" (if exists)
      SectionCard "Statistics" (download key)
  Dialog × 4 (publish, unpublish, archive, restore confirmations)

Create/Edit (new/+page.svelte, [id]/edit/+page.svelte)
  AdminPageHeader
  AdminPage
    AdminSection
      ProductForm (reusable)
        2-column grid
        Column 1: name, slug, short_description, description, category, tags
        Column 2: price+currency, status, visibility, version, download_key, release_date, release_notes, SEO settings
        Actions: Cancel + Submit
```

### Validation Rules

| Field | Rules |
|-------|-------|
| `name` | Required, max 255 chars, trimmed |
| `slug` | Required, max 255 chars, lowercase alphanumeric + hyphens, unique |
| `price` | Required, integer ≥ 0 |
| `currency` | Max 10 chars, default `INR` |
| `short_description` | Max 500 chars |
| `description` | Free text |
| `category` | Max 100 chars, default `General` |
| `tags` | Array of strings, max 20 tags, each max 50 chars |
| `visibility` | Enum: `public` or `hidden` |
| `status` | Enum: `draft`, `published`, `archived` |
| `seo_title` | Max 255 chars |
| `seo_description` | Max 500 chars |
| `og_image` | Max 1000 chars |
| `version` | Required, min 1, max 50 chars, default `1.0.0` |
| `slug` | Regex: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` |

### Product List Features

- **Search**: ILIKE on name and slug
- **Status filter**: draft/published/archived
- **Visibility filter**: public/hidden
- **Category filter**: dynamic from DB
- **Sort**: newest, oldest, updated, price, name
- **Pagination**: server-side, configurable perPage (default 20, max 100)
- **States**: loading (skeleton), empty (contextual message), error (retry)

### Product Status Lifecycle

```
    ┌─────────┐
    │  Draft  │
    └────┬────┘
         │ publish     ┌──────────┐
    ┌────▼────┐  ────► │ Archived │
    │Published│  archive└──────────┘
    └────┬────┘            │ restore
         │ unpublish   ┌───▼────┐
    ┌────▼────┐        │  Draft  │
    │  Draft  │        └────────┘
    └─────────┘
```

- Only `published` products are visible to customers via `WHERE active = true`
- `archived` is soft-delete — products remain in DB with full history
- `restore` brings archived products back to `draft`

### Performance

- Server-side pagination with `LIMIT/OFFSET`
- Filtered queries use indexed columns (`status`, `category`, `visibility`)
- Parallel queries where applicable
- No N+1 queries — each list/detail endpoint makes 1-2 DB calls
- `getProductAuditLog` limited to 50 recent entries

### Files Created (7 backend, 6 frontend = 13 total)

```
backend/migrations/017_add_product_fields.sql

backend/src/admin/products/
  types.ts
  validation.ts
  repository.ts
  service.ts
  routes.ts

frontend/src/routes/admin/products/
  +page.svelte
  new/+page.svelte
  [id]/+page.svelte
  [id]/edit/+page.svelte

frontend/src/lib/admin/components/
  ProductForm.svelte
  ProductStatusBadge.svelte
  TagInput.svelte
```

### Files Modified (4)

| File | Change |
|------|--------|
| `backend/src/admin/index.ts` | Mounted `/products` routes |
| `backend/src/audit/types.ts` | Added 6 product audit events |
| `backend/src/audit/service.ts` | Added `recordProductEvent()` |
| `backend/src/admin/dashboard/repository.ts` | Updated product summary to use `status` column |
| `docs/ADMIN_PORTAL_ARCHITECTURE.md` | This appendix |

### Verification

- `bun run tsc --noEmit` — 0 errors (backend)
- `bun test` — 78 pass, 0 fail
- `svelte-check` — 0 errors, 1 pre-existing a11y warning
- Customer Portal unchanged — no modifications to customer routes or components
- Dashboard unchanged — product stats still work with new `status` column
- Better Auth unchanged — auth still goes through existing `/api/auth/*` endpoints
- Role enforcement — `requireAuth` + `requireRole('admin')` on every product route
- All mutations create audit log entries
- All user inputs validated via Zod schemas
- Soft delete only — archive never permanently deletes products
- No duplicated UI — all components reuse existing admin primitives
- No CSS duplication — all styles use existing design tokens
- Accessible forms — labels, error messages, keyboard navigation, aria attributes

---

## Appendix: Phase 4 — Orders & Payments (Implemented)

### Scope

Read-only operational views for orders (purchases) and payments (purchase + Razorpay details). Admins can inspect the complete payment lifecycle, view receipts, audit refunds (internal records), browse payment failures, and review payment timelines.

No modifications to the existing customer purchase flow or Razorpay integration.

### Backend Modules

```
backend/src/admin/
  orders/
    types.ts         OrderListItem, OrderDetail, OrderListParams, OrderListResponse,
                     OrderEntitlement, OrderDownloadToken, OrderEmailLog, OrderAuditEntry
    validation.ts    Zod schema: orderListParamsSchema (search, status, date range, customer, product, sort, pagination)
    repository.ts    SQL: listOrders (7 filters + sort + paginate), getOrderById, getEntitlementsByPurchaseId,
                     getDownloadTokensByPurchaseId, getEmailLogsByPurchase, getAuditLogByEntity, getProductOptions
    service.ts       listOrders (paginated), getOrder (detail + entitlements + tokens + emails + audit),
                     recordOrderViewed, recordPaymentViewed, recordReceiptViewed
    routes.ts        GET /api/admin/orders (list), GET /api/admin/orders/options (filters),
                     GET /api/admin/orders/:id (detail)

  payments/
    types.ts         PaymentListItem, PaymentDetail, PaymentListParams, PaymentListResponse,
                     PaymentAuditEntry, RefundInfo, ReceiptInfo
    validation.ts    Zod schema: paymentListParamsSchema (search, status, date range, customer, product, sort, pagination)
    repository.ts    SQL: listPayments (7 filters + sort + paginate), getPaymentById, getRefundInfo,
                     getReceiptInfo, getPaymentAuditLog, getProductOptions
    service.ts       listPayments (paginated), getPayment (detail + refund + receipt + audit),
                     recordPaymentViewed, recordReceiptViewed
    routes.ts        GET /api/admin/payments (list), GET /api/admin/payments/options (filters),
                     GET /api/admin/payments/:id (detail)
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/orders` | Admin | List with `?search`, `?status`, `?dateFrom`, `?dateTo`, `?customer`, `?product`, `?sort`, `?page`, `?perPage` |
| `GET` | `/api/admin/orders/options` | Admin | Filter options (`products[]`, `statuses[]`) |
| `GET` | `/api/admin/orders/:id` | Admin | Order detail + entitlements + download tokens + email logs + audit timeline |
| `GET` | `/api/admin/payments` | Admin | List with same search/filter/sort/pagination params |
| `GET` | `/api/admin/payments/options` | Admin | Filter options (`products[]`) |
| `GET` | `/api/admin/payments/:id` | Admin | Payment detail + refund info + receipt info + audit timeline |

All endpoints are read-only, protected by `requireAuth` + `requireRole('admin')`.

### Data Model

Since there is no separate `orders` or `payments` table, both modules read from the existing `purchases` table:

| Table | Role |
|-------|------|
| `purchases` | Core order + payment record (status: created → paid → failed/refunded) |
| `users` | Customer name + email (via `user_id` FK) |
| `products` | Product name, slug, description (via `product_id` FK) |
| `entitlements` | Entitlements granted per purchase |
| `download_tokens` | Download tokens generated per purchase |
| `email_logs` | Receipt / download emails sent (matched by recipient email + metadata) |
| `audit_logs` | Admin view events + existing payment lifecycle events |

### Refund Architecture (Current)

Refunds are **internal records only** — the `purchases` table has a `refunded` status, set by the existing `refundPurchase()` function in `purchase.service.ts` (triggered via Razorpay webhook). No admin-initiated refund API exists yet.

**Design for future Razorpay refund API integration:**
- The `GET /api/admin/payments/:id` response includes a `refund` object: `{ status, refunded_at, refund_amount, refund_reason }`
- When `status !== 'refunded'`, the detail page shows "Not Refunded" with a placeholder note
- A future `POST /api/admin/payments/:id/refund` endpoint (designed in §7.4) will call the Razorpay refund API and update the purchase status

### Receipt Display

Receipts are rendered from existing `purchases` data via the `ReceiptCard` component. No PDF generation yet — receipt data is displayed inline.

Fields displayed:
- Receipt Number (`purchase.id` truncated to 8 chars)
- Purchase Date
- Product Name
- Customer
- Total Amount + Currency
- Razorpay Payment ID
- Razorpay Order ID

### Payment Failures

The payment detail page shows a "Failure Details" section when `status === 'failed'`:
- Failure Reason (parsed from audit metadata `gateway_message` or `reason`)
- Attempt Count (count of `payment_initiated` / `payment_attempt` events in audit)
- Retry Possible — always "Yes" (customer can retry from product page)

### Audit Events Added

| Event | Trigger |
|-------|---------|
| `order_viewed` | Admin views order detail |
| `payment_viewed` | Admin views payment detail |
| `receipt_viewed` | Admin views receipt tab |

Events are recorded via `audit/service.ts` → `insertAuditLog()` with admin user ID, entity metadata, IP, and user agent. Only meaningful admin view actions are logged — no excessive audit noise.

### Frontend Architecture

```
frontend/src/routes/admin/orders/
  +page.svelte              List page (search, 5 filters, sort, pagination)
  [id]/+page.svelte         Detail page (overview + audit timeline tabs)

frontend/src/routes/admin/payments/
  +page.svelte              List page (search, 4 filters, sort, pagination)
  [id]/+page.svelte         Detail page (details + receipt + timeline tabs)

frontend/src/lib/admin/components/
  OrderStatusBadge.svelte   Color-coded badge (created=blue, paid=green, failed=red, refunded=purple)
  PaymentStatusBadge.svelte Color-coded badge (same as order)
  PaymentTimeline.svelte    Chronological event list with icons (eye, check, x, credit-card, download, mail, rotate-ccw)
  ReceiptCard.svelte        Structured receipt display with key-value rows + total
```

### Component Hierarchy

```
Orders List (+page.svelte)
  AdminPageHeader (title + "View Payments" button)
  AdminPage (loading/error/content)
    Search bar + filter toggle
    Filters bar (status, product, date range, sort)
    AdminTableContainer > table (order ID, customer, product, amount, status, payment method, date)
    Pagination (page nav, info)

Order Detail ([id]/+page.svelte)
  AdminPageHeader (back + "View Payment" button)
  AdminPage (loading/error/content)
    Tab bar (Overview | Audit Timeline)
    Overview tab:
      Grid Left:
        SectionCard "Order Information" (ID, status, created, updated)
        SectionCard "Customer Information" (name, email, user ID)
        SectionCard "Product" (name, slug)
        SectionCard "Payment Information" (amount, currency, gateway, Razorpay IDs, signature)
      Grid Right:
        SectionCard "Download Tokens" (table: token, expires, status)
        SectionCard "Entitlements" (table: granted, status)
        SectionCard "Emails Sent" (table: template, status, sent)
        SectionCard "Internal Notes" (read-only placeholder)
    Audit tab:
      AdminSection "Audit Timeline" (PaymentTimeline component)

Payments List (+page.svelte)
  AdminPageHeader (title + "View Orders" button)
  AdminPage (loading/error/content)
    Search bar + filter toggle
    Filters bar (status, product, date range, sort)
    AdminTableContainer > table (payment ID, order, customer, amount, currency, gateway, status, created)
    Pagination

Payment Detail ([id]/+page.svelte)
  AdminPageHeader (back + "View Order" button)
  AdminPage (loading/error/content)
    Tab bar (Details | Receipt | Timeline)
    Details tab:
      Grid Left:
        SectionCard "Payment Information" (ID, status, amount, currency, gateway, created, updated)
        SectionCard "Transaction Details" (Razorpay order ID, payment ID, signature)
        SectionCard "Failure Details" (if failed: reason, attempts, retry)
        SectionCard "Refund Information" (if refunded: status, amount, date, reason)
      Grid Right:
        SectionCard "Customer" (name, email)
        SectionCard "Product" (name, slug)
        SectionCard "Refund" (if not refunded: "Not Refunded" placeholder)
    Receipt tab:
      ReceiptCard component
    Timeline tab:
      AdminSection "Payment Timeline" (table: event, user, date)
```

### Search & Filter Capabilities

| Feature | Orders | Payments |
|---------|--------|----------|
| Search | ILIKE on order ID, customer name, email, Razorpay order ID, Razorpay payment ID, product name | Same |
| Status filter | created/paid/failed/refunded | Same |
| Product filter | Dynamic from DB (published products) | Same |
| Date range | From/To timestamptz | Same |
| Customer filter | ILIKE on name/email | — |
| Sort | newest, oldest, amount, status | Same |
| Pagination | Server-side, default 20, max 100 | Same |

### Dashboard Integration

- Revenue stat card already linked to `/admin/orders` (from Phase 2)
- Orders stat card already linked to `/admin/orders` (from Phase 2)
- Recent Orders table rows now clickable → navigates to `/admin/orders/:id`

### Shared Components Reused

- **AdminPage** — loading/error/content state container
- **AdminPageHeader** — title + description + action buttons
- **AdminSection** — glass card section wrapper
- **AdminTableContainer** — styled table wrapper
- **AdminEmptyState** — empty state with contextual message
- **Alert** — error/success messages
- **Skeleton** — loading placeholders (via AdminPage)
- **Button** — action buttons
- **Input** — search input + select filters
- **SectionCard** — detail section cards

### Accessibility

- Keyboard navigation: all clickable rows handle `Enter` key
- aria-live regions: loading/error states (AdminPage)
- role="alert": error messages
- Focus management: tab order follows visual layout
- Semantic HTML: `<nav>`, `<table>`, `<section>` with aria-labels

### Performance

- Server-side pagination with `LIMIT/OFFSET`
- Filtered queries use indexed columns (`purchases.status`, `purchases.created_at`, `purchases.user_id`)
- Parallel reads: order detail fetches entitlements, tokens, emails, and audit concurrently via `Promise.all`
- No N+1 queries — each list endpoint makes 2 DB calls (count + data), each detail endpoint makes 5
- Fetch only required columns (not `SELECT *` in list queries)
- Audit log queries limited to 100 recent entries
- Read-only — no write locks or mutations

### Files Created (10 backend, 4 frontend, 4 components = 18 total)

```
backend/src/admin/orders/
  types.ts
  validation.ts
  repository.ts
  service.ts
  routes.ts

backend/src/admin/payments/
  types.ts
  validation.ts
  repository.ts
  service.ts
  routes.ts

frontend/src/routes/admin/orders/
  +page.svelte
  [id]/+page.svelte

frontend/src/routes/admin/payments/
  +page.svelte
  [id]/+page.svelte

frontend/src/lib/admin/components/
  OrderStatusBadge.svelte
  PaymentStatusBadge.svelte
  PaymentTimeline.svelte
  ReceiptCard.svelte
```

### Files Modified (5)

| File | Change |
|------|--------|
| `backend/src/admin/index.ts` | Mounted `/orders` and `/payments` routes |
| `backend/src/audit/types.ts` | Added `order_viewed`, `payment_viewed`, `receipt_viewed` audit events |
| `frontend/src/routes/admin/dashboard/+page.svelte` | Made Recent Orders table rows clickable (navigate to order detail) |
| `docs/ADMIN_PORTAL_ARCHITECTURE.md` | This appendix (Phase 4) |

### Verification

- `bun run tsc --noEmit` — 0 errors (backend)
- `bun test` — all tests pass (no existing tests broken)
- `svelte-check` — 0 errors, 0 warnings
- Customer Portal unchanged — no modifications to customer routes or components
- Razorpay flow unchanged — existing payment routes (create-order, verify, webhooks) untouched
- Existing purchase flow unchanged — `purchase.service.ts`, `razorpay.service.ts` not modified
- Existing downloads unchanged — `downloads` routes and tokens unaffected
- Existing receipts unchanged — receipts use existing `purchases` data, no new storage
- Existing webhooks unchanged — webhook routes handle refund/capture without admin involvement
- Only ADMIN can access new routes — `requireAuth` + `requireRole('admin')` on every endpoint
- All view actions create audit log entries (order viewed, payment viewed, receipt viewed)
- Read-only — no write endpoints for financial data
- No duplicated UI — all components reuse existing admin primitives
- No CSS duplication — all styles use existing design tokens

---

## Appendix: Phase 5 — Customer Management (Implemented)

### Scope

Complete Customer Management module for viewing customer profiles, purchase history, download activity, sessions, and performing administrative actions (suspend, reactivate, delete, resend verification, request password reset, revoke sessions).

No changes to customer-facing authentication, Better Auth, or the customer portal.

### Backend Module

```
backend/src/admin/customers/
  types.ts         CustomerListItem, CustomerDetail, CustomerListParams, CustomerListResponse,
                   CustomerPurchase, CustomerDownload, CustomerSession, CustomerActivity
  validation.ts    Zod schema: customerListParamsSchema (search, status, sort, pagination)
  repository.ts    SQL: listCustomers (search + status filter + sort + paginate), getCustomerById,
                   getCustomerPurchases, getCustomerDownloads, getCustomerSessions, getCustomerActivity,
                   verifyCustomerEmail, updateCustomerStatus, deleteCustomer,
                   requestPasswordResetForCustomer, revokeAllCustomerSessions
  service.ts       listCustomers (paginated), getCustomer (detail + purchases + downloads + sessions + activity),
                   suspendCustomer, reactivateCustomer, deleteCustomer, resendVerificationEmail,
                   requestPasswordReset, revokeSessions, recordCustomerViewed
  routes.ts        GET /api/admin/customers (list), GET /api/admin/customers/:id (detail),
                   POST /:id/suspend, POST /:id/reactivate, DELETE /:id,
                   POST /:id/resend-verification, POST /:id/request-password-reset,
                   POST /:id/revoke-sessions
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/customers` | Admin | List with `?search`, `?status`, `?sort`, `?page`, `?perPage` |
| `GET` | `/api/admin/customers/:id` | Admin | Customer detail + purchases + downloads + sessions + activity |
| `POST` | `/api/admin/customers/:id/suspend` | Admin | Set `status = 'SUSPENDED'` |
| `POST` | `/api/admin/customers/:id/reactivate` | Admin | Set `status = 'ACTIVE'` |
| `DELETE` | `/api/admin/customers/:id` | Admin | Soft-delete (set `deleted_at = NOW()`) |
| `POST` | `/api/admin/customers/:id/resend-verification` | Admin | Better Auth `sendVerificationEmail()` |
| `POST` | `/api/admin/customers/:id/request-password-reset` | Admin | Better Auth `requestPasswordReset()` |
| `POST` | `/api/admin/customers/:id/revoke-sessions` | Admin | Delete all customer sessions |

All endpoints require `requireAuth` + `requireRole('admin')`.

### Customer Data Model

| Data | Source Table | Query |
|------|-------------|-------|
| Customer list | `users WHERE role = 'customer'` | ILIKE on name/email, status filter, sort by created/name/email/status/purchases |
| Customer detail | `users` | Single row by ID |
| Purchases | `purchases JOIN products` | Limit 50, most recent first |
| Downloads | `download_tokens JOIN products` | Limit 50, most recent first |
| Sessions | `session` table | Direct SQL, all active sessions |
| Activity | `purchases` + `download_tokens` + `audit_logs` | Union of 3 event sources, limit 100 |

### Admin Actions

| Action | Confirmation Required | Effect |
|--------|-----------------------|--------|
| Suspend | Yes | Sets `status = 'SUSPENDED'` — customer can't log in |
| Reactivate | Yes | Sets `status = 'ACTIVE'` — restores login ability |
| Delete | Yes | Sets `deleted_at = NOW()` — account persisted but disabled |
| Resend Verification | Yes | Better Auth sends verification email |
| Request Password Reset | Yes | Better Auth sends password reset email |
| Revoke Sessions | Yes | Deletes all rows from `session` table for this user |

### Better Auth Integration

| Action | Better Auth API | Notes |
|--------|-----------------|-------|
| Resend Verification | `auth.api.sendVerificationEmail(email)` | Cast as `any` — not in v1.1.x TS types |
| Request Password Reset | `auth.api.requestPasswordReset(email)` | Cast as `any` — same reason |
| List Sessions | Direct `session` table SQL | No Better Auth API for listing by user |
| Revoke Sessions | Direct `session` table `DELETE` | No Better Auth API for bulk revoke |

Better Auth v1.1.x does not export typed admin methods for email verification or password reset. The calls are made via `(auth.api as any).sendVerificationEmail(...)` and wrapped in try/catch. A `@ts-ignore` comment documents the version constraint.

### Audit Events Added

| Event | Trigger |
|-------|---------|
| `customer_viewed` | Admin views customer detail |
| `customer_suspended` | Admin suspends customer |
| `customer_reactivated` | Admin reactivates customer |
| `customer_deleted` | Admin deletes customer |
| `verification_resent` | Admin resends verification email |
| `password_reset_requested` | Admin requests password reset |
| `customer_sessions_revoked` | Admin revokes sessions |

Events record the target `user_id` in metadata.

### Frontend Architecture

```
frontend/src/routes/admin/customers/
  +page.svelte              List page (search, 4 filters, sort, pagination)
  [id]/+page.svelte         Detail page (6 tabs with admin actions)

frontend/src/lib/admin/components/
  CustomerStatusBadge.svelte    Color-coded badge (ACTIVE=green, SUSPENDED=red, UNVERIFIED=amber)
  SessionTable.svelte           Session list with device info + created/expiry dates
  CustomerOverviewCard.svelte   Summary: name, email, status, created, last sign-in, unverified badge
  ActivityTimeline.svelte       Chronological event timeline (purchases, downloads, audit)
```

### Component Hierarchy

```
Customers List (+page.svelte)
  AdminPageHeader (title + total customer count)
  AdminPage (loading/error/content)
    Search bar + filter toggle
    Filters bar (status, sort)
    AdminTableContainer > table (name, email, status, purchases count, created)
    Pagination (page nav, info)

Customer Detail ([id]/+page.svelte)
  AdminPageHeader (title + actions dropdown)
  AdminPage (loading/error/content)
    CustomerOverviewCard (name, email, status, created, last sign-in)
    Tab bar (Overview | Purchases | Downloads | Sessions | Activity | Audit)
    Overview tab:
      SectionCard "Customer Summary" (status, email verified, created, last sign-in, purchases count)
      SectionCard "Admin Actions" (6 action buttons with confirmation dialogs)
    Purchases tab: AdminTableContainer > table (order, product, amount, status, date)
    Downloads tab: AdminTableContainer > table (token, product, status, expires, created)
    Sessions tab: SessionTable > table (device, IP, created, expires, revoke all button)
    Activity tab: ActivityTimeline (chronological: purchases, downloads, admin actions)
    Audit tab: AdminTableContainer > table (event, details, admin, date)
  Dialog × 6 (confirmation dialogs for each admin action)
```

### Admin Actions Workflow

```
Admin clicks action button (e.g. "Suspend")
  → Confirmation dialog appears (title, description, confirm/cancel buttons)
  → Admin clicks confirm
  → API call to /api/admin/customers/:id/suspend
  → Success: toast notification + page data reloaded
  → Error: toast with error message
```

### Search & Filter Capabilities

| Feature | Customers |
|---------|-----------|
| Search | ILIKE on name and email |
| Status filter | active / suspended / unverified / all |
| Sort | newest, oldest, name, email, status, most purchases |
| Pagination | Server-side, default 20, max 100 |

### Reused Existing Components

- `AdminPage`, `AdminPageHeader`, `AdminSection`, `AdminTableContainer`, `AdminEmptyState`
- `SectionCard`, `Button`, `Input`, `Modal` (confirm/cancel dialogs)
- Generic status badge pattern adapted for customer status

### Experience & Edge Cases

- **Loading state**: Skeleton placeholders using `AdminLoading` for all 5 parallel fetches
- **Error state**: `AdminError` with retry button per section
- **Empty state**: `AdminEmptyState` with contextual message per tab
- **Deleted customer**: Shows `deleted_at` timestamp, no admin actions available
- **No sessions**: "No active sessions" empty state
- **No purchases**: "No purchases yet" empty state
- **No activity**: "No activity recorded" empty state
- **Long names/emails**: CSS text-overflow ellipsis in tables
- **Many sessions**: Paginated display in SessionTable (default 20, max 100)
- **Network failure during action**: Toast error + retry available

### Customer Status Lifecycle

```
                  ┌──────────┐
            ┌────►│  ACTIVE  │◄────┐
            │     └──────────┘     │
            │  reactivate    reactivate
            │                     │
       ┌────┴──────┐        ┌────┴──────────┐
       │  SUSPENDED │        │  UNVERIFIED   │
       └───────────┘        └───────────────┘
                                    │
                              verify email
                                    │
                              ┌─────▼──────┐
                              │   ACTIVE    │
                              └────────────┘

       Any status → DELETE → deleted_at set (soft-delete)
```

- `UNVERIFIED`: Email not verified (email_verified_at is NULL)
- `ACTIVE`: Email verified, account in good standing
- `SUSPENDED`: Admin-suspended, cannot log in
- `deleted_at`: Soft-deleted — account disabled and hidden from active lists

### Performance

- Server-side pagination with `LIMIT/OFFSET`
- Indexed queries — `users.role` indexed, `users.status` indexed, `users.email` indexed
- Parallel reads: customer detail fetches purchases, downloads, sessions, and activity concurrently via `Promise.all`
- No N+1 queries — list query uses LEFT JOIN + aggregate count
- Fetch only required columns — list query avoids `SELECT *`
- Activity query limited to 100 events
- Sessions query limited to 50

### Files Created (5 backend, 2 frontend, 4 components = 11 total)

```
backend/src/admin/customers/
  types.ts
  validation.ts
  repository.ts
  service.ts
  routes.ts

frontend/src/routes/admin/customers/
  +page.svelte
  [id]/+page.svelte

frontend/src/lib/admin/components/
  CustomerStatusBadge.svelte
  SessionTable.svelte
  CustomerOverviewCard.svelte
  ActivityTimeline.svelte
```

### Files Modified (3)

| File | Change |
|------|--------|
| `backend/src/admin/index.ts` | Mounted `/customers` routes |
| `backend/src/audit/types.ts` | Added 7 customer audit events |
| `docs/ADMIN_PORTAL_ARCHITECTURE.md` | This appendix (Phase 5) |

### Verification

- `bun run tsc --noEmit` — 0 errors (backend)
- `bun test` — 78 pass, 0 fail (all existing tests unchanged)
- `svelte-check` — 0 errors, 3 pre-existing warnings (2x .danger-btn, 1x autofocus)
- Customer Portal unchanged — no modifications to customer routes or components
- Better Auth unchanged — only admin-initiated email operations via existing APIs
- OAuth unchanged — Google OAuth for customer login not modified
- Email system unchanged — email templates and sending logic not modified
- Password reset flow unchanged — uses existing Better Auth `requestPasswordReset()`
- Session management unchanged — direct DB operations for list/revoke, no session infra changes
- Only ADMIN can access customer routes — `requireAuth` + `requireRole('admin')` on every endpoint
- All admin actions create audit log entries with target `user_id`
- All soft-delete operations reversible by DB admin
- No secrets exposed — passwords, tokens, and sensitive auth data never returned in API responses

---

## Appendix: Phase 6 — Download Management (Implemented)

### Scope

Complete Download Management module for inspecting download tokens, token lifecycle, download history, and performing safe token administration (revoke, regenerate).

No changes to the customer download flow, token generation logic, or entitlement system.

### Backend Module

```
backend/src/admin/downloads/
  types.ts         DownloadTokenStatus, DownloadListItem, DownloadDetail, DownloadHistoryEntry,
                   DownloadAuditEntry, DownloadListResponse, DownloadListParams,
                   DownloadDetailResponse, DownloadFilterOptions
  validation.ts    Zod schema: downloadListParamsSchema (search, status, product, sort, pagination)
  repository.ts    SQL: listDownloads, getDownloadById, getDownloadHistory, getDownloadAuditLog,
                   revokeDownloadToken, getProductOptions, getPurchaseIdByTokenId
  service.ts       listDownloads, getDownload, getDownloadHistory, getFilterOptions,
                   revokeToken, regenerateToken (reuses purchaseService.generateDownloadToken),
                   recordDownloadViewed
  routes.ts        GET /api/admin/downloads (list), GET /api/admin/downloads/options,
                   GET /api/admin/downloads/:id (detail), GET /:id/history,
                   POST /:id/revoke, POST /:id/regenerate
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/downloads` | Admin | List with `?search`, `?status`, `?product`, `?sort`, `?page`, `?perPage` |
| `GET` | `/api/admin/downloads/options` | Admin | Filter options (`products[]`) |
| `GET` | `/api/admin/downloads/:id` | Admin | Download detail + history + audit |
| `GET` | `/api/admin/downloads/:id/history` | Admin | Chronological history of token events |
| `POST` | `/api/admin/downloads/:id/revoke` | Admin | Set `expires_at = NOW()` on token |
| `POST` | `/api/admin/downloads/:id/regenerate` | Admin | Expire old token + create new via `purchaseService.generateDownloadToken()` |

All endpoints require `requireAuth` + `requireRole('admin')`.

### Data Model

| Data | Source Table | Query |
|------|-------------|-------|
| Download list | `download_tokens` + `purchases` + `users` + `products` | LEFT JOIN chain with correlated subquery for `tokens_count` |
| Download detail | `download_tokens` + `purchases` + `users` + `products` | Single row with token count subquery |
| Token history | `email_logs` + `audit_logs` | Union of: token creation, email sent, admin actions (revoke/regenerate) |
| Token audit | `audit_logs` | Admin actions filtered by `download_token_id` or `purchase_id` |

### Token Status Lifecycle

```
Token Created  →  Active (expires_at > NOW())
                →  Expired (expires_at <= NOW(), natural expiry)
                →  Revoked (expires_at set to NOW() by admin action)
                      ↓
                Regenerate → New token created, old one revoked
```

- **Active**: Token is valid for download (expires_at in the future)
- **Expired**: Token naturally expired (expires_at passed)
- **Revoked**: Token invalidated by admin or refund (expires_at forced to past)
- Revoke and Regenerate both set `expires_at = NOW()` on the old token
- Regenerate calls the existing `purchaseService.generateDownloadToken()` to create a new token

### Admin Actions

| Action | Effect | Confirmation Required |
|--------|--------|----------------------|
| Revoke | Immediately invalidates token (`expires_at = NOW()`) | Yes |
| Regenerate | Invalidates old token + creates new one for same purchase/product | Yes |

Both actions preserve the entitlement — only the token is affected.

### Audit Events Added

| Event | Trigger |
|-------|---------|
| `download_viewed` | Admin views download detail |
| `token_revoked` | Admin revokes a download token |
| `token_regenerated` | Admin regenerates a token (old → new) |

Events record `download_token_id`, `purchase_id`, and for regeneration, `new_token_id` in metadata.

### Frontend Architecture

```
frontend/src/routes/admin/downloads/
  +page.svelte              List page (search, 2 filters, sort, pagination)
  [id]/+page.svelte         Detail page (3 tabs: overview, history, audit)

frontend/src/lib/admin/components/
  DownloadStatusBadge.svelte   Color-coded badge (active=green, expired=amber, revoked=red)
  DownloadTokenCard.svelte     Token display with copy-to-clipboard + expiry info
  DownloadHistoryTable.svelte  Chronological event table (event, description, actor, date)
```

### Component Hierarchy

```
Downloads List (+page.svelte)
  AdminPageHeader (title + total token count)
  AdminPage (loading/error/content)
    Search bar + filter toggle
    Filters bar (status, product, sort)
    AdminTableContainer > table (product, customer, token, status, tokens count, expires, created)
    Pagination (page nav, info)

Download Detail ([id]/+page.svelte)
  AdminPageHeader (title + "View Order" + "View Customer" buttons)
  Alert (success/error after admin action; new token display after regenerate)
  AdminPage (loading/error/content)
    Tab bar (Overview | History | Audit)
    Overview tab:
      Grid Left:
        SectionCard "Overview" (status badge, created, expires, total tokens count)
        SectionCard "Customer" (name, email, "View Customer" link)
        SectionCard "Product" (name, slug, "View Product" link)
      Grid Right:
        SectionCard "Download Token" (DownloadTokenCard with copy-to-clipboard)
        SectionCard "Admin Actions" (Revoke + Regenerate buttons with confirmation dialog)
    History tab:
      AdminSection "Token History" (DownloadHistoryTable)
    Audit tab:
      AdminSection "Audit Log" (AdminTableContainer: event, admin, details, date)
```

### Search & Filter Capabilities

| Feature | Downloads |
|---------|-----------|
| Search | ILIKE on customer name, email, product name, token value |
| Status filter | active / expired |
| Product filter | Dynamic from DB (products with tokens) |
| Sort | newest, oldest, expiring soon, most tokens |
| Pagination | Server-side, default 20, max 100 |

### Reused Existing Components

- `AdminPage`, `AdminPageHeader`, `AdminSection`, `AdminTableContainer`, `AdminEmptyState`
- `SectionCard`, `Button`, `Input`
- `ActivityTimeline` — available for future use

### Dashboard Integration

- Downloads stat card already linked to `/admin/downloads` (from Phase 2)
- Active Downloads count in the Downloads widget now clickable → links to `/admin/downloads?status=active`

### Performance

- Server-side pagination with `LIMIT/OFFSET`
- Indexed queries — `download_tokens.purchase_id` indexed, `download_tokens.expires_at` indexed
- Parallel reads: download detail fetches history and audit concurrently via `Promise.all`
- No N+1 queries — list query uses a single correlated subquery for token count
- Fetch only required columns — list query avoids `SELECT *`
- History query limited to 100 events
- All read queries use indexed columns

### Files Created (5 backend, 2 frontend, 3 components = 10 total)

```
backend/src/admin/downloads/
  types.ts
  validation.ts
  repository.ts
  service.ts
  routes.ts

frontend/src/routes/admin/downloads/
  +page.svelte
  [id]/+page.svelte

frontend/src/lib/admin/components/
  DownloadStatusBadge.svelte
  DownloadTokenCard.svelte
  DownloadHistoryTable.svelte
```

### Files Modified (4)

| File | Change |
|------|--------|
| `backend/src/admin/index.ts` | Mounted `/downloads` routes |
| `backend/src/audit/types.ts` | Added `download_viewed`, `token_revoked`, `token_regenerated` audit events |
| `frontend/src/routes/admin/dashboard/+page.svelte` | Active Downloads stat in widget now clickable with status filter |
| `docs/ADMIN_PORTAL_ARCHITECTURE.md` | This appendix (Phase 6) |

### Verification

- `bun run tsc --noEmit` — 0 errors (backend)
- `bun test` — 78 pass, 0 fail (all existing tests unchanged)
- `svelte-check` — 0 errors, 3 pre-existing warnings
- Customer Portal unchanged — no modifications to customer routes or components
- Download flow unchanged — customer download endpoints and token validation not touched
- Existing token generation unchanged — `purchaseService.generateDownloadToken()` reused as-is
- Existing entitlement logic unchanged — revoke/regenerate only affects tokens, not entitlements
- Orders & Payments unchanged — no modifications to Phase 4 modules
- Customer Management unchanged — no modifications to Phase 5 modules
- Only ADMIN can access download routes — `requireAuth` + `requireRole('admin')` on every endpoint
- All admin actions create audit log entries with `download_token_id` and `purchase_id` metadata
- Regenerate reuses existing `purchaseService.generateDownloadToken()` — no new token generation code
- No duplicated UI — all components reuse existing admin primitives
- No CSS duplication — all styles use existing design tokens
- No secrets exposed — full token values shown only to admins in detail view

---

## Appendix: Phase 7 — Communication Center (Implemented)

### Scope

Read and manage the four communication channels: Contact Messages, Feedback, Newsletter Subscribers, and Career Applications. Adds admin-only internal **notes** and reusable **tags** across all record types, plus a **reply** action that reuses the existing Resend email system. No changes to the customer-facing submission forms, the email sending logic, or the existing `communication/*` modules.

### Migration

`backend/migrations/018_create_communication_admin.sql` adds three tables:

| Table | Purpose |
|-------|---------|
| `communication_notes` | Internal admin notes per record (`record_type`, `record_id`, `author_id`, `content`) |
| `communication_tags` | Reusable tag definitions (`name` UNIQUE, `color`) |
| `communication_record_tags` | Junction between records and tags (PK on `record_type, record_id, tag_id`) |

All three are auto-applied on server boot alongside existing migrations.

### Backend Module

```
backend/src/admin/communication/
  types.ts         RecordType, CommStatus, note/tag types, list/detail response types, filter options
  validation.ts    Zod: list params, status update, reply, note create, tag create/assign
  repository.ts    SQL: list+detail+status+archive+restore+delete for all 4 types; notes; tags
  service.ts       Orchestration: list/get, status changes, archive/restore/delete, reply, notes, tags, audit
  routes.ts        19 endpoints + shared /tags, /:recordType/:recordId/notes, /tags, /reply
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/communication/contact` | Admin | List contact messages (search, status, archived, date, sort, pagination) |
| `GET` | `/api/admin/communication/contact/:id` | Admin | Detail + notes + tags + audit (records VIEWED) |
| `PUT` | `/api/admin/communication/contact/:id/status` | Admin | Set status (NEW/READ/REPLIED/ARCHIVED) |
| `PUT` | `/api/admin/communication/contact/:id/archive` | Admin | Soft-archive |
| `PUT` | `/api/admin/communication/contact/:id/restore` | Admin | Restore from archive |
| `DELETE` | `/api/admin/communication/contact/:id` | Admin | Delete |
| `GET`/`GET :id`/`PUT :id/status`/`PUT :id/archive`/`PUT :id/restore`/`DELETE :id` | `/api/admin/communication/feedback/*` | Admin | Same as contact |
| `GET`/`GET :id`/`PUT :id/status`/`DELETE :id` | `/api/admin/communication/newsletter/*` | Admin | Newsletter (no archive/restore — unsubscribe handled by customer flow) |
| `GET`/`GET :id`/`PUT :id/status`/`PUT :id/archive`/`PUT :id/restore`/`DELETE :id` | `/api/admin/communication/careers/*` | Admin | Same as contact |
| `GET` | `/api/admin/communication/tags` | Admin | List all tags |
| `POST` | `/api/admin/communication/tags` | Admin | Create tag |
| `PUT` | `/api/admin/communication/tags/:id` | Admin | Rename/recolor tag |
| `DELETE` | `/api/admin/communication/tags/:id` | Admin | Delete tag (cascade from junction) |
| `GET` | `/api/admin/communication/:recordType/:recordId/notes` | Admin | List notes |
| `POST` | `/api/admin/communication/:recordType/:recordId/notes` | Admin | Add note (records NOTE_ADDED) |
| `POST` | `/api/admin/communication/:recordType/:recordId/tags` | Admin | Assign existing tag (records TAG_ADDED) |
| `DELETE` | `/api/admin/communication/:recordType/:recordId/tags/:tagId` | Admin | Remove tag (records TAG_REMOVED) |
| `POST` | `/api/admin/communication/:recordType/:recordId/reply` | Admin | Send reply email (contact/feedback only) + set REPLIED |
| `GET` | `/api/admin/communication/options` | Admin | Filter options (statuses) |

All endpoints require `requireAuth` + `requireRole('admin')`.

### Notes

- Internal only — never visible to customers. Stored in `communication_notes` with `author_id` + `created_at`.
- Multiple notes per record; rendered newest-first in the detail **Notes** tab via `NotesPanel.svelte`.

### Tags

- Reusable across all record types. `communication_tags` holds definitions; `communication_record_tags` links them.
- Add / remove / edit / delete via `TagManager.svelte` (assign, create new, rename, recolor, delete).
- Default palette seed colors applied on creation.

### Reply

- `ReplyDialog.svelte` collects subject + message, then `POST .../reply`.
- Backend calls the new `emailService.sendReplyEmail({ to, subject, message })` — a generic method that reuses the existing `sendWithLogging` (provider, retry, DB logging). Category is `null` so it always sends (not subject to customer opt-out like transactional admin mail).
- After sending, the record status is advanced to `REPLIED` and a `contact_replied` / `feedback_replied` audit event is recorded.
- Newsletter subscribers have no reply action (read-only channel).

### Frontend

```
frontend/src/routes/admin/communication/
  +page.svelte                       Landing overview (counts + "new" badges per type)
  contact/+page.svelte              List (search, status/archived filters, sort, bulk select/archive/delete)
  contact/[id]/+page.svelte         Detail (Overview/Notes/Tags/Audit tabs + reply + actions)
  feedback/+page.svelte             List
  feedback/[id]/+page.svelte        Detail
  newsletter/+page.svelte           List
  newsletter/[id]/+page.svelte      Detail
  careers/+page.svelte              List
  careers/[id]/+page.svelte         Detail

frontend/src/lib/admin/api/communication.ts        Typed client (list/get/status/archive/restore/delete/tags/notes/reply)
frontend/src/lib/admin/components/
  CommunicationStatusBadge.svelte   NEW/READ/REPLIED/ARCHIVED colors
  CommunicationCard.svelte          Landing card
  CommunicationListView.svelte      Reusable list (filters, sort, pagination, bulk select/archive/delete)
  CommunicationDetailView.svelte    Reusable detail (tabs, status change, archive/restore/delete, reply)
  NotesPanel.svelte                 Add/list internal notes
  TagManager.svelte                 Add/remove/edit/delete tags
  ReplyDialog.svelte                Reply composer
```

### Reused Infrastructure

- `AdminPage`, `AdminPageHeader`, `AdminSection`, `AdminTableContainer`, `AdminEmptyState`, `Button`, `Input`
- `adminFetch` client wrapper (`credentials: include`, 15s timeout, `AdminApiError`)
- Existing DB tables `contact_messages`, `feedback`, `newsletter_subscribers`, `career_applications` (read/updated only)
- Existing `emailService` (new `sendReplyEmail` method reuses `sendWithLogging`)
- Existing `audit` service + `recordEvent`

### Security & Audit

- Every endpoint gated by `requireAuth` + `requireRole('admin')`; all inputs validated with Zod; parameterized SQL.
- Audit events added: `contact_viewed`, `feedback_viewed`, `newsletter_viewed`, `careers_viewed`, `contact_replied`, `feedback_replied`, `contact_status_changed`, `feedback_status_changed`, `newsletter_status_changed`, `careers_status_changed`, `contact_archived`, `feedback_archived`, `careers_archived`, `contact_restored`, `feedback_restored`, `careers_restored`, `contact_deleted`, `feedback_deleted`, `newsletter_deleted`, `careers_deleted`, `note_added`, `tag_added`, `tag_removed`.
- Each audit entry stores `record_type` + `record_id` in metadata so the detail **Audit** tab can filter by record.

### Files Created (11 backend, 8 frontend = 19 total)

```
backend/src/admin/communication/ (types, validation, repository, service, routes)
backend/migrations/018_create_communication_admin.sql

frontend/src/lib/admin/api/communication.ts
frontend/src/lib/admin/components/ (CommunicationStatusBadge, CommunicationCard, CommunicationListView, CommunicationDetailView, NotesPanel, TagManager, ReplyDialog)
frontend/src/routes/admin/communication/ (+page + 4 lists + 4 details)
```

### Files Modified (3)

| File | Change |
|------|--------|
| `backend/src/admin/index.ts` | Mounted `/communication` routes |
| `backend/src/audit/types.ts` | Added 23 communication audit events |
| `backend/src/email/service.ts` | Added `sendReplyEmail()` method (reuses `sendWithLogging`) |
| `frontend/src/lib/admin/components/AdminSidebar.svelte` | Repointed Communication group to `/admin/communication/*` |
| `docs/ADMIN_PORTAL_ARCHITECTURE.md` | This appendix (Phase 7) |

### Verification

- `bun run tsc --noEmit` — 0 errors (backend)
- `bun test` — 78 pass, 0 fail (all existing tests unchanged)
- `svelte-check` — 0 errors, 6 warnings (intentional initial-value captures + pre-existing autofocus/.danger-btn)
- Customer Portal unchanged — submission forms and `communication/*` modules untouched
- Email system unchanged — only added `sendReplyEmail` reusing existing `sendWithLogging`; customer-facing templates untouched
- No duplicate communication logic — admin reads/writes go through the new module, reusing existing tables and email service
- Existing contact/feedback/newsletter/careers forms continue working unchanged
- All admin actions audited with `record_type`/`record_id` metadata
- UI follows existing Admin Portal design system + shared components only
