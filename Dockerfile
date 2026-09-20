# syntax=docker/dockerfile:1
# Multi-stage build (BRD §8.6): deps -> build -> runner. Target image <= 250 MB.
#
# The build migrates the database, generates any missing photo renditions (ADR-064) and
# prerenders every page from it (ADR-025), so it needs
# the production database and the Payload secret. They reach the build stage one of two ways
# and never the runner image (assembled from this stage's files, not its layers):
#   - BuildKit secrets, from a CI build (.github/workflows/deploy.yml):
#       docker build --secret id=DATABASE_URL --secret id=PAYLOAD_SECRET \
#                    --secret id=S3_ACCESS_KEY_ID --secret id=S3_SECRET_ACCESS_KEY ...
#   - build args, when the platform builds from the repository and hands the app's
#     environment to the build (CranL, Koyeb, Render, Qovery): docs/RUNBOOK.md, "Deploy".

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate && apk add --no-cache bash
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Every NEXT_PUBLIC_* value is inlined at build time (docs/RUNBOOK.md, environment matrix).
ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
# Media URLs are embedded in the prerendered pages, so the storage location is a build input too.
ARG PAYLOAD_PUBLIC_SERVER_URL=""
ARG S3_BUCKET=""
ARG S3_REGION="auto"
ARG S3_ENDPOINT=""
ARG S3_PUBLIC_URL=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    PAYLOAD_PUBLIC_SERVER_URL=$PAYLOAD_PUBLIC_SERVER_URL \
    S3_BUCKET=$S3_BUCKET \
    S3_REGION=$S3_REGION \
    S3_ENDPOINT=$S3_ENDPOINT \
    S3_PUBLIC_URL=$S3_PUBLIC_URL \
    NEXT_TELEMETRY_DISABLED=1
# Production mode for the migration and the build: outside it Payload regenerates
# `payload-types.ts` and the import map on every init, and the build would type-check
# against whatever this environment produced.
ENV NODE_ENV=production
# A secret mount wins over the build arg of the same name; the build refuses to start
# without the database and the secret rather than prerender an empty site.
ARG DATABASE_URL=""
ARG PAYLOAD_SECRET=""
ARG S3_ACCESS_KEY_ID=""
ARG S3_SECRET_ACCESS_KEY=""
RUN --mount=type=secret,id=DATABASE_URL \
    --mount=type=secret,id=PAYLOAD_SECRET \
    --mount=type=secret,id=S3_ACCESS_KEY_ID \
    --mount=type=secret,id=S3_SECRET_ACCESS_KEY \
    export DATABASE_URL="$(cat /run/secrets/DATABASE_URL 2>/dev/null || echo "$DATABASE_URL")" \
      PAYLOAD_SECRET="$(cat /run/secrets/PAYLOAD_SECRET 2>/dev/null || echo "$PAYLOAD_SECRET")" \
      S3_ACCESS_KEY_ID="$(cat /run/secrets/S3_ACCESS_KEY_ID 2>/dev/null || echo "$S3_ACCESS_KEY_ID")" \
      S3_SECRET_ACCESS_KEY="$(cat /run/secrets/S3_SECRET_ACCESS_KEY 2>/dev/null || echo "$S3_SECRET_ACCESS_KEY")" \
    && if [ -z "$DATABASE_URL" ] || [ -z "$PAYLOAD_SECRET" ]; then \
         echo "DATABASE_URL and PAYLOAD_SECRET must reach the build: BuildKit secrets or build args (docs/RUNBOOK.md, Deploy)" >&2; exit 1; \
       fi \
    && bash scripts/ci/migrate.sh \
    && pnpm exec tsx scripts/media-renditions.ts \
    && pnpm build

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
# The platform may set PORT (Render 10000, Koyeb 8000); server.js and the check follow it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health" || exit 1
CMD ["node", "server.js"]
