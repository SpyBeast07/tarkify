# Design System

> **Scope**: UI/UX language — colors, spacing, typography, components, forms, a11y, dark mode, animation.
> **Applies to**: all frontend SvelteKit components and pages.
> **Related**: `DEVELOPMENT_GUIDE.md`, `CUSTOMER_PORTAL.md`.

---

## 1. Design Principles

- **Modern, professional, minimal, premium, fast, clean, accessible.**
- Whitespace over decoration.
- Animations enhance, never distract.
- Every component works in **light and dark** themes.
- Accessibility is never sacrificed for aesthetics.

---

## 2. Colors

Use **semantic tokens**, never hardcoded values.

| Token | Usage |
|-------|-------|
| `primary` | Primary actions, links, accents |
| `secondary` | Secondary actions |
| `accent` | Highlights, CTAs |
| `background` | Page background |
| `surface` / `surface-elevated` | Cards, panels |
| `text-primary` / `text-secondary` / `text-muted` | Text hierarchy |
| `success` / `warning` / `error` / `info` | Status |
| `border` / `divider` | Borders |

Themes switch via design tokens; do not branch on `light`/`dark` in component logic.

---

## 3. Spacing

Consistent scale — no arbitrary values:

```
4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 (px)
```

---

## 4. Typography

| Level | Usage |
|-------|-------|
| Display | Hero headlines |
| Heading 1–4 | Section/page headings |
| Body Large / Body / Body Small | Paragraphs, captions |
| Caption | Metadata, hints |

- Readable, consistent font weights.
- No excessive font sizes; generous line-height.
- Hierarchy via size + weight, not color alone.

---

## 5. Components

- **Small, reusable, predictable.** If a block appears >2×, make a component.
- One responsibility per component.
- Use Tailwind utilities; avoid large custom CSS; avoid inline styles.
- Primitives live in `lib/components/ui/` (`Button`, `Card`, `Input`, `Modal`, `Dialog`, `Alert`, `Badge`, `Skeleton`, `Loading`, `Toast`, `Dropdown`, `StatusBadge`, `SectionCard`, `StateCard`, `OrDivider`, `AuthLayout`).

### Buttons
Variants: `primary` (Get Started, Purchase), `secondary` (Learn More, Details), `outline` (secondary), `ghost` (nav/icon), `danger` (destructive only).
States: hover, active, disabled, loading.

### Inputs
Label + placeholder + focus + error + disabled states. Validation errors below the field.

### Cards
Consistent padding, rounded corners, border, optional subtle shadow.

### Tables
Bordered, aligned, zebra/row-hover where useful; responsive (scroll or card transform on mobile).

### Alerts
`role="alert"`, `aria-live` for status. Variants map to status colors.

### Modals / Dialogs
Focus trap, Escape to close, backdrop click optional, accessible label.

---

## 6. Forms

- Validate input; show inline errors; disable submit while processing; prevent duplicate submissions.
- Preserve user input on error.
- Server-side validation is the source of truth (never trust frontend only).

---

## 7. Loading & Empty States

- **Loading**: skeletons / spinners — never blank space.
- **Empty**: explain what happened, why, and the next action (CTA).

---

## 8. Responsive Rules

- Mobile-first; support mobile / tablet / desktop / large desktop.
- Single column on mobile; comfortable touch targets.
- Multi-column with whitespace on larger screens.
- Max content width consistent; no full-width text blocks.

---

## 9. Accessibility

Every interactive element:
- Keyboard navigable.
- Visible focus.
- Accessible label.
- Semantic HTML; ARIA where needed.
- Meet WCAG AA where practical.
- Never replace `<button>` with clickable `<div>`.

---

## 10. Dark Mode

- Driven by design tokens; `prefers-color-scheme` + user toggle.
- No theme-specific hacks; components read tokens only.

---

## 11. Animation

- Subtle; **150–300ms**.
- Use Svelte native transitions (`fade`, `fly`, `slide`, `scale`) over libraries.
- Apply to page transitions, hover, dialogs, dropdowns, accordions, notifications.
- Avoid continuous/blocking animations.

---

## 12. Section Structure (landing)

```
Navbar → Hero → Trusted By → Features → Solutions →
How It Works → Testimonials → Pricing → FAQ → CTA → Footer
```

---

## 13. SEO

Every page: title, meta description, canonical URL, Open Graph, Twitter metadata — via SvelteKit native `<svelte:head>`.
