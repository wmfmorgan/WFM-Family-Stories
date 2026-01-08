import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './index'
import { join } from 'path'

async function runMigrations() {
  try {
    console.log('Running database migrations...')

    await migrate(db, {
      migrationsFolder: join(process.cwd(), 'src/lib/db/migrations'),
    })

    console.log('Migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()