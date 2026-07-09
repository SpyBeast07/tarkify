# Project Status

> **Status**: Production-ready. Admin Portal pending.
> **Docs version**: 2026-07-09
> **Detail docs**: See `ARCHITECTURE.md`, `DATABASE.md`, `API_REFERENCE.md`, `DEPLOYMENT.md`, `SECURITY.md`, `EMAIL_SYSTEM.md`, `CUSTOMER_PORTAL.md`.

---

## Overview

**Tarkify** is an AI-powered automation platform that sells digital products via a public SvelteKit website, an authenticated customer portal, and a Razorpay-backed payment system. The current product is **DevBeast**.

The platform preserves full backward compatibility with historical **guest purchases** (orders made before accounts existed), linking them to a user automatically after email verification.

---

## Implementation Status

| Area | Status | Notes |
|------|--------|-------|
| Authentication | ✅ Complete | Email/password, sessions, email verification, password reset, role model. |
| Google OAuth (code) | ⏳ Implemented, disabled by default | Activates only when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set. |
| Customer Portal | ✅ Complete | `/account`: dashboard, profile, purchases, downloads, billing, settings. |
| Customer API | ✅ Complete | `/api/account/*`. |
| Payment System | ✅ Complete | Razorpay create-order, verify, webhooks, refund, idempotency. |
| Email System | ✅ Complete | Resend; 10 templates; preferences; logging. |
| Communication | ✅ Complete | Contact, Feedback, Newsletter, Careers module. |
| Downloads | ✅ Complete | Token-based, time-limited, path-traversal protected. |
| Purchase Linking | ✅ Complete | Guest → user linking on email verification. |
| Security Hardening | ✅ Complete | CSP, CORS, rate limiting, headers, input sanitization. |
| Audit Logging | ✅ Complete | `audit_logs` table + service. |
| Deployment | ✅ Complete | Docker, Compose, migration runner, health/readiness. |
| Admin Portal | ⏳ Planned | Next phase. See `ADMIN_PORTAL_ARCHITECTURE.md`. |
| Analytics | ⏳ Planned | |
| CMS / Blog | ⏳ Planned | |
| Subscriptions | ⏳ Planned | Schema already supports `type=SUBSCRIPTION`. |
| Licensing | ⏳ Planned | |
| Multi-tenant | ⏳ Planned | |

---

## Tech Stack

**Frontend**: SvelteKit (Svelte 5), TypeScript, Tailwind CSS v4, Lucide, `@sveltejs/adapter-node`, Vercel.
**Backend**: Bun, Hono, PostgreSQL 15 (`pg`, raw SQL, no ORM), Better Auth, Razorpay, Resend.
**Infra**: Docker + Docker Compose, Cloudflare (TLS/proxy), VPS, Vercel.

See `ARCHITECTURE.md#tech-stack` for the full list.

---

## Module Completion Checklist

- [x] Authentication (email/password)
- [x] Session management + remember-me
- [x] Email verification
- [x] Password reset
- [x] Customer Portal
- [x] Customer API
- [x] Payment system (Razorpay)
- [x] Email system (Resend)
- [x] Communication (contact / feedback / newsletter / careers)
- [x] Downloads (token-based)
- [x] Guest purchase linking
- [x] Security hardening
- [x] Audit logging
- [x] Deployment pipeline
- [ ] Google OAuth (code done; enable via credentials)
- [ ] Admin Portal
- [ ] Analytics
- [ ] CMS
- [ ] Subscriptions
- [ ] Licensing

---

## Production Readiness

**Verdict: Ready for production** (single-instance). Recent audits scored 9+/10 across production-readiness, security, reliability, and deployment. Remaining actions are configuration guardrails, not code gaps:

- Rotate Razorpay keys to production-approved values.
- Set `BETTER_AUTH_URL` and `FRONTEND_URL` to `https://` and same-site.
- Cloudflare set to **Full (Strict)** SSL.
- Set `RESEND_API_KEY` (production email).

See `DEPLOYMENT.md#production-deployment` and `SECURITY.md`.

---

## Known Limitations

- **No Admin Portal yet** — admin routes/dashboards are not implemented; roles and middleware are ready.
- **Google OAuth is opt-in** — implemented but disabled unless credentials are set.
- **In-memory rate limiting** — resets on restart, per-instance; not safe for multi-replica scaling (Redis recommended).
- **Single backend instance** — connection pool capped at 10; no multi-replica deployment.
- **Limited integration test coverage** — unit tests exist; no automated payment/webhook integration tests.
- **Frontend static data drift** — `solutions.json` still has a subscription-style placeholder price; product detail now fetches the real price from the API.
- **No CMS / blog admin, no subscriptions, no licensing, no multi-tenant.**
- **Email link routing** — verification/reset emails are configured to land on frontend pages (recent fix); confirm in production.

---

## Current Roadmap

- **Authentication**: Google OAuth GA, potential MFA, richer session management.
- **Customer Portal**: client-side caching, invoice download (PDF), avatar upload, activity log.
- **Admin Portal** (next): customers, products CRUD, purchases, communication inbox, settings, admin management, analytics.
- **Analytics**: funnels, revenue, engagement.
- **Licensing**: license-key issuance/validation.
- **Subscriptions**: recurring billing (schema-ready).
- **Automation**: workflows, external webhooks.
- **AI**: product-assist features, content generation.
- **CMS**: managed blog/discover content.
- **Future Integrations**: Slack/Discord, CRM, analytics platforms.

---

## Next Implementation Phases

1. **Admin Portal** — `ADMIN_PORTAL_ARCHITECTURE.md` defines RBAC, modules, navigation, folder structure, APIs, components, reusable layouts. No implementation yet.
2. **OAuth GA** — supply Google credentials; gate the login/register OAuth buttons on `googleOAuthEnabled`.
3. **Subscriptions / Licensing** — add new tables; existing tables are not modified.

All future features add **new tables** or optional nullable columns; existing columns and constraints are never tightened. See `ARCHITECTURE.md#future-scalability`.

---

## Deployment Status

- **Backend**: Docker Compose on VPS at `backend.tarkify.qzz.io`; migrations run automatically before serve.
- **Frontend**: Vercel at `tarkify.qzz.io` (same-site subdomain for cookie compatibility).
- **TLS**: Cloudflare Full (Strict).
- **Startup**: Postgres healthy → migrations → server → `/api/health` ok → healthy.

Full detail in `DEPLOYMENT.md`.

---

## Active Integrations

| Integration | Status | Notes |
|--------------|--------|-------|
| Razorpay | ✅ Active | Payments, webhooks, refunds. |
| Resend | ✅ Active | Transactional + newsletter email. |
| Cloudflare | ✅ Active | TLS termination + proxy. |
| Vercel | ✅ Active | Frontend hosting. |
| Google OAuth | ⏳ Configured, off | Enable via env credentials. |
| Redis | ❌ Not used | Recommended for scale-out rate limiting. |

---

## Current Authentication Model

- **Better Auth** owns identity (register, login, sessions, verification, reset, OAuth).
- Session cookie: `HttpOnly`, `Secure` (prod), `SameSite=Lax`, prefix `tarkify`.
- 7-day default, 30-day with remember-me, 1-day sliding refresh, 5-minute cookie cache.
- Global `sessionMiddleware` attaches `{ user, session }`; `requireAuth` / `requireRole` protect routes.
- Roles: `customer`, `admin`, `super_admin` (coarse; RBAC tables not yet needed).
- Guest purchase linking fires on email verification via a Better Auth DB hook.

See `SECURITY.md` and `ARCHITECTURE.md#authentication--authorization`.

---

## Email System Status

- **Provider**: Resend (only production provider; dev logs to console).
- **Templates**: 10 (verification, password-reset, purchase-receipt, download, contact-notification, contact-acknowledgement, newsletter, newsletter-confirmation, newsletter-unsubscribed, admin-notification) + test email.
- **Preferences**: categories `security` (mandatory), `billing`, `product`, `newsletter`, `marketing`.
- **Logging**: in-memory (last 1000) + `email_logs` DB table.

See `EMAIL_SYSTEM.md`.

---

## OAuth Status

- Google OAuth **code is implemented** (migration `016_add_oauth_support.sql`, `socialProviders` config).
- **Disabled by default**: the login/register OAuth buttons are gated on `googleOAuthEnabled` (true only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set).
- Account linking for matching emails is supported; no separate GitHub config yet.

---

*This is the executive summary. For authoritative detail on any area, follow the reading order in `README.md`.*
