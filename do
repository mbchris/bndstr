#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

command="${1:-}"
env_profile="${2:-local}"

if [[ -z "$command" ]]; then
  echo "Usage: ./do {start|dev|run|logs|stop|seed|install|build} [local]"
  exit 1
fi

if [[ "$env_profile" != "local" ]]; then
  echo "Error: Only local mode is supported. Use: ./do <command> local"
  exit 1
fi

if [[ -f ".env.local" ]]; then
  env_file=".env.local"
elif [[ -f ".env" ]]; then
  echo "Warning: .env.local not found. Falling back to .env"
  env_file=".env"
else
  echo "Error: Neither .env.local nor .env found."
  exit 1
fi

echo "Using environment configuration: $env_file"
export ENV_FILE="$env_file"

DB_COMPOSE=(docker compose -f docker-compose.dev.yml)
APP_COMPOSE=(docker compose --profile dev)
PROD_COMPOSE=(docker compose --profile prod)
COREPACK_NONINTERACTIVE='export COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1;'

ensure_db() {
  echo "Ensuring local PostgreSQL is running (docker-compose.dev.yml)..."
  "${DB_COMPOSE[@]}" up -d postgres
}

ensure_migrations_file() {
  if ! ls packages/api/src/db/migrations/*.sql >/dev/null 2>&1; then
    echo "No migration files found. Generating initial migration..."
    "${APP_COMPOSE[@]}" run --rm dev sh -c "$COREPACK_NONINTERACTIVE corepack enable && pnpm install && pnpm --filter @bndstr/api run db:generate"
  fi
}

run_migrations_if_needed() {
  local has_tracking_table
  local app_table_count

  has_tracking_table=$("${DB_COMPOSE[@]}" exec -T postgres psql -U bndstr -d bndstr -tAc \
    "select case when to_regclass('public.__drizzle_migrations') is null then 0 else 1 end;")
  app_table_count=$("${DB_COMPOSE[@]}" exec -T postgres psql -U bndstr -d bndstr -tAc \
    "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name <> '__drizzle_migrations';")

  if [[ "$has_tracking_table" == "1" || "$app_table_count" == "0" ]]; then
    echo "Running local database migrations..."
    "${APP_COMPOSE[@]}" run --rm dev sh -c "$COREPACK_NONINTERACTIVE corepack enable && pnpm install && pnpm --filter @bndstr/api run db:migrate"
    return
  fi

  # Legacy local DB bootstrap: schema exists but Drizzle tracking table is missing.
  # Apply idempotent compatibility patches so current code can run without destructive reset.
  echo "Applying compatibility schema repairs for legacy local database..."
  "${DB_COMPOSE[@]}" exec -T postgres psql -U bndstr -d bndstr -v ON_ERROR_STOP=1 -c \
    "ALTER TABLE public.bands ADD COLUMN IF NOT EXISTS logo text;"

  echo "Skipping migrations: schema exists but Drizzle tracking table is missing."
  echo "Reason: running initial migration here would fail on already existing tables."
  echo "Applied non-destructive compatibility fixes (if needed)."
}

case "$command" in
  start|dev|run)
    echo "Starting development server (local)..."
    ensure_db
    ensure_migrations_file
    run_migrations_if_needed
    "${APP_COMPOSE[@]}" up
    ;;
  logs)
    echo "Viewing logs..."
    "${APP_COMPOSE[@]}" logs -f
    ;;
  stop)
    echo "Stopping containers..."
    "${APP_COMPOSE[@]}" down
    "${DB_COMPOSE[@]}" down
    ;;
  install)
    echo "Installing dependencies..."
    "${APP_COMPOSE[@]}" run --rm dev sh -c "$COREPACK_NONINTERACTIVE corepack enable && pnpm install"
    ;;
  seed)
    echo "Seeding local database..."
    ensure_db
    ensure_migrations_file
    run_migrations_if_needed
    "${APP_COMPOSE[@]}" run --rm dev sh -c "$COREPACK_NONINTERACTIVE corepack enable && pnpm install && pnpm --filter @bndstr/api run db:seed"
    ;;
  build)
    echo "Building production Docker image..."
    "${PROD_COMPOSE[@]}" build prod
    ;;
  *)
    echo "Usage: ./do {start|dev|run|logs|stop|seed|install|build} [local]"
    exit 1
    ;;
esac
