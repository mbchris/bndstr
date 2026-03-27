import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from './index.js'

async function runMigrations() {
  const started = Date.now()
  try {
    await migrate(db, { migrationsFolder: new URL('./migrations', import.meta.url).pathname })
    const ms = Date.now() - started
    console.log(`DB migrations applied in ${ms}ms`)
  } catch (error) {
    console.error('DB migration failed', error)
    process.exitCode = 1
  } finally {
    await pool.end().catch(() => undefined)
  }
}

void runMigrations()
