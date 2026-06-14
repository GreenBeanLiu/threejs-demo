import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, type ChangeEvent, useCallback, useEffect, useState } from 'react'
import { useSession } from '../lib/auth-client'
import DropZone from '../components/DropZone'
import HistoryPanel from '../components/HistoryPanel'
import {
  isSupportedModelFile,
  MAX_UPLOAD_BYTES,
  revokeObjectUrl,
  uploadModelFile,
} from '../lib/uploads'
import type { ViewerSettings } from '../components/model-viewer/types'

const ViewerShell = lazy(() => import('../components/ViewerShell'))

export const Route = createFileRoute('/')({ component: ViewerPage })

const DEFAULT_SETTINGS: ViewerSettings = {
  environment: 'studio',
  autoRotate: true,
  autoRotateSpeed: 0.8,
  exposure: 1.2,
  background: '#0f0f14',
}

function LoadingOverlay({ message = 'Loading model…' }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[rgba(6,10,14,0.36)] backdrop-blur-[2px]">
      <div className="flex min-w-[260px] max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-[rgba(10,16,22,0.88)] p-6 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/12 border-t-[#56c6be]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#56c6be]" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{message}</p>
            <p className="mt-0.5 text-xs text-white/45">Viewer workspace is preparing the current asset.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StageNotice({
  tone,
  title,
  description,
  actions,
}: {
  tone: 'error' | 'success'
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  const styles =
    tone === 'error'
      ? 'border-red-400/25 bg-[rgba(67,14,18,0.88)] text-red-100'
      : 'border-emerald-400/20 bg-[rgba(7,52,40,0.82)] text-emerald-100'

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${styles}`}>
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 text-xs leading-5 opacity-80">{description}</p> : null}
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

function FloatingActionButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[rgba(10,16,22,0.84)] shadow-md backdrop-blur-sm transition hover:border-[#56c6be]/50 hover:bg-[rgba(17,27,35,0.96)]"
    >
      {children}
    </button>
  )
}

function ViewerPage() {
  const { data: session } = useSession()
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [viewerError, setViewerError] = useState('')
  const [screenshotMessage, setScreenshotMessage] = useState('')
  const [screenshotError, setScreenshotError] = useState('')

  useEffect(() => {
    if (!screenshotMessage && !screenshotError) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setScreenshotMessage('')
      setScreenshotError('')
    }, 2200)

    return () => window.clearTimeout(timeoutId)
  }, [screenshotMessage, screenshotError])

  const refreshHistory = useCallback(() => {
    setHistoryRefreshKey((value) => value + 1)
  }, [])

  const resetToLanding = useCallback(() => {
    setModelUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    setFileName(null)
    setViewerError('')
    setScreenshotMessage('')
    setScreenshotError('')
    setLoading(false)
    setProcessing(false)
  }, [])

  const handleFile = useCallback((url: string, name: string, isProcessing?: boolean) => {
    setModelUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return url
    })
    setFileName(name)
    setViewerError('')
    setScreenshotMessage('')
    setScreenshotError('')
    setLoading(true)
    if (isProcessing !== undefined) setProcessing(isProcessing)
  }, [])

  const patchSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((value) => ({ ...value, ...patch }))
  }, [])

  const handleScreenshot = useCallback(() => {
    setScreenshotMessage('')
    setScreenshotError('')

    const mv = document.querySelector('model-viewer') as (HTMLElement & { toBlob?: (opts?: object) => Promise<Blob> }) | null
    if (!mv?.toBlob) {
      setScreenshotError('Screenshot failed: viewer not ready.')
      return
    }

    mv.toBlob({ idealAspect: true }).then((blob: Blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = (fileName?.replace(/\.[^.]+$/, '') ?? 'model') + '-preview.png'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      setScreenshotMessage('Screenshot saved.')
    }).catch((error: unknown) => {
      setScreenshotError(error instanceof Error ? `Screenshot failed: ${error.message}` : 'Screenshot failed.')
    })
  }, [fileName])

  const handleToolbarUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''

      if (!file) {
        return
      }

      if (!isSupportedModelFile(file) || file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
        setScreenshotError('Only .glb and .gltf files up to 50MB are supported.')
        return
      }

      setProcessing(true)

      const localUrl = URL.createObjectURL(file)
      handleFile(localUrl, file.name, true)

      const uploadResult = await uploadModelFile(file)

      if ('error' in uploadResult) {
        revokeObjectUrl(localUrl)
        setScreenshotError(uploadResult.error)
      } else {
        handleFile(uploadResult.path, file.name, false)
        revokeObjectUrl(localUrl)
        refreshHistory()
      }

      setProcessing(false)
    },
    [handleFile, refreshHistory],
  )

  const loadingMessage = processing ? 'Uploading and saving model…' : 'Loading model…'

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {!modelUrl ? (
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <section className="flex flex-col gap-5">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-xs font-medium tracking-wide text-[var(--sea-ink-soft)]">
                  <span className="h-2 w-2 rounded-full bg-[#56c6be]" />
                  PackView · Packaging 3D Review
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
                  Review packaging models in your browser
                </h1>
                <p className="mt-1.5 text-sm leading-6 text-[var(--sea-ink-soft)]">
                  Drop a <span className="font-medium text-[var(--sea-ink)]">.glb</span> or <span className="font-medium text-[var(--sea-ink)]">.gltf</span> file to open it — up to 50 MB.
                </p>
              </div>

              <div className="relative rounded-[28px] border border-[var(--line)] bg-[var(--header-bg)] p-4 shadow-[0_24px_60px_rgba(11,22,28,0.12)] sm:p-6">
                <div className="relative h-72 w-full sm:h-80">
                  <DropZone
                    onFile={handleFile}
                    onProcessing={setProcessing}
                    onUploadComplete={refreshHistory}
                    signedIn={!!session?.user}
                    previewError={viewerError}
                  />
                  {loading && <LoadingOverlay message={loadingMessage} />}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Studio controls', 'Switch lighting presets, reset camera, and capture review screenshots.'],
                  ['Recent history', 'Jump back into recently uploaded models without re-uploading.'],
                  ['Instant load', 'View GLB / GLTF renders in seconds — no plugins required.'],
                ].map(([title, desc]) => (
                  <div key={title} className="island-shell rounded-2xl p-4">
                    <p className="mb-1 text-xs font-semibold text-[var(--sea-ink)]">{title}</p>
                    <p className="text-xs leading-5 text-[var(--sea-ink-soft)]">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="flex flex-col gap-4">
              <div className="island-shell rounded-[28px] p-5">
                <p className="text-sm font-semibold text-[var(--sea-ink)]">Recent uploads</p>
                <div className="mt-3">
                  <HistoryPanel
                    onSelect={handleFile}
                    refreshKey={historyRefreshKey}
                    selectedPath={modelUrl}
                    signedIn={!!session?.user}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-[#0a1116] text-white">
          <div className="border-b border-white/8 bg-[rgba(8,13,18,0.94)] px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={resetToLanding}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/72 transition hover:border-[#56c6be]/40 hover:text-white"
                >
                  Back
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {fileName ?? 'Current model'}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {processing ? 'Uploading…' : loading ? 'Loading model…' : viewerError ? 'Viewer needs attention' : 'Model ready for review'}
                  </p>
                </div>
              </div>

              <label className="hidden cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-[#56c6be]/40 hover:text-white sm:flex">
                <input type="file" accept=".glb,.gltf" className="sr-only" onChange={handleToolbarUpload} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Replace model
              </label>
            </div>
          </div>

          <div className="min-h-0 flex-1 p-3 sm:p-4">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-white/55">Loading viewer workspace…</div>}>
              <ViewerShell
                effectiveModelUrl={modelUrl}
                fileName={fileName}
                settings={settings}
                onViewerError={setViewerError}
                onSettingsChange={patchSettings}
                onCreated={() => setLoading(false)}
                stageOverlay={
                  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4">
                    <div className="flex flex-col gap-3">
                      {viewerError ? (
                        <div className="pointer-events-auto max-w-md">
                          <StageNotice
                            tone="error"
                            title={viewerError}
                            description="The viewer could not load this model."
                            actions={
                              <button type="button" onClick={resetToLanding} className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium transition hover:bg-white/10">
                                Back to upload
                              </button>
                            }
                          />
                        </div>
                      ) : null}
                      {screenshotMessage ? (
                        <div className="pointer-events-auto max-w-xs">
                          <StageNotice tone="success" title={screenshotMessage} />
                        </div>
                      ) : null}
                      {screenshotError ? (
                        <div className="pointer-events-auto max-w-sm">
                          <StageNotice tone="error" title={screenshotError} />
                        </div>
                      ) : null}
                    </div>
                    <div className="pointer-events-auto flex justify-end">
                      <FloatingActionButton onClick={handleScreenshot} title="Save screenshot">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-white">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 0 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </FloatingActionButton>
                    </div>
                  </div>
                }
                stageFooter={loading ? <LoadingOverlay message={loadingMessage} /> : null}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}
