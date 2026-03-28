#!/bin/sh

# Show command hints in interactive shells (docker exec -it <container> sh).
if [ -z "$PS1" ]; then
  return 0 2>/dev/null || exit 0
fi

if [ "${BNDSTR_SHELL_NOTES_SHOWN:-}" = "1" ]; then
  return 0 2>/dev/null || exit 0
fi

export BNDSTR_SHELL_NOTES_SHOWN=1

cat <<'EOF'

bndstr container shell
---------------------
Useful commands:

- API health
  curl -fsS http://localhost:3001/health

- Session check
  curl -fsS http://localhost:3001/api/auth/get-session

- Run DB migrations (runtime-safe)
  node /app/packages/api/dist/db/migrate.js

- Seed demo data
  node /app/packages/api/dist/db/seed.js

- Check bundled migration files
  ls -la /app/packages/api/dist/db/migrations

EOF
