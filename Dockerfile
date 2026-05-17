# ── Stage 1: Build ────────────────────────────────────────────
FROM node:lts-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm i -g pnpm

# Optional: set only if frontend and backend are on different domains.
# If both are behind the same domain/reverse proxy, leave empty — relative URLs (/api/...) will work.
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy dependency manifests first (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install ALL dependencies (skip build scripts, then rebuild sharp explicitly)
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild sharp

# Copy the rest of the source code
COPY . .

# Build Next.js (standalone output is configured in next.config.ts)
RUN pnpm build

# ── Stage 2: Production runtime ──────────────────────────────
FROM node:lts-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone server
COPY --from=builder /app/.next/standalone ./

# Copy static assets (not included in standalone output)
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
