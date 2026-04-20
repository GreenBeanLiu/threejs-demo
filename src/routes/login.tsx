import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { signIn } from '../lib/auth-client'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn.email({ email, password })
    setLoading(false)
    if (res.error) { setError(res.error.message || 'Login failed'); return }
    router.navigate({ to: '/' })
  }

  async function handleSocial(provider: 'google' | 'github') {
    setError('')
    setSocialLoading(provider)

    try {
      const res = await signIn.social({ provider, callbackURL: '/' })
      if (res?.error) {
        const message = res.error.message || `${provider} sign-in failed.`
        setError(
          /too many requests|429/i.test(message)
            ? `${provider === 'google' ? 'Google' : 'GitHub'} sign-in is temporarily unavailable. Please try email sign-in or try again later.`
            : message,
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `${provider} sign-in failed.`
      setError(
        /too many requests|429/i.test(message)
          ? `${provider === 'google' ? 'Google' : 'GitHub'} sign-in is temporarily unavailable. Please try email sign-in or try again later.`
          : message,
      )
    } finally {
      setSocialLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="island-shell w-full max-w-sm rounded-2xl p-8">
        <div className="mb-8 text-center">
          <p className="text-2xl">📦</p>
          <h1 className="mt-2 text-xl font-bold text-[var(--sea-ink)]">Sign in to PackView</h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">3D Packaging Viewer</p>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => handleSocial('google')} disabled={!!socialLoading} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-sm font-medium text-[var(--sea-ink)] transition hover:border-[#56c6be] disabled:cursor-not-allowed disabled:opacity-60">
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {socialLoading === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
          </button>
          <button onClick={() => handleSocial('github')} disabled={!!socialLoading} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-sm font-medium text-[var(--sea-ink)] transition hover:border-[#56c6be] disabled:cursor-not-allowed disabled:opacity-60">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
            {socialLoading === 'github' ? 'Connecting to GitHub…' : 'Continue with GitHub'}
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--line)]" />
          <span className="text-xs text-[var(--sea-ink-soft)]">or</span>
          <div className="h-px flex-1 bg-[var(--line)]" />
        </div>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
          <input
            type="email" placeholder="Email" required
            value={email} onChange={e => setEmail(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[#56c6be]"
          />
          <input
            type="password" placeholder="Password" required
            value={password} onChange={e => setPassword(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[#56c6be]"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="rounded-xl bg-[#56c6be] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#45b5ad] disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--sea-ink-soft)]">
          No account?{' '}
          <Link to="/register" className="text-[#56c6be] hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
