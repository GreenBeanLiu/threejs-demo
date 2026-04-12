import { signOut, useSession } from '../lib/auth-client'
import { useEffect, useState } from 'react'
import {
  isSupportedModelFile,
  MAX_UPLOAD_BYTES,
  revokeObjectUrl,
  uploadModelFile,
} from '../lib/uploads'

interface HeaderProps {
  fileName?: string | null
  onUpload?: (url: string, name: string, isProcessing?: boolean) => void
  hasModel?: boolean
  onProcessing?: (isProcessing: boolean) => void
  onUploadComplete?: () => void
}

export default function Header({
  fileName,
  onUpload,
  hasModel,
  onProcessing,
  onUploadComplete,
}: HeaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sessionResult = mounted && typeof useSession === 'function' ? useSession() : null
  const session = sessionResult?.data

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file || !onUpload) return

    if (!isSupportedModelFile(file) || file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return
    }

    onProcessing?.(true)

    const localUrl = URL.createObjectURL(file)
    onUpload(localUrl, file.name, true)

    const uploadResult = await uploadModelFile(file)

    if ('error' in uploadResult) {
      revokeObjectUrl(localUrl)
    } else {
      onUpload(uploadResult.path, file.name, false)
      revokeObjectUrl(localUrl)
      onUploadComplete?.()
    }

    onProcessing?.(false)
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-5 backdrop-blur-lg">
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#56c6be,#2d9d8f)] shadow-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-[var(--sea-ink)]">PackView</span>
            {fileName && (
              <span className="ml-2 hidden text-xs text-[var(--sea-ink-soft)] sm:inline">
                {fileName.length > 32 ? fileName.slice(0, 32) + '…' : fileName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasModel && onUpload && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:border-[#56c6be] hover:text-[var(--sea-ink)]">
              <input type="file" accept=".glb,.gltf" className="sr-only" onChange={handleChange} />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload model
            </label>
          )}
          {session?.user && (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-[var(--sea-ink-soft)] sm:inline">{session.user.name || session.user.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:border-red-400 hover:text-red-400"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
