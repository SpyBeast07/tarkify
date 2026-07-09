Tarkify Architecture

Overview

Tarkify is the public company and product website.

Its primary responsibilities are:

* Present the company and products
* Showcase solutions and case studies
* Publish articles and resources
* Provide contact information
* Generate leads
* Redirect users into products or the payment system

The website is not responsible for:

* Authentication
* Billing
* Subscription management
* Payment processing
* Business logic
* Database management

Those responsibilities belong to dedicated backend services.

⸻

High-Level Architecture

                Users
                   │
                   ▼
        SvelteKit Frontend
                   │
                   ▼
          Backend API (Bun + Hono)
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
 PostgreSQL    Payment API   Future Services
                  │
                  ▼
              Razorpay

⸻

Repository Structure

tarkify/
backend/
    API
    Services
    Database
    Payments
    Email
    Integrations
frontend/
    SvelteKit
    Components
    Routes
    Assets
    SEO
    Static Pages
docs/

⸻

Frontend Responsibilities

The frontend is responsible only for presentation.

Responsibilities:

* Rendering pages
* SEO
* Navigation
* Forms
* Animations
* API requests
* Client-side validation
* Accessibility
* Theme management

The frontend must never contain:

* Database access
* Payment verification
* Authentication logic
* Business rules
* Secrets
* API keys

⸻

Backend Responsibilities

The backend owns all business logic.

Responsibilities include:

* Contact form handling
* Email sending
* Payment processing
* Authentication (future)
* Product APIs
* Newsletter APIs
* Database access
* Security
* Validation

⸻

Future Services

The architecture intentionally separates concerns.

Future services include:

payments.kushagragupta.co.in
Handles:
- Razorpay
- Webhooks
- Billing
- Purchases
- Download links
- Invoices
portal.kushagragupta.co.in
Handles:
- Authentication
- Customer dashboard
- Purchases
- Downloads
- Billing
- Subscription management
products
Each product manages its own users,
permissions and business logic.

⸻

Frontend Folder Structure

src/
lib/
    api/
    components/
        common/
        layout/
        ui/
        sections/
    stores/
    utils/
    types/
    assets/
routes/
static/

⸻

Component Architecture

Components are grouped by responsibility.

components/
layout/
    Navbar
    Footer
    ThemeToggle
sections/
    Hero
    Testimonials
    Features
    Pricing
ui/
    Button
    Card
    Modal
    Badge
    Input
common/
    Newsletter
    ContactForm

Pages should compose components.

Pages should not contain large reusable UI blocks.

⸻

State Management

Use local component state whenever possible.

Global stores are only allowed for:

* Theme
* Mobile navigation
* User preferences
* Notifications

Avoid global state for page-specific data.

⸻

Data Fetching

Server data should use SvelteKit load functions where appropriate.

Client-side fetching should only be used when:

* Data updates after page load
* Polling
* Search
* Infinite scrolling
* User-triggered actions

⸻

API Layer

All API communication goes through:

src/lib/api

Pages must never call fetch() directly if the request is reusable.

Create reusable API functions.

Example:

api/
contact.ts
newsletter.ts
products.ts

⸻

Routing

Use SvelteKit file-based routing.

Each route owns only its page.

Shared layouts belong inside:

routes/+layout.svelte

Nested layouts should be introduced only when they provide meaningful separation.

⸻

Styling

Styling priorities:

1. Tailwind CSS
2. Shared UI components
3. Minimal custom CSS
4. Avoid inline styles

Maintain a consistent spacing and typography scale.

⸻

SEO

Every page should include:

* Title
* Meta description
* Canonical URL
* Open Graph metadata
* Twitter metadata
* Structured data where appropriate

SEO must be implemented using SvelteKit’s native head support.

⸻

Performance Goals

The website should:

* Minimize JavaScript shipped to the client
* Prefer server rendering
* Lazy-load heavy components
* Optimize images
* Split code by route
* Avoid unnecessary dependencies

⸻

Accessibility

All components must:

* Support keyboard navigation
* Have visible focus states
* Use semantic HTML
* Include ARIA attributes when required
* Meet WCAG AA standards where practical

⸻

Security

The frontend must never expose:

* Secrets
* Private API keys
* Payment verification
* Database credentials

Validation on the frontend improves UX but never replaces backend validation.

⸻

Future Roadmap

Future additions should integrate cleanly without changing the architecture.

Planned additions:

* Customer Portal
* Payment Platform
* Authentication
* Billing
* Subscription Management
* Documentation
* Blog CMS
* Analytics
* Search
* Internationalization

These features should be added as independent modules or services while preserving the separation between presentation and business logic.