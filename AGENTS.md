# AGENTS.md — AI Coding Agent Conventions

> Guidelines for AI agents working on the **bndstr** Nuxt 3 web application.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3.16+ |
| UI | Vue 3 (Composition API, `<script setup>`) |
| Language | TypeScript (strict) |
| Styles | Vanilla CSS with custom properties (see `assets/css/main.css`) |
| Fonts | Inter (body), Outfit (display) via Google Fonts |
| Server | Nitro (built into Nuxt) |
| Deployment | Docker + docker-compose |
| Package manager | npm |

## Project Structure

```
├── app.vue                  # Root component
├── nuxt.config.ts           # Nuxt configuration
├── package.json
├── Dockerfile               # Multi-stage production build
├── docker-compose.yml       # Dev & prod profiles
├── .env.template            # Environment config template
│
├── pages/                   # Auto-routed pages
├── components/              # Reusable Vue components
├── layouts/                 # Layout wrappers
├── composables/             # Auto-imported composables
├── server/api/              # Server API routes
├── assets/css/              # Global styles
├── public/                  # Static assets
│
├── docs/
│   ├── feature_plan.md      # Iteration roadmap
│   └── backlog/             # Parseable task files per iteration
│       ├── iter-1-foundation.md
│       ├── iter-2-content.md
│       └── iter-3-interactivity.md
│
├── scripts/
│   └── sync-backlog.sh      # GitHub Issues & Projects sync
│
└── .github/workflows/
    └── sync-backlog.yml     # Auto-sync on push
```

## Coding Standards

1. **Composition API only** — use `<script setup lang="ts">` in all `.vue` files
2. **Auto-imports** — Nuxt auto-imports Vue APIs and composables; don't add explicit imports for `ref`, `computed`, `useHead`, etc.
3. **CSS custom properties** — use design tokens from `assets/css/main.css` (e.g. `var(--color-accent)`)
4. **Component naming** — PascalCase for components, kebab-case for HTML attributes
5. **Server routes** — use `server/api/` with Nitro conventions (`*.get.ts`, `*.post.ts`)

## Iteration Workflow

The command is "implement". Ask the user which iteration to be implemented and show the available ones.

1. **Read** the assigned task from `docs/backlog/iter-N-*.md`
2. **Implement** the feature, checking off acceptance criteria as you go
3. **Tick off** the feature in the backlog once it is implemented
4. **Commit** with message format: `feat(iter-N): description — closes #N`
5. The `closes #N` reference auto-closes the GitHub Issue

## Bugfix Workflow

When "bugfix" is requested, check the backlog in `docs/backlog/bugfixing.md` and fix the mentioned task-id, or show all ones not ticked off. Query the user to select the corresponding one.
Fixed bugs need to be ticked off.

## Running Locally

```bash
# Copy env template
cp .env.template .env

# Development (hot-reload via Docker)
docker compose --profile dev up

# Production
docker compose --profile prod up --build
```

## Environment

All credentials, API keys, and configuration live in `.env` (never committed).
See `.env.template` for the full list of variables.

## Excecution of external commands

Executing commands often get stuck. Try to excecute, but if nothing happens within 30 seconds, let the user execute the command manually. Make copy&pasteable scripts for this.
