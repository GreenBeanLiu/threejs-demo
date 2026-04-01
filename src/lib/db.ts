import { createClient, type Client } from '@libsql/client'
import { existsSync } from 'node:fs'

const getDbPath = () => {
  // 1. Check for Railway volume
  if (existsSync('/uploads')) return 'file:/uploads/packview.db'
  // 2. Production fallback to /tmp
  if (process.env.NODE_ENV === 'production') return 'file:/tmp/packview.db'
  // 3. Local development
  return 'file:packview.db'
}

let _db: Client | null = null

export function getDb(): Client {
  if (_db) return _db

  const url = getDbPath()
  console.log(`>>> Initializing LibSQL client at: ${url}`)

  _db = createClient({ url })

  // Run migrations in background
  migrate(_db).catch(err => {
    console.error('>>> Migration failed:', err)
  })

  return _db
}

async function migrate(db: Client) {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS models (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      name        TEXT NOT NULL,
      size        INTEGER NOT NULL,
      r2_key      TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_models_user ON models(user_id, uploaded_at DESC);
  `)
  console.log('>>> Database migrations completed')
}

export interface ModelRecord {
  id: string
  user_id: string
  name: string
  size: number
  r2_key: string
  uploaded_at: string
}
