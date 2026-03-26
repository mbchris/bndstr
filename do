#!/usr/bin/env bash

# The 'do' script for bndstr
# Used for starting the application locally or deploying it.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

command="$1"

# Default to local if no environment is provided
env_profile="${2:-local}"

# Validate environment
if [[ "$env_profile" != "local" && "$env_profile" != "staging" && "$env_profile" != "production" ]]; then
  echo "Error: Invalid environment '$env_profile'. Valid options: local, staging, production"
  exit 1
fi

env_file=".env.$env_profile"

# Fallback to standard .env if the specific profile file doesn't exist
if [ ! -f "$env_file" ]; then
  if [ -f ".env" ]; then
    echo "Warning: $env_file not found. Falling back to .env"
    env_file=".env"
  else
    echo "Error: Neither $env_file nor .env found! Please copy .env.template and configure it."
    exit 1
  fi
fi

# Ensure the proxy network exists (required for Traefik profiles used in build/deploy/prod)
if [[ "$command" == "build" || "$command" == "deploy" || "$command" == "prod" || "$env_profile" == "staging" || "$env_profile" == "production" ]]; then
  proxy_net="${DOCKER_NETWORK:-coolify}"
  docker network inspect "$proxy_net" >/dev/null 2>&1 || {
    echo "Creating '$proxy_net' network for Traefik compatibility..."
    docker network create "$proxy_net"
  }
fi

echo "Using environment configuration: $env_file"
export ENV_FILE="$env_file"

case "$command" in
  start|dev|run)
    echo "Starting development server ($env_profile)..."
    if [ "$env_profile" == "local" ]; then
      echo "Ensuring local PostgreSQL is running (docker-compose.dev.yml)..."
      docker compose -f docker-compose.dev.yml up -d postgres
      if ! ls packages/api/src/db/migrations/*.sql >/dev/null 2>&1; then
        echo "No migration files found. Generating initial migration..."
        docker compose --profile dev run --rm dev sh -c "corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm --filter @bndstr/api run db:generate"
      fi
      echo "Running local database migrations..."
      docker compose --profile dev run --rm dev sh -c "corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm --filter @bndstr/api run db:migrate"
    fi
    docker compose --profile dev up
    ;;
  build)
    echo "Building production-grade image ($env_profile)..."
    if [ "$env_profile" == "staging" ]; then
      docker compose --profile staging build
    else
      docker compose --profile prod build
    fi
    ;;
  deploy|prod)
    echo "Starting production server ($env_profile)..."
    if [ "$env_profile" == "staging" ]; then
      docker compose --profile staging up -d
    else
      docker compose --profile prod up -d
    fi
    ;;
  logs)
    echo "Viewing logs..."
    docker compose logs -f
    ;;
  stop)
    echo "Stopping containers..."
    docker compose down
    ;;
  test)
    echo "Running tests..."
    npm run test
    ;;
  seed)
    echo "Seeding database ($env_profile)..."
    # Run the seed script inside the dev container to ensure binary compatibility (Alpine)
    docker compose --profile dev run --rm dev npx -y tsx scripts/seed.ts
    ;;
  *)
    echo "Usage: ./do {start|dev|run|build|deploy|logs|stop|test|seed} [local|staging|production]"
    exit 1
    ;;
esac
