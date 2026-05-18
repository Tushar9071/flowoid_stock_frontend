# ── Stage 1: Build ────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm i -g pnpm

# NEXT_PUBLIC_* vars must be present at build time so Next.js can inline them
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy dependency manifests first (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install ALL dependencies (dev included — needed for the build step)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build Next.js (standalone output is configured in next.config.mjs)
RUN pnpm run build

# ── Stage 2: Production runtime ──────────────────────────────
FROM node:24-alpine AS runner

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

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
