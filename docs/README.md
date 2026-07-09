# Tarkify Documentation

Welcome to the Tarkify documentation. This is the **single source of truth** for the project. Everything a new developer, contributor, or future AI session needs is here.

---

## Start Here — Reading Order

Read the documents in this exact order:

```
1. README.md                  ← You are here (documentation map)
2. PROJECT_STATUS.md          ← Executive summary: what exists, what's done, what's next
3. ARCHITECTURE.md            ← How the whole system fits together
4. DATABASE.md                 ← Tables, relationships, ownership rules
5. API_REFERENCE.md           ← Every endpoint, grouped by module
6. DESIGN_SYSTEM.md            ← UI/UX language and component rules
7. DEVELOPMENT_GUIDE.md       ← Coding standards + how to add features
8. DEPLOYMENT.md              ← Docker, VPS, Cloudflare, production
9. SECURITY.md                ← Security model
10. EMAIL_SYSTEM.md            ← Email architecture
11. CUSTOMER_PORTAL.md         ← Customer frontend area
12. ADMIN_PORTAL_ARCHITECTURE.md ← Planning doc for the next phase
```

After `PROJECT_STATUS.md`, you can jump directly to the document for the area you are working on.

---

## Documentation Map

| Document | Audience | Purpose |
|-----------|-----------|---------|
| `README.md` | Everyone | Entry point and reading order. |
| `PROJECT_STATUS.md` | Leads, new devs | Snapshot: status, tech stack, checklist, roadmap. |
| `ARCHITECTURE.md` | All engineers | System, request flow, module relationships, diagrams. |
| `DATABASE.md` | Backend engineers | Schema, ER diagrams, indexes, constraints, ownership. |
| `API_REFERENCE.md` | Frontend + backend | Full endpoint reference by module. |
| `DESIGN_SYSTEM.md` | Frontend engineers | Colors, spacing, typography, components, a11y. |
| `DEVELOPMENT_GUIDE.md` | All contributors | Standards, conventions, how-to recipes. |
| `DEPLOYMENT.md` | DevOps, backend | Docker, VPS, Cloudflare, migration, rollback. |
| `SECURITY.md` | All engineers | Auth, authorization, CSP, rate limiting, secrets. |
| `EMAIL_SYSTEM.md` | Backend engineers | Provider abstraction, templates, retry, logging. |
| `CUSTOMER_PORTAL.md` | Frontend engineers | Every `/account` page, APIs, states. |
| `ADMIN_PORTAL_ARCHITECTURE.md` | Leads, future devs | Phase-0 plan for the Admin Portal (no implementation). |
| `ARCHIVE/` | Historians | Superseded implementation & verification reports. |

---

## Conventions

- **One concept, one authoritative location.** Other docs link to it instead of repeating it.
- **Mermaid diagrams** are used for flows and entity relationships.
- **Internal links** are relative (`ADMIN_PORTAL_ARCHITECTURE.md#rbac`).
- **No application code is changed** by documentation work.
- **Historical reports** live only in `ARCHIVE/` and are never referenced as current truth.

---

## Quick Facts

- **Frontend**: SvelteKit (Svelte 5) + Tailwind CSS v4, hosted on Vercel.
- **Backend**: Bun + Hono + PostgreSQL (`pg`, raw SQL), Better Auth, Razorpay, Resend.
- **Hosting**: Backend Docker Compose on a VPS behind Cloudflare; frontend on Vercel.
- **Status**: Production-ready. Admin Portal is the next planned phase.
- **Docs version**: 2026-07-09.
