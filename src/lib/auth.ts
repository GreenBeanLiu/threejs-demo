import { betterAuth } from 'better-auth'
import { kyselyAdapter } from '@better-auth/kysely-adapter'
import { Kysely } from 'kysely'
import { PostgresJSDialect } from 'kysely-postgres-js'
import { getAuthDb } from './db'

const authDb = getAuthDb()
const kyselyDb = new Kysely({
  dialect: new PostgresJSDialect({
    postgres: authDb,
  }),
})

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  }
}

export const auth = betterAuth({
  database: kyselyAdapter(kyselyDb, {
    type: 'postgres',
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'packview-dev-secret-change-in-prod',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders,
  trustedOrigins: [
    'https://threejs-demo-production.up.railway.app',
    'http://localhost:3000',
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
