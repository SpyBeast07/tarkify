# Admin Portal Architecture

> **Status**: Phase-0 planning. **No implementation yet.**
> **Goal**: Define RBAC, modules, navigation, folder structure, APIs, components, reusable layouts, design principles, and future scalability for the Admin Portal — the next implementation phase after the current production-ready platform.
> **Related**: `ARCHITECTURE.md`, `API_REFERENCE.md#admin-planned`, `SECURITY.md#authorization`.

---

## Objective

Build an admin dashboard that lets privileged users manage customers, products, purchases, the communication inbox, and (for super-admins) system settings and admin accounts. It reuses existing business tables and the already-prepared role middleware.

---

## RBAC

Roles already exist in `users.role` (TEXT, CHECK): `customer`, `admin`, `super_admin`.

| Role | Capabilities |
|------|--------------|
| `customer` | Own profile, purchases, downloads, settings. |
| `admin` | All customer caps + manage customers, products, purchases, communication inbox. |
| `super_admin` | All admin caps + manage admins, system settings, analytics. |

**Middleware (already implemented)**: `requireAuth`, `requireCustomer`, `requireAdmin`, `requireSuperAdmin`, `requireRole(...)`.

**Route protection matrix** (planned):

| Route Pattern | Customer | Admin | Super Admin |
|---------------|----------|-------|-------------|
| `/api/admin/customers` | ✗ | ✓ | ✓ |
| `/api/admin/products` | ✗ | ✓ | ✓ |
| `/api/admin/purchases` | ✗ | ✓ | ✓ |
| `/api/admin/communication/*` | ✗ | ✓ | ✓ |
| `/api/admin/settings*` | ✗ | ✗ | ✓ |
| `/api/admin/admins*` | ✗ | ✗ | ✓ |
| `/api/admin/analytics*` | ✗ | ✗ | ✓ |

No granular permission tables are planned at current scale — coarse roles are sufficient and extensible.

---

## Modules

| Module | Backend | Frontend |
|--------|---------|----------|
| Customers | list, search, detail, manual purchase linking | datatable + detail drawer |
| Products | CRUD | list + create/edit form |
| Purchases | list, view, refund | datatable + detail |
| Communication | unified inbox (contact/feedback/newsletter/careers) | tabbed inbox |
| Settings | system config (super-admin) | settings form |
| Admins | admin management (super-admin) | user admin table |
| Analytics | read-only aggregates (future) | charts |

---

## Navigation

```
/admin/
├── +layout.svelte        Auth guard (requireAdmin) + AdminSidebar
├── dashboard/           Summary cards
├── customers/  [id]/   Customer mgmt
├── products/   [id]/   Product CRUD
├── purchases/ [id]/   Purchase mgmt + refund
├── communication/         Unified inbox (tabs)
├── settings/            System settings (super-admin)
├── admins/             Admin mgmt (super-admin)
└── analytics/           Charts (future)
```

Active route highlighted; mobile collapse; role-gated nav items hidden per `user.role`.

---

## Folder Structure

### Backend (`backend/src/`)
```
admin/
  middleware/require-role.ts     (or reuse existing)
  routes/
    customers.ts
    products.ts
    purchases.ts
    communication.ts
    settings.ts
    admins.ts
    analytics.ts
index.ts                        mount /api/admin/* with role middleware
```

### Frontend (`frontend/src/`)
```
routes/admin/
  +layout.svelte
  +page.svelte                dashboard
  customers/+page.svelte  customers/[id]/+page.svelte
  products/+page.svelte   products/[id]/+page.svelte
  purchases/+page.svelte  purchases/[id]/+page.svelte
  communication/+page.svelte
  settings/+page.svelte
  admins/+page.svelte
  analytics/+page.svelte
lib/api/admin.ts                 typed admin client
lib/components/admin/           AdminSidebar, DataTable, StatCard, Drawer
```

---

## APIs (Planned)

All under `/api/admin/*`, role-protected. See `API_REFERENCE.md#admin-planned` for the full reserved table. Highlights:

- `GET /admin/customers`, `GET /admin/customers/:id` (incl. linked purchases, manual link action)
- `GET/POST/PUT /admin/products`
- `GET /admin/purchases`, `POST /admin/purchases/:id/refund`
- `GET /admin/communication/{contact,feedback,newsletter,careers}`
- `GET/PUT /admin/settings` (super-admin)
- `GET/PUT /admin/admins` (super-admin)
- `GET /admin/analytics/*` (future)

Every admin query must be scoped and parameterized; admin actions should write to `audit_logs`.

---

## Components

| Component | Purpose |
|-----------|---------|
| `AdminSidebar` | Role-aware vertical nav, mobile overlay |
| `DataTable` | Sortable/paginated table (reused across modules) |
| `StatCard` | Dashboard metric card |
| `Drawer` | Detail panel for customers/purchases |
| `ConfirmDialog` | Destructive actions (refund, delete) |

Reuse existing `ui/` primitives (`Button`, `Input`, `Modal`, `Toast`, `StatusBadge`, `Skeleton`).

---

## Reusable Layouts

- `admin/+layout.svelte` — `requireAdmin` guard + sidebar + content slot + root `Navbar`/`Footer`/`Toast`.
- `AuthLayout` (existing `ui/AuthLayout.svelte`) reused for auth pages.
- Shared `DataTable` + `Pagination` (existing `account/Pagination.svelte`) for list pages.
- Consistent loading (skeleton), empty, error, and success states (per `DESIGN_SYSTEM.md`).

---

## Design Principles

Follow `DESIGN_SYSTEM.md` and `DEVELOPMENT_GUIDE.md`:

- Semantic color tokens; light + dark support.
- Consistent spacing scale; max content width.
- Reusable, single-responsibility components.
- Accessible (keyboard, focus, ARIA); WCAG AA.
- Subtle animations (150–300ms); native Svelte transitions.
- Server-rendered where possible; client fetch only for interaction.
- No secrets, no business logic in the frontend.

---

## Future Scalability

- **New admin modules** add routes + a backend `admin/routes/*` file; no existing table changes.
- **Analytics** reads existing `created_at`/`status`/`metadata`; optionally a new `analytics_*` table.
- **Audit**: every admin mutation logs to `audit_logs` (already exists).
- **RBAC extension**: if granular perms are needed later, add a `role_permissions` table without touching business tables.
- **Multi-instance**: admin reads are stateless; pair with the same DB and (when scaling) a shared Redis rate-limit store.

---

*This is a planning document only. Implementation begins after the current platform is confirmed production-ready. No code changes are implied.*
