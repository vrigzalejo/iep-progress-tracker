# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src/lib/database-url.ts ./src/lib/database-url.ts
RUN find prisma/migrations -mindepth 1 -type d -empty -delete \
  && npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_SECRET=build-placeholder
ENV DATABASE_URL=postgresql://iep:iep@127.0.0.1:5432/iep
ARG NEXT_PUBLIC_APP_NAME="IEP Progress Tracker"
ARG NEXT_PUBLIC_APP_SLUG="iep-progress-tracker"
ARG NEXT_PUBLIC_DEMO_MODE="true"
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_SLUG=$NEXT_PUBLIC_APP_SLUG
ENV NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN find prisma/migrations -mindepth 1 -type d -empty -delete \
  && npx prisma generate && npm run build \
  && node scripts/copy-runtime-modules.mjs

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=43147
ENV HOSTNAME=0.0.0.0
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates util-linux \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/data/uploads \
  && chown -R nextjs:nodejs /app

COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=build --chown=nextjs:nodejs /app/src/lib/database-url.ts ./src/lib/database-url.ts
COPY --from=build --chown=nextjs:nodejs /opt/runtime-modules/ ./node_modules/
COPY --from=build --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 43147
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:43147/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
