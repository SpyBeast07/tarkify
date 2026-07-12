# Email System

> **Scope**: Provider abstraction, templates, retry, error handling, logging, lifecycle, all email types.
> **Provider**: Resend (only production implementation).
> **Related**: `SECURITY.md`, `DEPLOYMENT.md#resend`, `API_REFERENCE.md#email-devadmin`.

---

## Provider Abstraction

```mermaid
flowchart LR
    T[Trigger: auth hook / webhook / form] --> ES[EmailService]
    ES --> PC[Preference check]
    PC -- allowed --> PR[EmailProvider.send]
    PR --> RS[ResendProvider]
    RS --> RA[Resend API]
    ES --> LG[Logger: in-memory + email_logs]
    ES --> RT[Retry: exp backoff + jitter]
```

- All sends route through `EmailService` (singleton `emailService`).
- `EmailProvider` interface (`provider.ts`) decouples logic from transport.
- **Only `ResendProvider` (`resend.ts`) is implemented.** `EMAIL_PROVIDER` defaults to `resend`; no other provider exists.

---

## Resend

- SDK wrapped in `ResendProvider` with timeout + structured errors.
- Dev fallback: if `RESEND_API_KEY` is unset, emails are **logged to console** instead of sent.
- Production requires a verified domain; `FROM_EMAIL` must use it.
- Setup: create account → verify domain (TXT/MX/CNAME) → create API key → set `RESEND_API_KEY`.

---

## Email Lifecycle

```mermaid
sequenceDiagram
    participant H as Hook/Webhook/Form
    participant S as EmailService
    participant P as Preference check
    participant R as ResendProvider
    participant L as Logger

    H->>S: sendX(data)
    S->>P: canSendEmail(category, recipient)
    alt opted out / not mandatory
        P-->>S: false
        S->>L: log skipped
    else allowed
        P-->>S: true
        S->>R: send(template, data)
        R-->>S: result / error
        S->>L: log sent / failed
    end
```

- **Preference check** runs before every send. Mandatory categories (`security`) cannot be disabled.
- **Categories**: `security` (mandatory), `billing`, `product`, `newsletter`, `marketing`.
- Preferences stored in `users.preferences` JSONB; managed via account settings.
- **Customer transactional emails are always sent** — `sendVerificationEmail`, `sendPasswordResetEmail`, `sendPurchaseReceipt`, `sendDownloadEmail`, `sendContactAcknowledgement`, `sendCareerAcknowledgement`, `sendNewsletterConfirmation`, `sendNewsletterUnsubscribed`, `sendReplyEmail`, and `sendTestEmail` bypass the preference check (their template category is `null`). They can never be disabled from the Admin Portal.
- Only `sendNewsletterEmail` (marketing broadcast) and `sendFeedbackAcknowledgement` honour the per-user `newsletter`/`product` opt-out.

---

## Retry Logic

- Config: 1 retry, 1s base, 5s max.
- Algorithm: exponential backoff with full jitter.
- Retryable: `429`, `500`, `502`, `503`, `504`.
- Non-retryable: 4xx validation/auth, `404`.

---

## Error Handling

`EmailError` hierarchy: `EmailProviderError` (statusCode, provider), `EmailRateLimitError` (429), `EmailConfigurationError`, `EmailTemplateError`.

| Provider error | HTTP | User message |
|---|---|---|
| 429 rate limit | 429 | Too many email requests. |
| 422 validation | 422 | Email service temporarily unavailable. |
| 408 timeout | 408 | Email service timed out. |
| 404 | 500 | Email service temporarily unavailable. |
| other | 500 | Unable to send [verification/reset] email. |

Better Auth callbacks (`sendVerificationEmail`, `sendResetPassword`) catch, log, and re-throw as `APIError`.

---

## Logging

- **In-memory** `EmailLogger`: last 1000 entries (`to`, `subject`, `provider`, `level`, `message`, `durationMs`, `timestamp`).
- **DB** `email_logs`: `recipient`, `template`, `provider`, `provider_id`, `status` (sent/logged/skipped/failed), `error`, `sent_at`, `metadata`. Insert failures are silently caught (never block a send).

---

## Templates

Built from reusable components (`components/`): `Header`, `Footer`, `Button`, `Divider`, `InfoCard`, `ProductCard`, `CodeBox`, `Alert`, `Signature`. Wrapped by `EmailLayout.ts` (responsive table, dark-mode via `prefers-color-scheme`, Google Fonts/Inter, preview text).

Theme tokens in `styles/theme.ts`. Preview all templates at `GET /api/email-previews`.

---

## Email Types

| Template | Method | Category | Trigger |
|----------|--------|----------|----------|
| Verification | `sendVerificationEmail` | always (transactional) | Sign-up / resend |
| Password reset | `sendPasswordResetEmail` | always (transactional) | Forgot password |
| Purchase receipt | `sendPurchaseReceipt` | always (transactional) | Payment verified |
| Download | `sendDownloadEmail` | always (transactional) | Payment verified |
| Contact notification | `sendContactNotification` | admin (always) | Contact form |
| Contact acknowledgement | `sendContactAcknowledgement` | always (transactional) | Contact form |
| Feedback acknowledgement | `sendFeedbackAcknowledgement` | product (user opt-out) | Feedback submitted |
| Career acknowledgement | `sendCareerAcknowledgement` | always (transactional) | Career application |
| Newsletter | `sendNewsletterEmail` | newsletter (user opt-out) | Admin broadcast |
| Newsletter confirmation | `sendNewsletterConfirmation` | always (transactional) | Subscribe |
| Newsletter unsubscribed | `sendNewsletterUnsubscribed` | always (transactional) | Unsubscribe |
| Admin notification | `sendAdminNotification` | internal (always) | Career application |
| Admin reply | `sendReplyEmail` | always (transactional) | Reply to customer |
| Test email | `sendTestEmail` | dev | `POST /api/test-email` |

**Customer transactional emails always send** and are unaffected by any Admin setting.

**Admin notifications** go to `ADMIN_EMAIL` (contact form, career applications, new orders, payment issues, feedback, newsletter activity, system/email failures). Which admin notifications are sent is controlled by the **Admin Notification Preferences** settings group (`notifications`): `adminEmailAlerts` (New Order), `paymentAlerts` (Payment Issues), `feedbackAlerts` (Feedback), `contactAlerts` (Contact Form), `careerAlerts` (Career Application), `newsletterAlerts` (Newsletter Activity), `systemAlerts` (System). Each toggle gates only its corresponding admin notification; all default to enabled.

---

## Future Providers

- Add a new `EmailProvider` implementation (e.g. SendGrid, SES) and register it by `EMAIL_PROVIDER` name.
- No template or `EmailService` changes required — transport is fully abstracted.
- Planned: admin-driven newsletter broadcast UI, additional preference categories, template management, delivery analytics.

---

*Environment configuration: `DEPLOYMENT.md#environment-variables`. API surface: `API_REFERENCE.md#email-devadmin`.*
