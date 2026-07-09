# Development Guide

> **Scope**: Coding standards, conventions, testing, docs standards, git workflow, architecture rules, and how-to recipes.
> **Related**: `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `SECURITY.md`.

---

## Core Principles

Every piece of code should be: **simple, readable, predictable, reusable, testable, type-safe.**

- Prefer clarity over cleverness.
- Prefer composition over duplication.
- Never break existing functionality.
- Follow the project architecture and design system.

---

## Technology Stack

| Layer | Stack |
|-------|-------|
| Frontend | SvelteKit, Svelte 5 (runes), TypeScript, Tailwind CSS v4 |
| Backend | Bun, Hono, PostgreSQL (`pg`, raw SQL), TypeScript |
| Shared | TypeScript (no shared runtime module by design) |

---

## Coding Standards

- **TypeScript is mandatory.** Never disable errors. Avoid `any`. Export reusable types.
- **Svelte 5 idiomatic.** Use runes (`$state`, `$derived`, `$effect`, `$props`). Don't translate React patterns. Avoid legacy syntax unless required.
- **Components**: one responsibility; props in, events out; avoid unnecessary state; split if >250–300 lines.
- **Functions**: one task, descriptive name, early returns, no deep nesting.
- **Imports order**: Svelte → external libs → internal → relative. Avoid deep relative paths; use aliases.
- **No magic numbers** — name constants.
- **Comments**: explain *why*, not *what*. Remove debugging `console.*` before merging.
- **Dependencies**: ask can-it-be-done-in-house / maintained / tree-shakeable / bundle-size before adding.

---

## Folder Conventions

### Backend (`backend/src/`)
```
auth.ts  config.ts  db.ts  index.ts
users/  account/  communication/<feature>/  purchase-linking/
email/  audit/  middleware/  routes/  services/  lib/  types/
```
Each feature folder: `types.ts`, `validation.ts`, `repository.ts` (SQL only), `service.ts` (logic), `routes.ts` (handlers).

### Frontend (`frontend/src/`)
```
lib/api/  lib/components/{layout,ui,account,home}/
lib/context/  lib/data/  lib/services/  lib/types/  lib/utils/
routes/  (file-based)
```
Pages never call `fetch()` directly for reusable APIs — use `lib/api/*`.

---

## Naming Conventions

- Components: `HeroSection.svelte`, `ProductCard.svelte`.
- Utilities: `formatPrice.ts`, `validateEmail.ts`.
- Stores: `theme.ts`, `notifications.ts`.
- Types: `product.ts`, `contact.ts`.
- Descriptive, no abbreviations.

---

## Error Handling

- Never ignore errors. Every async op handles success / loading / failure.
- User-friendly messages; log unexpected errors appropriately (no PII).
- Backend: structured JSON `{ error, message, requestId }`; global handler + `X-Request-Id`.
- Frontend: error card + retry; inline validation; 401 → redirect to login.

---

## Testing Strategy

- **Unit tests** (Bun `bun test`) for: config validation, security middleware, email normalization, price formatting, purchase logic.
- **Integration tests** for payment/webhook flows are not yet automated — add when touching those paths.
- Manual verification checklist before "done": functionality, responsiveness, a11y, `tsc --noEmit`, lint, no console logs, no TODOs unless documented.
- Frontend `svelte-check` must pass with 0 errors.

---

## Documentation Standards

- One concept → one authoritative location; other docs **link**, never repeat.
- Use Mermaid for flows/ER diagrams.
- Internal links are relative.
- Historical reports live only in `ARCHIVE/`.
- Update the doc **first**, then implement (per `ARCHITECTURE.md` appendix rule).

---

## Git Workflow

- Small, focused commits with clear messages.
- Don't rewrite unrelated code.
- No application code changes from documentation work.
- Verify `tsc`/`svelte-check`/tests before pushing.
- Keep migrations forward-only; never modify an applied migration — add a new one.

---

## Architecture Rules

- **Frontend**: presentation only — no secrets, no payment verification, no DB access, no auth logic.
- **Backend**: owns all business logic, validation, security.
- **Better Auth owns identity**; Tarkify owns business data. The `users` table is the shared seam.
- **No ORM** — parameterized raw SQL only (`$1`, `$2`, …).
- **Future features add new tables** (or nullable columns); existing columns/constraints are never tightened.
- **Preserve guest-purchase backward compatibility.**

---

## How to Add a New Feature

1. Decide the module folder (`backend/src/<feature>/`, `frontend/src/lib/components/...`).
2. Add `types.ts` → `validation.ts` (Zod) → `repository.ts` (SQL) → `service.ts` → `routes.ts`.
3. Mount routes in `index.ts` with appropriate middleware (`requireAuth`/`requireRole`).
4. Add frontend page under `frontend/src/routes/` + API client under `lib/api/`.
5. Update `DATABASE.md` (if new tables), `API_REFERENCE.md`, and this guide.
6. Write/extend tests; run `tsc` + `svelte-check`.

---

## How to Add a New API

- Choose the module; follow its folder layout.
- Validate input with Zod in `validation.ts`.
- Never build SQL with string concatenation — use parameterized queries.
- Attach auth via `c.get('user')`; filter all queries by session user ID.
- Document the route in `API_REFERENCE.md` (route, method, auth, request, response, errors).
- Return structured errors with `requestId`.

---

## How to Add a New Page

- File-based route under `frontend/src/routes/`.
- Use `lib/api/*` clients (no direct `fetch`).
- Compose reusable `ui/` components; follow `DESIGN_SYSTEM.md`.
- Add SEO via `<svelte:head>` (title, description, OG, canonical).
- Handle loading / empty / error / success states.
- For protected areas, wrap in an auth layout that checks the session.

---

## How to Add a New Email

1. Add a `templates/<name>.ts` using `components/*` + `EmailLayout`.
2. Add a `send<Name>(data)` method to `EmailService` with its category.
3. Add the data interface in `types.ts`.
4. Wire the trigger (auth hook / webhook / route).
5. Document the template in `EMAIL_SYSTEM.md#email-types`.

---

## How to Add a New Database Table

1. Create `backend/migrations/0NN_descriptive.sql` (new table or nullable column on an existing one).
2. Apply ownership: identity → Better Auth; business → Tarkify.
3. Add indexes on PK/FK/slug/token; add CHECK constraints where meaningful.
4. Add `updated_at` trigger if the table is mutable.
5. Add `repository.ts` queries (parameterized).
6. Update `DATABASE.md` (table, ER diagram, indexes, constraints).
7. Never modify an already-applied migration.

---

*Standards are more important than novelty. Every contribution should make the codebase easier to understand and maintain.*
