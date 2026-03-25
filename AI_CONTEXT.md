# AI_CONTEXT.md — Machine-Readable Project Context

## Project

- **Name:** bndstr
- **Type:** Band website
- **Framework:** Nuxt 3 (Vue 3, TypeScript, Nitro)
- **Repo:** `github.com/mbchris/bndstr`
- **Board:** [Iterative Development](https://github.com/users/mbchris/projects/3)

## Pages

| Route | File | Status |
|---|---|---|
| `/` | `pages/index.vue` | scaffold |
| `/events` | `pages/events.vue` | planned (Iter 2) |
| `/music` | `pages/music.vue` | planned (Iter 2) |
| `/about` | `pages/about.vue` | planned (Iter 2) |
| `/contact` | `pages/contact.vue` | planned (Iter 3) |

## Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `NUXT_PUBLIC_SITE_URL` | public | Base URL of the site |
| `NUXT_PUBLIC_SITE_NAME` | public | Display name |
| `GH_TOKEN` | server/CI | GitHub personal access token |
| `GH_REPO` | server/CI | Repository (owner/repo) |
| `GH_PROJECT_NUMBER` | server/CI | GitHub Projects v2 number |
| `GH_PROJECT_OWNER` | server/CI | Project owner login |
| `NODE_ENV` | runtime | `development` or `production` |
| `HOST` | runtime | Server bind address |
| `PORT` | runtime | Server port |

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
