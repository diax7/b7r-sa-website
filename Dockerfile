# syntax=docker/dockerfile:1
# Multi-stage build (BRD §8.6): deps -> build -> runner. Target image <= 250 MB.
#
# The build prerenders every page from the CMS (ADR-025), so it needs the production database
# and the Payload secret. They arrive as BuildKit secrets (never in a layer):
#   docker build --secret id=DATABASE_URL --secret id=PAYLOAD_SECRET \
#                --secret id=S3_ACCESS_KEY_ID --secret id=S3_SECRET_ACCESS_KEY ...
# .github/workflows/deploy.yml is the reference invocation.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Every NEXT_PUBLIC_* value is inlined at build time (docs/RUNBOOK.md, environment matrix).
ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_APP_URL="https://b7r.app"
ARG NEXT_PUBLIC_WHATSAPP="966501699572"
ARG NEXT_PUBLIC_GA_ID=""
ARG NEXT_PUBLIC_UMAMI_SRC=""
ARG NEXT_PUBLIC_UMAMI_ID=""
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
# Media URLs are embedded in the prerendered pages, so the storage location is a build input too.
ARG PAYLOAD_PUBLIC_SERVER_URL=""
ARG S3_BUCKET=""
ARG S3_REGION="auto"
ARG S3_ENDPOINT=""
ARG S3_PUBLIC_URL=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_WHATSAPP=$NEXT_PUBLIC_WHATSAPP \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_UMAMI_SRC=$NEXT_PUBLIC_UMAMI_SRC \
    NEXT_PUBLIC_UMAMI_ID=$NEXT_PUBLIC_UMAMI_ID \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    PAYLOAD_PUBLIC_SERVER_URL=$PAYLOAD_PUBLIC_SERVER_URL \
    S3_BUCKET=$S3_BUCKET \
    S3_REGION=$S3_REGION \
    S3_ENDPOINT=$S3_ENDPOINT \
    S3_PUBLIC_URL=$S3_PUBLIC_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=secret,id=DATABASE_URL \
    --mount=type=secret,id=PAYLOAD_SECRET \
    --mount=type=secret,id=S3_ACCESS_KEY_ID \
    --mount=type=secret,id=S3_SECRET_ACCESS_KEY \
    DATABASE_URL="$(cat /run/secrets/DATABASE_URL)" \
    PAYLOAD_SECRET="$(cat /run/secrets/PAYLOAD_SECRET)" \
    S3_ACCESS_KEY_ID="$(cat /run/secrets/S3_ACCESS_KEY_ID 2>/dev/null || true)" \
    S3_SECRET_ACCESS_KEY="$(cat /run/secrets/S3_SECRET_ACCESS_KEY 2>/dev/null || true)" \
    pnpm build

FROM node:22-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
