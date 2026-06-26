#!/bin/sh
set -e

# ── Database Migrations ──────────────────────────────────────────
echo "→ Running database migrations..."
bun run scripts/migrate.ts
echo "✓ Migrations complete"

# ── Start Server ─────────────────────────────────────────────────
# exec replaces shell with the main process so signals (SIGTERM/SIGINT)
# arrive at the Bun process directly, enabling graceful shutdown.
exec "$@"
