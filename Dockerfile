# ── Stage 1: Build ────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies required for node-gyp (better-sqlite3) and git
RUN apk update && apk add --no-cache python3 make g++ gcc libgcc libstdc++ git
ENV PYTHON=/usr/bin/python3

# Install Node dependencies
COPY package.json package-lock.json* ./
# We pass --ignore-scripts first to prevent node-gyp from hanging during the tree fetch, 
# then we rebuild the binaries specifically. Notice npm ci instead of install.
RUN NODE_ENV=development npm ci --legacy-peer-deps

# Copy source and build
COPY . .

# NUXT_APP_BASE_URL and NUXT_AUTH_ORIGIN must be available at build time 
# because nuxt.config.ts and auth module "bake" them in.
ARG NUXT_APP_BASE_URL=/
ARG NUXT_AUTH_ORIGIN=https://bndstr.trmusic.de
ARG bndstr_GIT_REV
ENV NUXT_APP_BASE_URL=${NUXT_APP_BASE_URL}
ENV NUXT_AUTH_ORIGIN=${NUXT_AUTH_ORIGIN}
# Use bndstr_GIT_REV if provided, otherwise fallback to git rev-parse if .git exists
RUN if [ -n "$bndstr_GIT_REV" ]; then \
      CID=$bndstr_GIT_REV; \
    elif [ -d ".git" ]; then \
      CID=$(git rev-parse --short HEAD); \
    else \
      CID="unknown"; \
    fi && \
    echo "=====================================" && \
    echo "BUILD-VERSION: $CID" && \
    echo "=====================================" && \
    export NUXT_PUBLIC_COMMIT_ID="$CID" && \
    echo "NUXT_PUBLIC_COMMIT_ID=$CID" > /app/.env.build && \
    npm run build

# ── Stage 2: Production ──────────────────────────
FROM node:20-alpine AS production

# better-sqlite3 needs native C++ runtime libs
RUN apk add --no-cache libstdc++

WORKDIR /app

# Copy the built output
COPY --from=build /app/.output .output/

# Copy better-sqlite3 native module (externalized from Nitro bundle)
COPY --from=build /app/node_modules/better-sqlite3 node_modules/better-sqlite3/
COPY --from=build /app/node_modules/bindings node_modules/bindings/
COPY --from=build /app/node_modules/file-uri-to-path node_modules/file-uri-to-path/
COPY --from=build /app/node_modules/prebuild-install node_modules/prebuild-install/

# Copy .env.build to root as .env so Nitro can read public variables at runtime
COPY --from=build /app/.env.build .env

# Runtime configuration
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
