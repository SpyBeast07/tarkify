FROM oven/bun:alpine

WORKDIR /app

# Copy package manifest and lockfile
COPY package.json bun.lock ./

# Install dependencies (frozen-lockfile ensures deterministic dependency versions)
RUN bun install --frozen-lockfile

# Copy codebase
COPY . .

# Expose internal API port (Hono default)
EXPOSE 3001

# Automatically run pending database migrations, then start the server
CMD ["sh", "-c", "bun run scripts/migrate.ts && bun run src/index.ts"]
