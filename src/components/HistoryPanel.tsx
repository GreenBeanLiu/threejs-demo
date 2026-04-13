import { useCallback, useEffect, useState } from 'react'

export interface UploadRecord {
  id: string
  name: string
  size: number
  uploadedAt: string
  path: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function timeAgo(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface HistoryPanelProps {
  onSelect: (url: string, name: string, isProcessing?: boolean) => void
  refreshKey?: number
  selectedPath?: string | null
  signedIn?: boolean
}

export default function HistoryPanel({
  onSelect,
  refreshKey = 0,
  selectedPath = null,
  signedIn = false,
}: HistoryPanelProps) {
  const [records, setRecords] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadHistory = useCallback(() => {
    setLoading(true)
    setErrorMessage('')

    fetch('/api/history')
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as
          | UploadRecord[]
          | { error?: string }
          | null

        if (!response.ok) {
          if (response.status === 401) {
            setRecords([])
            setLoading(false)
            return
          }

          throw new Error(
            data && !Array.isArray(data) && data.error
              ? data.error
              : `Failed to load history (${response.status})`,
          )
        }

        setRecords(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((error) => {
        setLoading(false)
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load history')
      })
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory, refreshKey])

  if (loading) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3 text-sm text-[var(--sea-ink-soft)]">
        Loading recent models…
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <div className="flex items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={loadHistory}
            className="rounded-full border border-amber-300 px-3 py-1 text-xs font-medium transition hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (records.length === 0) {
    if (!signedIn) {
      return (
        <div className="w-full max-w-xl rounded-2xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-4 text-sm text-[var(--sea-ink-soft)]">
          <p className="font-medium text-[var(--sea-ink)]">Sign in to keep upload history</p>
          <p className="mt-1 leading-6">
            You can preview models immediately, but signing in lets you keep a reusable list of recent uploads.
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href="/login"
              className="rounded-full border border-[var(--chip-line)] bg-[var(--header-bg)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:border-[#56c6be] hover:text-[var(--sea-ink)]"
            >
              Sign in
            </a>
            <a
              href="/register"
              className="rounded-full bg-[linear-gradient(135deg,#56c6be,#2d9d8f)] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:opacity-95"
            >
              Create account
            </a>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full max-w-xl rounded-2xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-4 text-sm text-[var(--sea-ink-soft)]">
        No recent models yet. Your latest uploads will appear here for quick re-opening.
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--sea-ink-soft)]">
          Recent Models
        </p>
        <button
          type="button"
          onClick={loadHistory}
          className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:border-[#56c6be] hover:text-[var(--sea-ink)]"
        >
          Refresh
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {records.map((record) => {
          const isActive = selectedPath === record.path

          return (
          <button
            key={record.id}
            onClick={() => onSelect(record.path, record.name)}
            className={`island-shell flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:-translate-y-0.5 hover:ring-1 hover:ring-[#56c6be] ${
              isActive ? 'ring-1 ring-[#56c6be] bg-[rgba(79,184,178,0.08)] shadow-[0_16px_40px_rgba(45,157,143,0.12)]' : ''
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-[#56c6be]">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-[var(--sea-ink)]">{record.name}</p>
                <span className="shrink-0 rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--sea-ink-soft)]">
                  {formatSize(record.size)}
                </span>
              </div>
              <p className="text-xs text-[var(--sea-ink-soft)]">
                Updated {timeAgo(record.uploadedAt)}
              </p>
              {isActive ? (
                <p className="mt-1 text-[11px] font-medium text-[#2d9d8f]">Currently open</p>
              ) : null}
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-[var(--sea-ink-soft)]">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          )
        })}
      </div>
    </div>
  )
}
