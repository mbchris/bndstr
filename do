#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

command="${1:-}"
env_profile="${2:-local}"

if [[ -z "$command" ]]; then
  echo "Usage: ./do {start|dev|run|logs|stop|seed|install|build|build-apk} [local]"
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
  echo "Running local database migrations..."
  "${APP_COMPOSE[@]}" run --rm dev sh -c "$COREPACK_NONINTERACTIVE corepack enable && pnpm install && pnpm --filter @bndstr/api exec tsx src/db/migrate.ts"
}

build_android_apk() {
  local apk_path="packages/web/src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk"
  local android_local_props="packages/web/src-capacitor/android/local.properties"
  local sdk_path="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"

  if [[ -z "$sdk_path" && -d "/c/Users/Chris/AppData/Local/Android/Sdk" ]]; then
    sdk_path="/c/Users/Chris/AppData/Local/Android/Sdk"
  fi

  if [[ -n "$sdk_path" ]]; then
    mkdir -p "$(dirname "$android_local_props")"
    local sdk_win
    sdk_win="$(printf '%s' "$sdk_path" | sed 's#^/c/#C:/#; s#/#\\\\#g')"
    printf 'sdk.dir=%s\n' "$sdk_win" > "$android_local_props"
  fi

  if [[ -z "${JAVA_HOME:-}" && -d "/c/Program Files/Android/Android Studio/jbr" ]]; then
    export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
  fi

  if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
    export PATH="$JAVA_HOME/bin:$PATH"
  fi

  echo "Building Android APK (debug)..."
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1
  corepack pnpm --filter @bndstr/web run build:android

  local release_apk="packages/web/src-capacitor/android/app/build/outputs/apk/release/app-release.apk"
  local release_unsigned_apk="packages/web/src-capacitor/android/app/build/outputs/apk/release/app-release-unsigned.apk"

  if [[ -f "$release_apk" ]]; then
    echo "APK built successfully: $release_apk"
  elif [[ -f "$release_unsigned_apk" ]]; then
    echo "APK built successfully: $release_unsigned_apk"
  elif [[ -f "$apk_path" ]]; then
    echo "APK built successfully: $apk_path"
  else
    echo "Error: APK build finished but file not found at: $release_apk, $release_unsigned_apk (or $apk_path)"
    exit 1
  fi
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
  build-apk)
    build_android_apk
    ;;
  *)
    echo "Usage: ./do {start|dev|run|logs|stop|seed|install|build|build-apk} [local]"
    exit 1
    ;;
esac
