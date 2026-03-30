import { betterAuth } from 'better-auth'
import Database from 'better-sqlite3'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

// Ensure /uploads dir exists (Railway Volume mount)
const DB_DIR = existsSync('/uploads') ? '/uploads' : '/tmp'
const DB_PATH = `${DB_DIR}/packview.db`

const db = new Database(DB_PATH)
// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

export const auth = betterAuth({
  database: {
    type: 'sqlite',
    db,
  },
  secret: process.env.BETTER_AUTH_SECRET || 'packview-dev-secret-change-in-prod',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
  },
  trustedOrigins: [
    'https://web-production-ac0c6.up.railway.app',
    'http://localhost:3000',
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
