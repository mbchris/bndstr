# bndstr

Multi-tenant band management project with:
- Hono API service in `packages/api`
- Quasar web/mobile client in `packages/web` (with Capacitor support)

## Prerequisites

- Node.js 20+
- pnpm (recommended via `corepack enable`)

## Local Development

```bash
# install dependencies
pnpm install

# copy env templates
cp .env.api.template .env.api
cp .env.web.template .env.web

# run API + Web in parallel
pnpm dev
```

Default local ports:
- API: `http://localhost:3001`
- Web (Quasar dev server): `http://localhost:9000`

## Useful Scripts

```bash
pnpm dev          # run all workspace dev scripts
pnpm dev:api      # API only
pnpm dev:web      # Web only
pnpm build        # build all packages
pnpm typecheck    # typecheck all packages
pnpm lint         # lint all packages
```

Database helpers:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

## Docker

Docker compose files are available for containerized workflows:
- `docker-compose.dev.yml`: local PostgreSQL
- `docker-compose.yml`: unified API + Quasar web deployment profiles

## Verify Remote Containers (curl)

Use these checks against your deployed domain to confirm the web and API containers are up:

```bash
DOMAIN="http://localhost:3001"
#DOMAIN="https://bndstr.trmusic.de"


# 1) API container health (should return {"ok":true,...})
curl -fsS "$DOMAIN/health"

# 2) API routing through web/nginx (should return JSON, e.g. {"session":null})
curl -fsS "$DOMAIN/api/auth/get-session"

# 3) Web container serving SPA (should start with <!DOCTYPE html>)
curl -fsS "$DOMAIN" | head -n 5
```

Optional: print HTTP status only for quick checks:

```bash
curl -o /dev/null -s -w "health: %{http_code}\n" "$DOMAIN/health"
curl -o /dev/null -s -w "api: %{http_code}\n" "$DOMAIN/api/auth/get-session"
curl -o /dev/null -s -w "web: %{http_code}\n" "$DOMAIN/"
```

## Repository Structure

```text
packages/api/      Hono API + Drizzle
packages/web/      Quasar SPA + Capacitor targets
packages/shared/   Shared types/utilities
docs/              Feature plan and backlog
scripts/           Setup and automation scripts
```

## Documentation

- Contributor conventions: [AGENTS.md](AGENTS.md)
- Machine-readable project context: [AI_CONTEXT.md](AI_CONTEXT.md)
- Iteration roadmap: [docs/feature_plan.md](docs/feature_plan.md)
- Production deployment + troubleshooting: [docs/coolify-deployment.md](docs/coolify-deployment.md)

## License

All rights reserved.
