import { createAuthClient } from 'better-auth/react'

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api/auth` : 'http://localhost:3000/api/auth')

export const authClient = createAuthClient({
  baseURL,
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
