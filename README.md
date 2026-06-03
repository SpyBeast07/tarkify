# Tarkify

Tarkify is a web platform featuring a production-ready purchase system for DevBeast using Razorpay.

## Technology Stack

- **Frontend**: SvelteKit 5, Tailwind CSS v4, Lucide Svelte, code splitting, and responsive design.
- **Backend**: Bun runtime + Hono web framework (lightweight, high performance).
- **Database**: PostgreSQL (relational storage with schema tracking and dynamic entitlements).
- **Containerization**: Docker & Docker Compose (safe, conflict-free configurations).

---

## Architecture Overview

```
                        +----------------------------+
                        |     SvelteKit Frontend     |
                        |   (Runs on host/Caddy)     |
                        +--------------+-------------+
                                       |
                     HTTPS (via Cloudflare Tunnel)
                                       |
                                       v
                        +--------------+-------------+
                        |        Hono Backend        |
                        | (Docker Container - Port 3009)
                        +--------------+-------------+
                                       |
                         Internal Docker Network
                                       |
                                       v
                        +--------------+-------------+
                        |     PostgreSQL Database    |
                        | (Docker Container - Port 5439)
                        +----------------------------+
```

---

## Local Development Setup

### 1. Database & Backend Setup

1. **Configure Environment Variables**:
   In `/backend`, copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Add your Razorpay live/test credentials and database details.

2. **Launch Container Environment**:
   Inside `/backend`, start the services:
   ```bash
   npm run db:start
   ```
   *This builds the API image, starts PostgreSQL on host port `5439` (to avoid host port `5432` collisions), and automatically runs the database migrations.*

3. **Verify API is Running**:
   Open [http://localhost:3009/api/health](http://localhost:3009/api/health) in your browser. You should see `{"status":"ok"}`.

### 2. Frontend Setup

1. **Configure Environment Variables**:
   In `/frontend`, copy `.env.example` to `.env`:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   *This automatically sets `VITE_API_URL=http://localhost:3009` to match the backend port.*

2. **Start the Frontend Server**:
   Inside `/frontend`, run:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) to see the app.

---

## VPS Deployment Guide

Deploying the backend on your VPS is fully automated with Docker Compose. Yes, you only need to run a single command!

### Step 1: Copy Code to VPS
Clone your repository or copy the code files to your VPS folder (e.g., `~/tarkify`).

### Step 2: Configure Production Environment
1. In `backend/`, create a production `.env` file containing your live secrets:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://user:pass@localhost:5439/tarkifyDB
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   FRONTEND_URL=https://tarkify.qzz.io
   STORAGE_PATH=/app/storage
   ```
2. In `frontend/`, verify that `frontend/.env.production` defines the production API URL:
   ```env
   VITE_API_URL=https://backend.tarkify.qzz.io
   ```

### Step 3: Run the Backend Stack
Run the following command in the `backend/` directory on your VPS:
```bash
docker compose up --build -d
```

#### What happens automatically:
1. **PostgreSQL** starts up.
2. The Hono **API container** waits until PostgreSQL is completely healthy and ready to accept connections.
3. The API container runs the database **migrations runner** (`bun run scripts/migrate.ts`) to automatically apply and track all schema/seed updates in the DB.
4. The Hono web server launches and starts listening on port `3009` (mapped internally to `3001`).
5. Both containers are configured with a **`restart: always`** policy. If either service crashes, or if you reboot your VPS, Docker will automatically restart them immediately.

### Step 4: Point Cloudflare Tunnel (Single Endpoint)
Configure your Cloudflare Tunnel to map your public API hostname:
- **Public Hostname**: `backend.tarkify.qzz.io`
- **Service Type**: `HTTP`
- **URL**: `http://localhost:3009`

Your backend is now fully live, self-healing, and connected securely!