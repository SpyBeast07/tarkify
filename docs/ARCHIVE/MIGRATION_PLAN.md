# Tarkify React to Svelte/SvelteKit Migration Plan

This document outlines the migration plan from the React-based frontend (`./client`) to a Svelte/SvelteKit-based implementation.

---

## 1. Folder Structure

The current React project layout under `./client`:
*   `client/`
    *   `public/` - Static assets including site images and devbeast mockup directories.
    *   `src/`
        *   `components/` - React components (AgentSimulator, Cards, Footer, Hero, ROICalculator, etc.).
        *   `context/` - `ThemeContext.tsx` for light/dark mode management.
        *   `data/` - Static JSON and TS mock data files (`solutions.json`, `solutions.ts`, `discover.ts`).
        *   `hooks/` - `useSEO.ts` hook.
        *   `App.tsx` - App shell containing router definitions and base layout.
        *   `main.tsx` - App entry point.
        *   `index.css` - Primary stylesheet.
        *   `extensions.css` - Component-specific/extended layout styles.
        *   `Home.tsx`, `Solutions.tsx`, `SolutionDetail.tsx`, `Contact.tsx`, `Careers.tsx`, `Discover.tsx`, `DiscoverDetail.tsx` - Page level components.

### Proposed SvelteKit Folder Structure
For SvelteKit, the structure maps to file-based routing:
*   `src/`
    *   `lib/`
        *   `components/` - Svelte components (porting all components).
        *   `context/` - Theme store or context.
        *   `data/` - Static data.
    *   `routes/`
        *   `+layout.svelte` - Global layout (Navbar, Footer, InteractiveBackground, Theme context).
        *   `+page.svelte` - Home page.
        *   `solutions/`
            *   `+page.svelte` - Solutions listing.
            *   `[id]/`
                *   `+page.svelte` - Solution details.
        *   `contact/`
            *   `+page.svelte` - Contact page.
        *   `careers/`
            *   `+page.svelte` - Careers page.
        *   `discover/`
            *   `+page.svelte` - Discover index page.
            *   `[slug]/`
                *   `+page.svelte` - Discover article detail page.
    *   `app.html` - Base HTML document.

---

## 2. Route Structure

Below is the mapping of React Router routes to SvelteKit file-system routes:

| React Route | React Component | SvelteKit Route |
| :--- | :--- | :--- |
| `/` | `Home.tsx` | `src/routes/+page.svelte` |
| `/solutions` | `Solutions.tsx` | `src/routes/solutions/+page.svelte` |
| `/solutions/:id` | `SolutionDetail.tsx` | `src/routes/solutions/[id]/+page.svelte` |
| `/contact` | `Contact.tsx` | `src/routes/contact/+page.svelte` |
| `/careers` | `Careers.tsx` | `src/routes/careers/+page.svelte` |
| `/discover` | `Discover.tsx` | `src/routes/discover/+page.svelte` |
| `/discover/:slug` | `DiscoverDetail.tsx` | `src/routes/discover/[slug]/+page.svelte` |

---

## 3. Shared Layouts

The current root application shell `App.tsx` sets up:
1.  **Global state/utilities**:
    *   `window.scrollTo(0, 0)` on route change.
    *   `InteractiveBackground` rendering at the root level.
    *   `Navbar` navigation header.
    *   `Footer` navigation footer.
    *   `<AnimatePresence mode="wait">` for route transitions.
2.  **SvelteKit Equivalent**: `src/routes/+layout.svelte` will orchestrate this structure, using Svelte's `<slot />` or `{@render children()}` (depending on Svelte 4 or 5), page-change transition logic, and standard layout wrappers.

---

## 4. Shared Components

These components are reused across multiple pages or layouts:
*   `Navbar` - Global header with navigation and theme toggle.
*   `Footer` - Global footer.
*   `InteractiveBackground` - Full screen canvas running Matter.js physics engine simulations and Web Audio API synthesizer.
*   `DynamicBackground` - Fluid animated gradient orbs (uses framer-motion).
*   `Newsletter` - Form component for subscribing to the newsletter (rendered in Careers, Contact, and Discover).
*   `FeedbackForm` - Bottom slider form for submitting product feedback (rendered in Solutions).
*   `Card` - Base card styling for product grid (rendered in Solutions).

---

## 5. Global CSS

1.  `client/src/index.css`: Defines root variables (dark/light themes), base resetting, typography configurations, grid utilities, container bounds, glassmorphic styling cards (`glass`), and button styling variants.
2.  `client/src/extensions.css`: Contains styles specific to Careers, Discover, and Testimonials carousel animation tracks.
*   *Migration Plan*: Port both directly into `src/app.css` or import them in `+layout.svelte`.

---

## 6. Utility Functions

*   `parseMarkdown` (defined inline in `client/src/DiscoverDetail.tsx`): A lightweight regex-based parser converting markdown elements (`###`, `##`, `**`, `[]()`, `* ` lists) to HTML elements.
    *   *Svelte Equivalent*: Extract to a utility file `src/lib/utils/markdown.ts` for clean reuse.

---

## 7. Hooks

*   `useSEO(title, description)` (defined in `client/src/hooks/useSEO.ts`): React hook modifying `document.title` and updating `<meta name="description">` inside `<head>`.
    *   *Svelte Equivalent*: SvelteKit handles SEO natively using the `<svelte:head>` block inside each route's page component (e.g. `<title>{title}</title>`). The hook can be removed entirely in favor of SvelteKit's declarative head tags.

---

## 8. Context Providers

*   `ThemeContext.tsx`: Tracks `theme` state (`light` | `dark`), reads/writes to `localStorage`, applies the `data-theme` attribute to the root document element, and exports a React context hook `useTheme()`.
    *   *Svelte Equivalent*: A writable Svelte store (e.g. `src/lib/stores/theme.ts`) combined with layout-level implementation, or Svelte context API (`setContext` / `getContext`).

---

## 9. API Clients

*   `Contact.tsx` performs a POST request to `/api/contact` using standard browser `fetch`.
    *   *Svelte Equivalent*: Standard `fetch` can remain identical, or leverage SvelteKit Form Actions (`+page.server.ts`) for standard robust handling.

---

## 10. Assets

All static files are located in `client/public/assets`:
*   `devbeast_mockup.webp`, `workflow_mockup.webp` - Solutions landing page images.
*   `kushagra.webp`, `ishita.webp` - Team profile avatars on the Contact page.
*   `devbeast/` - Directory containing 11 screenshots of the DevBeast dashboard (`containers.png`, `ports.png`, etc.) used by the slideshow carousel in `SolutionDetail.tsx`.
*   *Migration Plan*: Move these assets directly to the `static/assets/` directory in the SvelteKit project.

---

## 11. Pages in Dependency Order

To build up components incrementally, migrate them in the following order (from leaf/independent pages to highly integrated pages):

1.  **Contact Page (`Contact.tsx`)** - Simplest page structure, relies only on `Newsletter` and static images.
2.  **Careers Page (`Careers.tsx`)** - Moderate complexity (collapsible accordion cards, client validation), relies on `Newsletter`.
3.  **Discover Page (`Discover.tsx`)** - Category filters, search functionality, relies on `Newsletter`.
4.  **Discover Detail Page (`DiscoverDetail.tsx`)** - Relies on `Newsletter` and `parseMarkdown`.
5.  **Solutions Page (`Solutions.tsx`)** - Grid display using `Card` and `FeedbackForm`.
6.  **Solution Detail Page (`SolutionDetail.tsx`)** - High complexity slideshow transitions and rich data rendering.
7.  **Home Page (`Home.tsx`)** - Orchestrates multiple home section components (`Hero`, `IntegrationGallery`, `WhatWeDo`, `ROICalculator`, `HowItWorks`, `WhyTarkify`, `Testimonials`).

---

## 12. Components Used by Each Page

| Page | Components Used |
| :--- | :--- |
| `Home.tsx` | `Hero`, `IntegrationGallery`, `WhatWeDo`, `ROICalculator`, `HowItWorks`, `WhyTarkify`, `Testimonials` |
| `Solutions.tsx` | `Card`, `FeedbackForm` |
| `SolutionDetail.tsx` | None (imports Lucide icons directly and maps them inline) |
| `Contact.tsx` | `Newsletter` |
| `Careers.tsx` | `Newsletter` |
| `Discover.tsx` | `Newsletter` |
| `DiscoverDetail.tsx` | `Newsletter` |

---

## 13. Pages That Can Be Migrated Independently

*   **Contact Page (`Contact.tsx`)**
*   **Careers Page (`Careers.tsx`)**
*   **Discover / DiscoverDetail (`Discover.tsx`, `DiscoverDetail.tsx`)**
These pages have minimal dependencies on external physics components or shared client-state systems (except for layout aesthetics and theme context), making them clean targets for parallel or early stage migrations.

---

## 14. React-specific Code needing Svelte Equivalents

### A. Framer Motion Animations
React uses `framer-motion` for transitions, layout animations, and entry effects (e.g., `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>`).
*   *Svelte Equivalent*: Svelte has built-in transition capabilities via `svelte/transition` (`fade`, `fly`, `slide`, `scale`) and `svelte/animate`. These are lightweight, performant, and require no extra packages.

### B. Route Transitions (`AnimatePresence`)
In React, `<AnimatePresence>` handles page transition exits.
*   *Svelte Equivalent*: Standard Svelte transitions applied to page elements. When Svelte destroys/creates route templates, transitions execute naturally.

### C. Canvas & Matter-js Reference Management (`InteractiveBackground.tsx`)
React handles Matter.js rendering canvas elements using `useRef` and `useEffect` callbacks.
*   *Svelte Equivalent*: Svelte's `bind:this` directive binds elements cleanly, and operations are run inside the `onMount` lifecycle hook.

### D. Router Navigation Hooks
React uses `useNavigate()`, `useLocation()`, and `<Link>` from `react-router-dom`.
*   *Svelte Equivalent*:
    *   `<Link to="...">` $\rightarrow$ Standard HTML anchor tags `<a href="...">`
    *   `useNavigate()` $\rightarrow$ SvelteKit's `goto` function from `$app/navigation`
    *   `useLocation()` $\rightarrow$ SvelteKit's `$page` store from `$app/stores`
