React to Svelte Migration Guide

Purpose

This document defines the migration rules for converting the existing React frontend into a modern SvelteKit application.

The objective is not to translate React code line by line.

The objective is to rebuild the application using idiomatic Svelte 5 while preserving:

* Functionality
* User experience
* Visual design
* Accessibility
* SEO
* Performance

⸻

Core Philosophy

❌ Do not convert React syntax into Svelte syntax.

✅ Re-implement the feature using Svelte best practices.

Always prefer:

* Simplicity
* Readability
* Native Svelte features
* Modern SvelteKit architecture

⸻

Migration Goals

Every migrated page must:

* Preserve functionality
* Preserve responsive behaviour
* Preserve accessibility
* Preserve SEO
* Reduce unnecessary complexity
* Reduce JavaScript
* Improve maintainability

⸻

General Rules

The old React project located in:

client/

is the reference implementation.

It is read-only.

Never modify files inside client.

⸻

Modern Svelte 5

Use Svelte 5.

Prefer modern APIs.

Avoid legacy syntax unless compatibility requires it.

⸻

Component Mapping

Components

React

function Button() {}

Svelte

Button.svelte

Prefer one component per file.

⸻

Props

React

function Card({ title }) {}

Svelte

let { title } = $props();

Keep props typed.

⸻

Local State

React

const [count, setCount] = useState(0);

Svelte

let count = $state(0);

Do not emulate React state management.

⸻

Derived State

React

const total = useMemo(() => price * quantity, [price, quantity]);

Svelte

const total = $derived(price * quantity);

Do not use memoization unless actually required.

⸻

Side Effects

React

useEffect(() => {
    ...
}, []);

Svelte

$effect(() => {
    ...
});

Only use effects when interacting with the outside world.

Do not replace every React effect with a Svelte effect.

Many React effects disappear completely in Svelte.

⸻

Refs

React

const ref = useRef();

Svelte

<div bind:this={element}></div>

⸻

Context

React

Context Provider

Svelte

setContext()
getContext()

Only use context for truly shared state.

⸻

Global State

React

Context + Reducer

Svelte

Stores.

Prefer local state.

Use stores only when necessary.

⸻

Routing

React

react-router

SvelteKit

File-based routing.

Never recreate React Router.

⸻

Navigation

React

navigate("/about")

SvelteKit

goto("/about")

⸻

Current Route

React

useLocation()

SvelteKit

$page

⸻

Head Management

React

SEO hooks

Helmet

useEffect

↓

SvelteKit

<svelte:head>

Do not recreate React SEO utilities.

⸻

Layout

React

App.tsx

↓

SvelteKit

routes/+layout.svelte

Global layouts belong here.

⸻

Nested Layouts

Use nested layouts only when they provide clear separation.

Avoid unnecessary nesting.

⸻

CSS

Prefer:

Tailwind

↓

Component styles

↓

Global CSS

Avoid recreating large CSS files.

⸻

Animations

React

Framer Motion

↓

Svelte

Native transitions

Use:

* fade
* fly
* slide
* scale

Only introduce animation libraries if native transitions are insufficient.

⸻

Event Handling

React

onClick

↓

Svelte

onclick

Keep event handlers small.

Move complex logic into functions.

⸻

Forms

Prefer native Svelte bindings.

Avoid React form patterns.

⸻

Conditional Rendering

React

condition && (...)

↓

Svelte

{#if}

⸻

Lists

React

array.map(...)

↓

Svelte

{#each}

Always provide keys when rendering dynamic collections.

⸻

Loading State

Avoid duplicated loading logic.

Create reusable loading components where appropriate.

⸻

API Calls

Do not call fetch() everywhere.

Create reusable API modules.

Example

lib/api/

Pages should consume the API layer.

⸻

Data Loading

Prefer server-side loading.

Client-side loading should be reserved for:

* Search
* Polling
* User actions
* Infinite scrolling

⸻

React Hooks

React hooks should not be recreated one-to-one.

Evaluate whether the hook is still needed.

Many disappear naturally in Svelte.

⸻

React Utilities

Do not recreate:

* useMemo
* useCallback
* React.memo

unless profiling demonstrates a need.

Svelte’s compiler handles many optimizations automatically.

⸻

Component Decomposition

Do not copy the React component tree exactly.

Instead:

Identify logical UI components.

Create reusable Svelte components.

⸻

File Structure

Follow the Svelte project structure.

Do not mirror the React folder hierarchy if a cleaner Svelte organization exists.

⸻

Performance

During migration:

Reduce:

* JavaScript
* Unnecessary reactivity
* Duplicate rendering
* Client-side work

Prefer server rendering where appropriate.

⸻

Accessibility

Every migrated component must preserve:

* Keyboard navigation
* Focus management
* ARIA labels
* Semantic HTML

Never regress accessibility during migration.

⸻

SEO

Every page must preserve:

* Title
* Meta description
* Canonical URL
* Structured data (where applicable)
* Open Graph metadata

SEO should use SvelteKit’s native capabilities.

⸻

Migration Checklist

For every migrated page:

* Functionality matches React version.
* Visual appearance matches React version.
* Responsive behaviour is preserved.
* Accessibility is preserved.
* SEO is preserved.
* TypeScript passes.
* ESLint passes.
* No React dependencies remain.
* No React patterns remain.
* Uses idiomatic Svelte.
* Uses reusable components.
* Uses modern SvelteKit conventions.

⸻

Migration Strategy

Pages should be migrated independently.

Recommended order:

1. Shared assets
2. Global styles
3. Layout
4. Navigation
5. Footer
6. Shared UI components
7. Independent pages
8. Complex pages
9. Landing page
10. Final polish

After each migration:

* Compare against the React implementation.
* Verify functionality.
* Remove duplicated code.
* Refactor where appropriate.

Do not migrate the next page until the current one is complete.

⸻

Success Criteria

The migration is complete only when:

* Every React page has a Svelte equivalent.
* No React packages remain.
* No React code remains.
* No React architectural patterns remain.
* The application feels like it was originally built with SvelteKit.
* The codebase is simpler, more maintainable, and easier to extend than the original React implementation.