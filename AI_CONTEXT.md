# AI_CONTEXT.md — Machine-Readable Project Context

## Project

- **Name:** bndstr
- **Type:** Multi-tenant band management SaaS
- **Architecture:** pnpm monorepo
- **Web Client:** Quasar + Vue 3 + TypeScript (`packages/web`)
- **API Service:** Hono + TypeScript (`packages/api`)
- **Shared Package:** `@bndstr/shared`
- **Legacy/Parallel App Surface:** Nuxt 3 root app (`pages/`, `server/api/`)
- **Repo:** `github.com/mbchris/bndstr`
- **Board:** [Iterative Development](https://github.com/users/mbchris/projects/3)

## Root Nuxt Routes

| Route | File | Status |
|---|---|---|
| `/` | `pages/index.vue` | active |
| `/admin` | `pages/admin.vue` | active |
| `/calendar` | `pages/calendar.vue` | active |
| `/login` | `pages/login.vue` | active |
| `/setlist` | `pages/setlist.vue` | active |
| `/stand` | `pages/stand.vue` | active |
| `/voting` | `pages/voting.vue` | active |

## Workspace Scripts (root `package.json`)

| Script | Purpose |
|---|---|
| `pnpm dev` | Start workspace dev servers in parallel |
| `pnpm dev:api` | Start `@bndstr/api` only |
| `pnpm dev:web` | Start `@bndstr/web` only |
| `pnpm build` | Build all workspace packages |
| `pnpm typecheck` | Type-check all workspace packages |
| `pnpm lint` | Lint all workspace packages |
| `pnpm db:generate` | Generate DB migration artifacts |
| `pnpm db:migrate` | Apply DB migrations |
| `pnpm db:seed` | Seed development database |
| `pnpm db:studio` | Open Drizzle Studio |

## Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `NODE_ENV` | API | Runtime mode |
| `PORT` | API | API port (default `3001`) |
| `API_URL` | API/Web | Public API base URL |
| `DATABASE_URL` | API | PostgreSQL connection string |
| `AUTH_SECRET` | API/Nuxt | Better Auth / auth secret |
| `CORS_ORIGINS` | API | Comma-separated allowed origins |
| `GOOGLE_CLIENT_ID` | API/Nuxt | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | API/Nuxt | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | API/Nuxt | GitHub OAuth client id |
| `GITHUB_CLIENT_SECRET` | API/Nuxt | GitHub OAuth client secret |
| `STRIPE_SECRET_KEY` | API | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | API | Stripe webhook signing secret |
| `STRIPE_PRICE_BAND` | API | Stripe price id (Band tier) |
| `STRIPE_PRICE_PRO` | API | Stripe price id (Pro tier) |
| `GIT_REV` | API | Build/version identifier |

## Backlog Format

Files in `docs/backlog/iter-*.md`:

```
<!-- iteration: Iteration N -->

## TASK-XXYY: Task title
- **Status:** todo | in progress | done
- **Labels:** label1, label2
- **Acceptance Criteria:**
  - [ ] Criterion 1
  - [ ] Criterion 2
- **File hints:** `path/to/file`
```

Cross-reference after sync: `<!-- gh:#42 -->` is injected before the `## TASK-` line.

## Sync Workflow

```
docs/backlog/  →  sync-backlog.sh  →  GitHub Issues  →  Projects Board
                  (--apply --project)   (auto-created)    (Iteration field)
```

The sync reads `GH_TOKEN`, `GH_REPO`, `GH_PROJECT_NUMBER`, `GH_PROJECT_OWNER` from `.env`.
