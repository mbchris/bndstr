import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './index.js'

function resolveSeedFilePath(): string {
  const fromCwd = resolve(process.cwd(), 'scripts', 'seed_example.sql')
  if (existsSync(fromCwd)) return fromCwd

  const currentDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
  const fromModule = resolve(currentDir, '../../../..', 'scripts', 'seed_example.sql')
  if (existsSync(fromModule)) return fromModule

  throw new Error('Could not find scripts/seed_example.sql')
}

async function main(): Promise<void> {
  const seedPath = resolveSeedFilePath()
  const sql = readFileSync(seedPath, 'utf8')

  if (!sql.trim()) {
    throw new Error(`Seed file is empty: ${seedPath}`)
  }

  console.log(`Running seed SQL from ${seedPath}`)
  await pool.query(sql)
  console.log('Database seeding complete.')
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
