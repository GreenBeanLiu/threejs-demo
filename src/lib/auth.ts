import { betterAuth } from 'better-auth'
import { getDb } from './db'

const db = getDb()

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
