FROM oven/bun:alpine

WORKDIR /app

# Create non-root user for production security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependency manifests first (leverages Docker layer caching)
COPY package.json bun.lock ./

# Install production dependencies only (smaller image, fewer vulnerabilities)
RUN bun install --frozen-lockfile --production

# Copy entrypoint script explicitly (needs executable permission)
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy application source code (everything not in .dockerignore)
COPY . .

# Ensure storage directory exists with correct ownership
RUN mkdir -p /app/storage && chown -R appuser:appgroup /app/storage

# Switch to non-root user
USER appuser

# Expose internal API port
ENV PORT=3001
EXPOSE 3001

# Entrypoint runs migrations, then execs to the main process
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "run", "src/index.ts"]
