import { useEffect, useState } from 'react'

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
  onSelect: (url: string, name: string) => void
}

export default function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [records, setRecords] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then((data: UploadRecord[]) => { setRecords(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null
  if (records.length === 0) return null

  return (
    <div className="w-full max-w-xl">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-[var(--sea-ink-soft)]">
        Recent Models
      </p>
      <div className="flex flex-col gap-1.5">
        {records.map(r => (
          <button
            key={r.id}
            onClick={() => onSelect(r.path, r.name)}
            className="island-shell flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition hover:ring-1 hover:ring-[#56c6be]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-[#56c6be]">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--sea-ink)]">{r.name}</p>
              <p className="text-xs text-[var(--sea-ink-soft)]">{formatSize(r.size)} · {timeAgo(r.uploadedAt)}</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-[var(--sea-ink-soft)]">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
