# ─── Build Stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy only built files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Use a simple HTTP server (built into Node)
RUN npm install -g http-server

USER nodejs

EXPOSE 5050

CMD ["http-server", "dist", "-p", "5050", "-a", "0.0.0.0"]