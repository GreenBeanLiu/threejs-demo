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
let _migrationPromise: Promise<void> | null = null

function ensureMigrated() {
  if (!_db) {
    const url = getDbPath()
    console.log(`>>> Initializing LibSQL client at: ${url}`)
    _db = createClient({ url })
  }

  if (!_migrationPromise) {
    _migrationPromise = migrate(_db).catch(err => {
      console.error('>>> Migration failed:', err)
      throw err
    })
  }

  return _migrationPromise
}

export function getDb(): Client {
  ensureMigrated()
  return _db!
}

export function getAuthDb(): Client {
  ensureMigrated()
  return _db!
}

async function migrate(db: Client) {
  try {
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER NOT NULL,
        image TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        expiresAt TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
      CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);

      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        userId TEXT NOT NULL,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt TEXT,
        refreshTokenExpiresAt TEXT,
        scope TEXT,
        password TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);

      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);

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
  } catch (err) {
    console.error('>>> Migration execution failed:', err)
  }
}

export interface ModelRecord {
  id: string
  user_id: string
  name: string
  size: number
  r2_key: string
  uploaded_at: string
}
