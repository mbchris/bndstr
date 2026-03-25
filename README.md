# bndstr

> Official website for the **bndstr** band — built with Nuxt 3, deployed with Docker.

## Quick Start

```bash
# 1. Copy environment template
cp .env.template .env
# Edit .env with your values

# 2. Run in development mode (hot-reload)
docker compose --profile dev up

# 3. Run in production mode
docker compose --profile prod up --build
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
pages/           → Auto-routed pages (Home, Events, Music, About, Contact)
components/      → Reusable Vue components
layouts/         → Layout wrappers
composables/     → Auto-imported composables
server/api/      → Server API routes (Nitro)
assets/css/      → Global styles & design tokens
public/          → Static assets
docs/            → Feature plan & backlog
scripts/         → Automation scripts
```

## Development

See [AGENTS.md](AGENTS.md) for coding conventions and [AI_CONTEXT.md](AI_CONTEXT.md) for project context.

## Feature Roadmap

See [docs/feature_plan.md](docs/feature_plan.md) for the iteration-structured roadmap, synced to the [Iterative Development](https://github.com/users/mbchris/projects/3) project board.

## License

All rights reserved.
