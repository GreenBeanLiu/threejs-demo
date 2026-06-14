import postgres, { type Sql } from 'postgres'

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim()

  if (!value) {
    throw new Error('DATABASE_URL is not configured')
  }

  return value
}

let _db: Sql | null = null
let _migrationPromise: Promise<void> | null = null

function createDb() {
  const url = getDatabaseUrl()
  console.log('>>> Initializing PostgreSQL client')

  return postgres(url, {
    max: 1,
    prepare: false,
    ssl: url.includes('localhost') || url.includes('127.0.0.1') ? undefined : 'require',
  })
}

function normalizeSql(sql: string) {
  let index = 0
  return sql.replace(/\?/g, () => `$${++index}`)
}

function ensureMigrated() {
  if (!_db) {
    _db = createDb()
  }

  if (!_migrationPromise) {
    _migrationPromise = migrate(_db).catch((err) => {
      console.error('>>> Migration failed:', err)
      throw err
    })
  }

  return _migrationPromise
}

export interface ExecuteResult<T = Record<string, unknown>> {
  rows: T[]
}

export interface DbClient {
  execute<T = Record<string, unknown>>(input: { sql: string; args?: unknown[] }): Promise<ExecuteResult<T>>
  sql: Sql
}

export function getDb(): DbClient {
  ensureMigrated()

  return {
    sql: _db!,
    async execute<T = Record<string, unknown>>({ sql, args = [] }: { sql: string; args?: unknown[] }) {
      const rows = await _db!.unsafe<T[]>(normalizeSql(sql), args)
      return { rows }
    },
  }
}

export function getAuthDb(): Sql {
  ensureMigrated()
  return _db!
}

async function migrate(db: Sql) {
  try {
    await db.unsafe(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL,
        image TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMPTZ NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
      CREATE INDEX IF NOT EXISTS idx_session_userid ON session("userId");

      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMPTZ,
        "refreshTokenExpiresAt" TIMESTAMPTZ,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_account_userid ON account("userId");

      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
    `)
    console.log('>>> Auth tables migrated')
  } catch (err) {
    console.error('>>> Auth migration failed:', err)
  }

  try {
    await db.unsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'models' AND column_name = 'userId'
        ) THEN
          ALTER TABLE models RENAME COLUMN "userId" TO user_id;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        size BIGINT NOT NULL,
        r2_key TEXT NOT NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_models_user ON models(user_id, uploaded_at DESC);
    `)
    console.log('>>> Models table migrated')
  } catch (err) {
    console.error('>>> Models migration failed:', err)
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
