import Database from 'better-sqlite3'
import { existsSync } from 'node:fs'

const DB_DIR = existsSync('/uploads') ? '/uploads' : '/tmp'
const DB_PATH = `${DB_DIR}/packview.db`

// Singleton — reuse the same connection across the process
let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  migrate(_db)
  return _db
}

function migrate(db: Database.Database) {
  db.exec(`
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
