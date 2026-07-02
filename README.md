# Tarkify Platform — Architecture & Deployment Guide

Tarkify is a business automation platform featuring a production-grade checkout and entitlement delivery system for digital products (e.g. DevBeast) using Razorpay. It is designed for maximum speed, security, and zero-touch VPS deployments.

---

## 1. Architectural Overview

The Tarkify platform splits into three decoupled layers: SvelteKit (Frontend), Bun/Hono (Backend), and PostgreSQL (Database). Traffic routes securely through a Cloudflare Tunnel.

```
                         +-----------------------------------+
                         |         SvelteKit Frontend        |
                         |  (Static/SSR — Hosted on Vercel)  |
                         +-----------------+-----------------+
                                           |
                                  HTTPS (via Cloudflare)
                                           |
                                           v
                         +-----------------+-----------------+
                         |      Cloudflare Tunnel (Edge)     |
                         |  (Maps backend.tarkify.qzz.io)    |
                         +-----------------+-----------------+
                                           |
                                Local HTTP (VPS Host:3009)
                                           |
                                           v
                         +-----------------+-----------------+
                         |         Hono API Router           |
                         |  (Docker Container — Port 3001)   |
                         +-----------------+-----------------+
                                           |
                                Internal Docker Network
                                           |
                                           v
                         +-----------------+-----------------+
                         |       PostgreSQL Database         |
                         |  (Docker Container — Port 5432)   |
                         +-----------------------------------+
```

### Components

* **Frontend (SvelteKit 5 + Tailwind CSS v4)**: Hosted on **Vercel** utilizing `@sveltejs/adapter-vercel` for server-side rendering (SSR) and static prerendering. It initiates orders, mounts the Razorpay checkout overlay, receives verification tokens, and triggers downloads.
* **Backend (Bun + Hono)**: Deployed inside a **Docker container** on a VPS. Bun executes the fast Hono server. The backend is the single source of truth for product catalog items, prices, user entitlements, and download tokens.
* **Database (PostgreSQL 15)**: Runs inside a Docker container. Manages users, products, purchases, active entitlements, and download keys.
* **Storage Directory**: Mounts the host folder `./storage` to the container path `/app/storage`, securing files (located in `/app/storage/products/{download_key}/`) across restarts.
* **Cloudflare Tunnel**: Exposes VPS port `3009` securely under `https://backend.tarkify.qzz.io` without opening public host ports.

---

## 2. Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Default | Purpose | Production Note |
|---|---|---|---|---|
| `PORT` | Optional | `3001` | Server listening port inside the container. | Overridden to `3001` in Docker. |
| `NODE_ENV` | Optional | `development` | Runtime environment mode. | Enforce `production` on VPS. |
| `DATABASE_URL` | Required | — | Database connection string. | **Ignored in Docker Compose**, which builds it from Postgres parameters. |
| `PG_USER` | Optional | `tarkify_user` | Postgres login username. | Change in production. |
| `PG_PASSWORD` | Optional | `tarkifyPassword` | Postgres login password. | Change to a strong random string. |
| `PG_DB` | Optional | `tarkifyDB` | Database catalog name. | Change in production. |
| `RAZORPAY_KEY_ID` | Required | — | Razorpay API Key ID. | Must start with `rzp_live_` in prod. |
| `RAZORPAY_KEY_SECRET` | Required | — | Razorpay secret key. | Keep secure. Do not share. |
| `RAZORPAY_WEBHOOK_SECRET` | Required | — | Webhook validation key. | Configure in Razorpay Dashboard. |
| `FRONTEND_URL` | Optional | `http://localhost:5173` | CORS whitelist domain. | Set to `https://tarkify.qzz.io`. |
| `STORAGE_PATH` | Optional | `./storage` | Folder storing zip packages. | Set to `/app/storage` in Docker. |
| `DOWNLOAD_TOKEN_TTL_SECONDS`| Optional | `600` | Expiration (s) of download links. | Default is 10 minutes. |

### Frontend Configuration (`frontend/.env`)

| Variable | Required | Default | Purpose | Production Note |
|---|---|---|---|---|
| `VITE_API_URL` | Required | `http://localhost:3009` | Backend base API URL. | Set to `https://backend.tarkify.qzz.io`. |

---

## 3. Local Development Setup

### Prerequisites
* [Bun](https://bun.sh) runtime installed.
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

### Step-by-Step Setup

1. **Configure Environment Variables**:
   * Create backend config:
     ```bash
     cp backend/.env.example backend/.env
     ```
   * Create frontend config:
     ```bash
     cp frontend/.env.example frontend/.env
     ```
   * Populate credentials in `backend/.env` (Razorpay test keys starting with `rzp_test_`).

2. **Launch Database & Migrations**:
   * Navigate to `/backend` and start Postgres:
     ```bash
     cd backend
     npm run db:start
     ```
   * This command automatically downloads Postgres, binds host port `5439`, waits until database readiness, runs database migrations (`scripts/migrate.ts`), and initiates the backend Hono API at `http://localhost:3009`.

3. **Launch Frontend Development Server**:
   * Navigate to `/frontend` and run:
     ```bash
     cd frontend
     npm run dev
     ```
   * Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Production VPS Deployment Guide

Our backend stack runs fully containerized under a zero-touch, self-healing configuration.

### Initial Server Setup
1. Clone the repository to your VPS directory (e.g. `/opt/tarkify`).
2. Create the production environment configurations:
   * Populate `backend/.env` with your **live production keys** (`rzp_live_...`), strong database passwords, and the frontend URL (`FRONTEND_URL=https://tarkify.qzz.io`).
   * Populate `frontend/.env.production` with your backend URL (`VITE_API_URL=https://backend.tarkify.qzz.io`).

### Deployment Executions

Run the following command in `/backend` on your VPS to build and start the server:
```bash
docker compose up --build -d
```

#### Automatic Lifecycle Actions:
1. **Database Starts**: PostgreSQL launches on port `5432` internally.
2. **Health Gate**: The API container blocks execution until Postgres passes the database connection probe.
3. **Automatic Migrations**: The entrypoint script (`docker-entrypoint.sh`) runs `bun run scripts/migrate.ts` before starting the server. This applies any missing migration files inside transactions and writes status logs.
4. **Server Initialization**: The API starts and listens on host port `3009` (mapped internally to `3001` inside the container).
5. **Auto-Recovery**: Containers are bound to `restart: always` and wrapped with a Docker health check.

### Data Persistence Scenarios

* **Database Records**: Persistent data resides inside the named volume `pgdata` (`/var/lib/postgresql/data` internally).
* **Product Zip Packages**: Persisted via bind-mount `./storage:/app/storage`. Place your product zip files inside `backend/storage/products/{download_key}/` on the VPS host machine.
* **Volume Persistence Summary**:
  * `docker compose down` -> data survives.
  * Rebuilding API images -> data survives.
  * VPS Host reboot -> Docker restarts both containers automatically, data survives.
  * `docker compose down -v` -> **Destroys DB data** (clears named volume).

### Application Updates
To fetch updates and deploy a new version:
```bash
git pull
docker compose up --build -d
```
*Migrations will execute automatically. If a migration fails, the container stops and does not launch the new server version, protecting the database state (Rollback safety).*

---

## 5. Health & Monitoring

We distinguish between liveness and readiness:

* **Liveness Endpoint (`GET /api/health`)**:
  * Used for basic uptime trackers.
  * Always returns HTTP `200` with uptime and timestamp if the Node process is running.
* **Readiness Endpoint (`GET /api/ready`)**:
  * Used for container probes and load balancers.
  * Returns HTTP `200 OK` only when the database is active and all migrations are applied.
  * Returns HTTP `503 Service Unavailable` if the DB is offline or migrations are missing.
* **Docker Health Check**:
  * Docker checks `/api/ready` every 15 seconds. If the endpoint returns `503`, the container is marked as `unhealthy`, prompting orchestrators to restart it or route traffic away.
  * Verify health status via:
    ```bash
    docker compose ps
    ```

---

## 6. Cloudflare Tunnel Integration

Cloudflare Tunnel provides secure public access to your backend without exposing raw VPS ports to the internet.

1. **Domain Route Mapping**:
   * Map your public domain `backend.tarkify.qzz.io` to local VPS service `http://localhost:3009`.
2. **CORS Enforcement**:
   * The Hono API CORS middleware whitelists `https://tarkify.qzz.io` (and Vercel preview environments). Any non-whitelisted cross-origin request is rejected.

---

## 7. Frontend Deployment (Vercel)

The SvelteKit frontend deploys to Vercel dynamically:

* **Build Command**: `vite build`
* **Output Adapter**: `@sveltejs/adapter-vercel`
* **Vercel Environment Settings**: Add `VITE_API_URL=https://backend.tarkify.qzz.io` under Vercel project environment settings.

---

## 8. Database Migrations

* **System Structure**: Migration SQL files reside under [backend/migrations/](file:///Users/kushagra/Documents/code/tarkify/backend/migrations/). They execute sequentially and record their application history in the `_migrations` database table.
* **Adding a New Migration**:
  1. Create a SQL file with a sequential prefix: `backend/migrations/010_my_new_table.sql`.
  2. Write DDL statements inside it. Ensure statements are safe and idempotent.
  3. Deploy: On VPS push, `docker compose up --build -d` will detect and run the new migration script automatically on startup.

---

## 9. Troubleshooting Guide

### 1. Backend API Container Won't Start
* **Cause**: Environment variables are missing or incorrect.
* **Fix**: Check `docker compose logs api`. Ensure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` are defined.
* **Cause**: Database is cold-starting.
* **Fix**: The API waits up to 45s for Postgres to start. Check if Postgres is running: `docker compose logs postgres`.

### 2. Database Connection Failure
* **Cause**: Docker Compose is using container networks, but you defined `localhost` in `DATABASE_URL`.
* **Fix**: Remember that `DATABASE_URL` is ignored inside the container. Verify that the variables `PG_USER`, `PG_PASSWORD`, and `PG_DB` in `backend/.env` match the credentials.

### 3. Migration Failures
* **Cause**: Syntax error or structural collision in a new SQL file.
* **Fix**: Check logs: `docker compose logs api`. If a migration fails, the transaction rolls back. Fix the SQL file and run `docker compose up --build -d` to retry.

### 4. CORS Violation Errors
* **Cause**: The frontend URL does not match `FRONTEND_URL` in `backend/.env`.
* **Fix**: Inspect the response headers of your failed request. Ensure `FRONTEND_URL` matches your frontend origin (no trailing slash).

### 5. Content Security Policy (CSP) Failures
* **Cause**: Google Fonts, Lucide icons, or Razorpay checkout script is blocked.
* **Fix**: Check browser console logs. Standard allowed domains are configured in `svelte.config.js`. If you add external scripts/images, add them to `svelte.config.js` directives under the appropriate section.
* **Cause**: Flash of incorrect theme or theme selector script block.
* **Fix**: Ensure `/js/theme.js` is loaded correctly from the static folder and matches `src="/js/theme.js"` in `app.html`.

### 6. Razorpay Callback Failure
* **Cause**: The webhook secret configured in Razorpay dashboard does not match `RAZORPAY_WEBHOOK_SECRET`.
* **Fix**: Signature validation will fail. Verify matching secrets in Razorpay dashboard and VPS `backend/.env`. Check `docker compose logs api` for validation signature mismatches.