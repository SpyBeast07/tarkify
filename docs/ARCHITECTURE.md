# Architecture

> **Scope**: Complete system architecture — backend, frontend, auth, payments, email, downloads, communication, and the planned Admin Portal.
> **Supersedes**: the former `ARCHIVE/ARCHITECTURE.md`, `ARCHIVE/ACCOUNT_SYSTEM_ARCHITECTURE.md`, `ARCHIVE/USER_MODEL.md`, `ARCHIVE/BETTER_AUTH_IMPLEMENTATION.md`, `ARCHIVE/GUEST_PURCHASE_LINKING.md`.
> **Related**: `DATABASE.md`, `API_REFERENCE.md`, `SECURITY.md`, `EMAIL_SYSTEM.md`.

---

## High-Level Architecture

```mermaid
flowchart TD
    U[Visitors / Customers] --> FE[SvelteKit Frontend<br/>Vercel: tarkify.qzz.io]
    FE -->|HTTPS + cookies| CF[Cloudflare<br/>Full Strict TLS]
    CF --> API[Backend API<br/>Bun + Hono, Docker on VPS<br/>backend.tarkify.qzz.io]
    API --> PG[(PostgreSQL 15<br/>Docker)]
    API --> RZ[Razorpay API]
    API --> RS[Resend Email]
    API --> FS[(File Storage<br/>./storage/products/*)]
```

The frontend is **presentation only** — no secrets, no payment verification, no database access. All business logic lives in the backend.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend runtime | SvelteKit (Svelte 5) |
| Frontend language | TypeScript |
| Frontend styling | Tailwind CSS v4 |
| Frontend icons | Lucide |
| Frontend adapter | `@sveltejs/adapter-node` |
| Frontend hosting | Vercel |
| Backend runtime | Bun |
| Backend framework | Hono |
| Backend DB driver | `pg` (node-postgres, raw SQL, no ORM) |
| Database | PostgreSQL 15 (Docker Alpine) |
| Authentication | Better Auth |
| Payments | Razorpay |
| Email | Resend |
| Containerization | Docker + Docker Compose |
| Edge / TLS | Cloudflare |
| Backend hosting | VPS (Docker Compose) |

---

## Request Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant FE as Frontend
    participant MW as Middleware
    participant BA as Better Auth
    participant SVC as Services
    participant REP as Repository
    participant DB as Database

    B->>FE: Request (page or fetch)
    FE->>MW: HTTP + cookie
    MW->>BA: getSession() (global sessionMiddleware)
    BA-->>MW: { user, session } or null
    MW->>SVC: c.get('user')
    SVC->>REP: parameterized SQL
    REP->>DB: query
    DB-->>REP: rows
    REP-->>SVC: data
    SVC-->>MW: response
    MW-->>FE: JSON + headers
    FE-->>B: render
```

The `sessionMiddleware` runs on **every** route and attaches `{ user, session }` to the Hono context. Routes that don't need auth simply ignore it. Protected routes call `requireAuth` / `requireRole`.

---

## Backend Architecture

```mermaid
flowchart LR
    IDX[index.ts] --> AUTH[auth.ts<br/>Better Auth]
    IDX --> MWA[middleware/<br/>auth, cors, security]
    IDX --> RTS[routes/<br/>payments, downloads, webhooks, products]
    IDX --> ACC[account/]
    IDX --> USR[users/]
    IDX --> COM[communication/<br/>contact, feedback, newsletter, careers]
    IDX --> PL[purchase-linking/]
    IDX --> EML[email/]
    IDX --> AUD[audit/]
    IDX --> SVC[services/]
    IDX --> LIB[lib/]
    RTS --> DB[(pg pool)]
    ACC --> DB
    USR --> DB
    COM --> DB
    PL --> DB
    AUD --> DB
```

- **No ORM** — raw parameterized SQL via a shared `pg` pool.
- **Migration runner**: `scripts/migrate.ts` with a `_migrations` tracking table.
- **Rate limiter**: in-memory IP sliding window.
- **Global middleware**: CORS, security headers (incl. CSP), body-size limit, request ID, session.

---

## Frontend Architecture

```mermaid
flowchart TD
    RL[+layout.svelte<br/>Navbar + Footer + Theme + Toast] --> HOME[/]
    RL --> SOL[solutions/[id]]
    RL --> CONT[contact/]
    RL --> CARE[careers/]
    RL --> DISC[discover/[slug]]
    RL --> ACCT[/account/*<br/>Auth layout + Sidebar]

    ACCT --> DASH[dashboard]
    ACCT --> PROF[profile]
    ACCT --> PUR[purchases/[id]]
    ACCT --> DL[downloads]
    ACCT --> BIL[billing]
    ACCT --> SET[settings]

    LIB[lib/api/*] -->|fetch credentials:include| API[/api/*]
```

- Presentation only; typed API layer under `src/lib/api/*`.
- Authenticated area under `/account` guarded by an auth layout + session check.
- Reusable components under `src/lib/components` (`layout/`, `ui/`, `account/`, `home/`).

---

## Authentication & Authorization

### 6.1 Auth Boundary

```mermaid
flowchart LR
    subgraph BA[Better Auth — Identity]
        U[users] --> S[session]
        U --> AC[account]
        U --> V[verification]
    end
    subgraph TK[Tarkify — Business]
        P[products] --> PU[purchases]
        PU --> EN[entitlements]
        EN --> DT[download_tokens]
        CM[communication tables]
    end
    U -. shared seam .-> PU
    U -. shared seam .-> EN
```

- **Better Auth owns identity**: `users`, `account`, `session`, `verification`. It creates rows, hashes passwords, validates sessions, issues cookies, generates email tokens.
- **Tarkify owns business data**: `products`, `purchases`, `entitlements`, `download_tokens`, communication tables.
- The `users` table is the **shared seam**: Better Auth creates rows; Tarkify reads/extends them (`role`, `display_name`, `timezone`, `preferences`, `account_status`, activity timestamps).

### 6.2 RBAC

Three roles live in `users.role` (TEXT, CHECK): `customer`, `admin`, `super_admin`. The full route-protection matrix and `requireAuth` / `requireRole` middleware are defined authoritatively in `SECURITY.md#authorization` (the Admin Portal plan extends them in `ADMIN_PORTAL_ARCHITECTURE.md#rbac`).

Roles are coarse (no granular permission tables yet) — sufficient at current scale and extensible later.

### 6.3 Session Lifecycle

- Cookie: `HttpOnly`, `Secure` (prod), `SameSite=Lax`, prefix `tarkify`.
- 7-day default; 30-day with "Remember me"; 1-day sliding refresh; 5-minute cookie cache.
- DB-backed `session` table; revocation endpoints (`revoke-session`, `revoke-other-sessions`).

---

## Guest Purchase Linking

```mermaid
sequenceDiagram
    participant G as Guest
    participant P as Payments
    participant U as users
    participant BA as Better Auth Hook
    participant L as Linking Service

    G->>P: Buy (guest_email stored, user_id = NULL)
    G->>U: Later register with SAME email
    U-->>BA: email_verified becomes true
    BA->>L: linkPurchasesToUserByEmail(userId, email)
    L->>P: UPDATE purchases SET user_id WHERE guest_email AND user_id IS NULL
    L->>P: UPDATE entitlements SET user_id (skip conflicts)
    L-->>G: Purchases immediately in dashboard
```

- Triggered by Better Auth's `databaseHooks.user.update.after` on email verification.
- Runs inside a single DB transaction (atomic).
- **Idempotent**: `WHERE user_id IS NULL` prevents re-linking.
- Conflicting duplicate guest entitlements are skipped and deleted.
- Logged to `purchase_linking_log`.
- See `DATABASE.md` and `API_REFERENCE.md`.

---

## Payment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API
    participant RZ as Razorpay
    participant DB as DB
    participant EM as Email

    U->>FE: Checkout (email + product)
    FE->>API: POST /api/payments/create-order
    API->>DB: INSERT purchase (status=created)
    API->>RZ: create order
    RZ-->>FE: checkout
    U->>RZ: pay
    RZ-->>FE: success
    FE->>API: POST /api/payments/verify
    API->>API: verify HMAC signature
    API->>DB: UPDATE purchase paid + INSERT entitlement
    API->>EM: sendPurchaseReceipt + sendDownloadEmail
    API-->>FE: download token
```

- Idempotent: atomic `INSERT ... WHERE NOT EXISTS` + partial unique index on `(guest_email, product_id)`.
- Refund webhook (`payment.refunded`) revokes entitlement + expires download tokens.
- Razorpay webhooks are HMAC-verified and idempotent.

---

## Download Flow

```mermaid
flowchart LR
    A[GET /api/downloads/:slug?token=] --> B{Valid token?}
    B -- no --> X[401 Unauthorized]
    B -- yes --> C{expired?}
    C -- yes --> X
    C -- no --> D{product matches?}
    D -- no --> X
    D -- yes --> E[Stream file from DB-authorized path]
```

- 32-byte crypto token, time-limited (default 600s, `DOWNLOAD_TOKEN_TTL_SECONDS`).
- `download_key` comes from the DB (never user input) → no path traversal.
- Authenticated users generate fresh tokens via `POST /api/account/downloads/:purchaseId`.

---

## Email Flow

```mermaid
flowchart LR
    T[Trigger: auth hook / webhook / form] --> ES[EmailService]
    ES --> PC[Preference check]
    PC -- opted out --> SK[log skipped]
    PC -- allowed --> PR[Provider.send]
    PR --> RS[Resend API]
    ES --> LG[Logger: in-memory + email_logs]
    ES --> RT[Retry: exp backoff + jitter]
```

- Provider abstraction (`EmailProvider` interface); Resend is the only implementation.
- 10 templates built from reusable components; preview at `GET /api/email-previews`.
- See `EMAIL_SYSTEM.md`.

---

## OAuth Flow (Google, opt-in)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BA as Better Auth
    participant GOOG as Google
    participant DB as users/account

    U->>FE: Click "Sign in with Google"
    FE->>BA: /sign-in/social
    BA->>GOOG: OAuth redirect
    GOOG-->>BA: callback (code)
    BA->>DB: find/create user + link account
    BA-->>FE: session cookie
```

- Implemented (migration `016_add_oauth_support.sql`) but **disabled unless** `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set.
- Same-site requirement: frontend and backend must share an eTLD+1 for `SameSite=Lax` cookies.
- Account linking for matching emails is supported.

---

## Communication Module Architecture

```mermaid
flowchart TD
    C[contact] --> CS[service + repository + validation]
    F[feedback] --> FS[service + repository + validation]
    N[newsletter] --> NS[service + repository + validation]
    CA[careers] --> CAS[service + repository + validation]
    CS --> SH[shared/<br/>types, validators, sanitizers, response]
    FS --> SH
    NS --> SH
    CA --> SH
    CS --> DB[(contact_messages, feedback,<br/>newsletter_subscribers, career_applications)]
```

- Shared `sanitizers` strip `<script>`, event handlers, HTML tags, `javascript:`, and C0/C1 control chars before storage.
- Newsletter insert is atomic (`INSERT ... ON CONFLICT DO NOTHING`) — idempotent.
- All tables have `status`, `archived_at`, `metadata`, and an `updated_at` trigger.

---

## Customer Portal Architecture

- Authenticated SvelteKit area at `/account`: dashboard, profile, purchases, purchase detail, downloads, billing, settings.
- `account/+layout.svelte` runs a session check; redirects to `/account/login` if unauthenticated.
- Consumes the Customer API (`/api/account/*`) client-side via `$lib/api/account.ts`.
- Detail in `CUSTOMER_PORTAL.md`.

---

## Future Admin Portal Architecture (Overview)

Planned next phase. Full plan in `ADMIN_PORTAL_ARCHITECTURE.md`.

```mermaid
flowchart TD
    AL[admin/+layout.svelte<br/>requireRole admin] --> AC[customers]
    AL --> AP[products CRUD]
    AL --> APU[purchases + refund]
    AL --> ACO[communication inbox]
    AL --> ASET[settings]
    AL --> ANA[analytics]
    BE[/api/admin/*<br/>requireRole admin/super_admin/] --> DB[(same business tables)]
```

- Reuses existing business tables; reads through role-protected routes.
- Super-admin-only: admin management, system settings, analytics.

---

## Folder Structure

### Backend (`backend/`)
```
src/
  auth.ts                 Better Auth instance
  config.ts              env validation + production guards
  db.ts                  pg pool
  index.ts               Hono app, middleware, route mounting
  users/  account/      user + account APIs
  communication/          contact/ feedback/ newsletter/ careers/ + shared/
  purchase-linking/       guest→user linking
  email/                 provider, service, templates, components, preferences, logger, retry, preview
  audit/                 audit logging
  middleware/            auth, cors, security
  routes/                payments, downloads, webhooks, products
  services/ lib/ types/  shared logic
migrations/             001–016 SQL
scripts/migrate.ts       migration runner
tests/                  unit tests
```

### Frontend (`frontend/`)
```
src/
  lib/api/              typed API clients
  lib/components/        layout/ ui/ account/ home/ + Newsletter, FeedbackForm, PurchaseModal
  lib/context/          auth, theme, toast stores
  lib/data/ services/ types/ utils/
  routes/               /account/*, /contact, /careers, /discover, /login, /register,
                          /forgot-password, /reset-password, /solutions, /privacy, /terms
```

### Shared
No fully shared code module; types are duplicated between `frontend/src/lib/types` and `backend/src/types` by design (frontend never imports backend).

---

## Module Relationships

| Module | Depends on | Adds |
|--------|-------------|--------|
| Better Auth | — | identity |
| User Model / RBAC | Better Auth | roles, profile, authorization |
| Guest Linking | Auth + User | links purchases |
| Customer Portal | All above | reads purchases/entitlements |
| Downloads | Purchases + Entitlements | token service |
| Billing | Purchases | read-only view |
| Settings | Better Auth | password change |
| Admin Portal (planned) | All | role-protected reads/writes |
| OAuth (opt-in) | Better Auth | social providers |
| SaaS features (future) | All | new tables only |

---

## Future Scalability

**All future features add new tables** (or optional nullable columns) — no existing column is modified, removed, or has its constraint tightened. Existing data always remains valid.

| Future feature | Migration | Conflict? |
|----------------|-----------|-----------|
| Subscriptions | `subscriptions` table | No (new table) |
| Organizations | `organizations`, `org_members` | No |
| API Keys | `api_keys` | No |
| AI Credits | `credits` | No |
| Licenses | `licenses` | No |
| Invoices | `invoice_id` on `purchases` (nullable) | Minor |
| Notifications | `notifications` | No |

Security boundaries never cross: Better Auth never reads purchase data; Tarkify never reads password hashes.

---

*This is the master architecture document. For schema detail see `DATABASE.md`; for endpoints see `API_REFERENCE.md`; for security see `SECURITY.md`.*
