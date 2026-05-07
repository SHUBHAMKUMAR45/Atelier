# ─────────────────────────────────────────────────────────────────
# Stage 1 — deps (install with cache mount)
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api/package.json          ./apps/api/
COPY packages/shared/package.json   ./packages/shared/
COPY packages/ai-core/package.json  ./packages/ai-core/
COPY packages/config/package.json   ./packages/config/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# ─────────────────────────────────────────────────────────────────
# Stage 2 — builder
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules         ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
# Explicitly delete any .env files that may have been copied in — never bake secrets into the image
RUN find . -name ".env" -not -name ".env.example" -delete &&     find . -name ".env.local" -delete &&     find . -name ".env.production" -delete &&     find . -name ".env.staging" -delete
RUN pnpm turbo run build --filter=@ai-fashion/shared --filter=@ai-fashion/ai-core
RUN pnpm turbo run build --filter=@ai-fashion/api

# ─────────────────────────────────────────────────────────────────
# Stage 3 — runner (minimal production image)
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache curl dumb-init
WORKDIR /app

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid  1001 --ingroup nodejs apiuser

# Copy only what's needed
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist         ./apps/api/dist
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=apiuser:nodejs /app/packages/shared/src   ./packages/shared/src
COPY --from=builder --chown=apiuser:nodejs /app/packages/ai-core/src  ./packages/ai-core/src
COPY --from=deps    --chown=apiuser:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps    --chown=apiuser:nodejs /app/node_modules          ./node_modules

USER apiuser
WORKDIR /app/apps/api

EXPOSE 4000

ENV NODE_ENV=production

# dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1
