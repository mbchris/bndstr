import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from './index.js'

export async function runMigrations(options: { closePoolOnDone?: boolean } = {}) {
  const { closePoolOnDone = false } = options
  const started = Date.now()
  try {
    await migrate(db, { migrationsFolder: new URL('./migrations', import.meta.url).pathname })
    const ms = Date.now() - started
    console.log(`DB migrations applied in ${ms}ms`)
  } catch (error) {
    console.error('DB migration failed', error)
    throw error
  } finally {
    if (closePoolOnDone) {
      await pool.end().catch(() => undefined)
    }
  }
}

// Keep standalone migration script behavior.
if ((process.argv[1] ?? '').includes('/db/migrate')) {
  void runMigrations({ closePoolOnDone: true }).catch(() => {
    process.exitCode = 1
  })
}
