# ---------------------------------------------------------------------------
# gn33-shop-spa production image. Built once, configured at runtime, served non-root.
# Built and published by .github/workflows/release.yml. There is no deploy repo for the shop yet, so
# nothing in version control describes how this image is run in production.
#
# Serves via a plain Node process rather than nginx: since the TanStack Start migration, the build
# produces a Web-standard `fetch` handler (`dist/server/server.js`) that has to actually render
# pages, which a static file server cannot do. `server.mjs` is the adapter - see its own comments
# for what it replaces from the pre-migration nginx setup (runtime config generation, security
# headers).
# ---------------------------------------------------------------------------

# Stage 1: build the client + server bundles.
FROM node:24-alpine AS build
# Honours the `packageManager: pnpm@11.x` pin in package.json. Without corepack a bare `pnpm` picks up
# whatever version is on PATH, which is the same store-mismatch trap documented in CLAUDE.md for local
# development.
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# `pnpm build` is `vite build && tsc`, so a type error fails the image build. That is deliberate.
RUN pnpm build

# Stage 2: production-only node_modules. The server bundle isn't fully self-contained (it still
# imports react, @tanstack/react-router and srvx as bare specifiers), so the runtime image needs
# real node_modules - but a plain copy from the build stage would carry every devDependency
# (vite, vitest, eslint...) into the running container for nothing.
FROM node:24-alpine AS prod-deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 3: serve. Named so the release workflow can build this stage with the cache disabled - the
# `apk upgrade` below only means anything if it actually re-runs (see release.yml).
FROM node:24-alpine AS runtime
# apk upgrade for OS-package CVEs, same reasoning as gn33-shop-app's Dockerfile. npm/npx/corepack are
# removed rather than upgraded: this stage only ever runs `node server.mjs` (see CMD below), never `npm`
# or `pnpm`, but the base image still ships npm's own bundled node_modules regardless - a full copy of the
# npm CLI's dependency tree (tar, undici, ip-address and more) that Trivy scans and flags CVEs in even
# though nothing in this image ever executes it. Deleting it is more durable than chasing each CVE
# individually, since the next one in npm's own tree would just reintroduce the same failed scan.
RUN apk --no-cache upgrade && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack && \
    addgroup -g 10001 gn33 && adduser -D -u 10001 -G gn33 gn33
WORKDIR /app
COPY --from=prod-deps --chown=10001:0 /app/node_modules ./node_modules
COPY --from=build --chown=10001:0 /app/dist ./dist
COPY --chown=10001:0 package.json server.mjs ./
USER gn33:gn33

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["node", "server.mjs"]
