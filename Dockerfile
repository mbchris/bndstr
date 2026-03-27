# ── Stage 1: Build API + Web ─────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Enable Corepack (pnpm version comes from packageManager in package.json)
RUN corepack enable

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy package.json for each workspace package
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/

# Install all dependencies
RUN NODE_ENV=development pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY packages/ packages/

# Build API (tsc) and Web (quasar build) in parallel via pnpm
RUN pnpm run build

# ── Stage 2: API production dependencies ─────────
FROM node:22-alpine AS api-deps

WORKDIR /app

RUN corepack enable

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/api/package.json packages/api/
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY pnpm-lock.yaml* ./

RUN pnpm install --filter @bndstr/api --filter @bndstr/shared --prod --frozen-lockfile || pnpm install --filter @bndstr/api --filter @bndstr/shared --prod

# ── Stage 3: Production (nginx + node) ───────────
FROM nginx:1.27-alpine AS production

# Install Node.js for the API server
RUN apk add --no-cache nodejs

WORKDIR /app

# Nginx config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/bndstr.conf

# Copy built SPA
COPY --from=build /app/packages/web/dist/spa/ /usr/share/nginx/html/

# Copy API build + production deps
COPY --from=api-deps /app/node_modules/ node_modules/
COPY --from=api-deps /app/packages/ packages/
COPY --from=build /app/packages/api/dist/ packages/api/dist/
# Runtime migrations for drizzle migrator
COPY --from=build /app/packages/api/src/db/migrations/ packages/api/dist/db/migrations/

# For the unified container, nginx proxies to localhost instead of "api" hostname
RUN sed -i 's|http://api:3001|http://127.0.0.1:3001|g' /etc/nginx/conf.d/bndstr.conf

# Runtime config
ENV HOST=0.0.0.0
ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 80

# Run DB migrations, then start API and nginx
CMD sh -c "node /app/packages/api/dist/db/migrate.js && node /app/packages/api/dist/index.js & nginx -g 'daemon off;'"
