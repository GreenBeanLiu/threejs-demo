import { createClient, type Client } from '@libsql/client'
import { existsSync } from 'node:fs'

const DB_DIR = existsSync('/uploads') ? '/uploads' : '/tmp'
const DB_PATH = `file:${DB_DIR}/packview.db` // LibSQL requires 'file:' prefix for local paths

// Singleton — reuse the same connection across the process
let _db: Client | null = null

export function getDb(): Client {
  if (_db) return _db
  _db = createClient({
    url: DB_PATH,
  })
  // Initialize migrations (one-time setup for the process if needed)
  migrate(_db).catch(err => console.error('Migration failed:', err))
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
}

export interface ModelRecord {
  id: string
  user_id: string
  name: string
  size: number
  r2_key: string
  uploaded_at: string
}
