-- db-init.sql — PostgreSQL initialization for bndstr
--
-- This script runs ONCE after creating a fresh database.
-- It sets up extensions and roles. Schema is managed by Drizzle migrations.
--
-- Usage (local dev):
--   docker exec -i bndstr-postgres psql -U bndstr -d bndstr < scripts/db-init.sql
--
-- Usage (Coolify VPS):
--   ssh root@vps "docker exec -i <pg-container> psql -U bndstr -d bndstr" < scripts/db-init.sql

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID generation (used by Better Auth)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Trigram index for fuzzy text search (song lookup)
CREATE EXTENSION IF NOT EXISTS "citext";       -- Case-insensitive text (email comparisons)

-- Connection limits (optional safety net)
ALTER DATABASE bndstr SET statement_timeout = '30s';
ALTER DATABASE bndstr SET idle_in_transaction_session_timeout = '60s';

-- Confirm
SELECT 'bndstr database initialized' AS status,
       current_database() AS database,
       current_user AS user,
       version() AS pg_version;
