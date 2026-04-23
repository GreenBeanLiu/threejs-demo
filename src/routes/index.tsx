import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { signOut, useSession } from '../lib/auth-client'
import DropZone from '../components/DropZone'
import HistoryPanel from '../components/HistoryPanel'
import {
  isSupportedModelFile,
  MAX_UPLOAD_BYTES,
  revokeObjectUrl,
  uploadModelFile,
} from '../lib/uploads'
import type {
  ModelInfo,
  ViewerCommandState,
  ViewerProgressState,
  ViewerSettings,
} from '../components/ModelViewer'

const ViewerShell = lazy(() => import('../components/ViewerShell'))

export const Route = createFileRoute('/')({ component: ViewerPage })

const DEFAULT_SETTINGS: ViewerSettings = {
  environment: 'studio',
  wireframe: false,
  whiteModel: false,
  flatShading: false,
  autoRotate: true,
  autoRotateSpeed: 0.8,
  showGrid: false,
  showAxes: false,
  exposure: 1.2,
  background: '#0f0f14',
  lightIntensity: 1.2,
}

function getLoadingMessage(params: {
  processing: boolean
  progress: ViewerProgressState | null
}) {
  if (params.processing) {
    return 'Uploading and saving model…'
  }

  if (!params.progress) {
    return 'Loading model…'
  }

  if (params.progress.active) {
    if (params.progress.total > 0) {
      return `Loading model… ${Math.round(params.progress.progress)}%`
    }

    return 'Loading model assets…'
  }

  return 'Preparing viewer…'
}

function LoadingOverlay({
  message = 'Loading model…',
  progress,
}: {
  message?: string
  progress?: ViewerProgressState | null
}) {
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
        {progress?.active ? (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#56c6be] transition-all"
                style={{ width: `${Math.max(6, Math.min(100, progress.progress || 0))}%` }}
              />
            </div>
            <p className="text-xs text-white/45">
              {progress.total > 0
                ? `${progress.loaded}/${progress.total} assets`
                : 'Fetching model assets'}
            </p>
          </>
        ) : null}
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
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [fitVersion, setFitVersion] = useState(0)
  const [resetVersion, setResetVersion] = useState(0)
  const [retryVersion, setRetryVersion] = useState(0)
  const [viewerError, setViewerError] = useState('')
  const [viewerProgress, setViewerProgress] = useState<ViewerProgressState | null>(null)
  const [screenshotMessage, setScreenshotMessage] = useState('')
  const [screenshotError, setScreenshotError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      if (prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev)
      }
      return null
    })
    setFileName(null)
    setModelInfo(null)
    setViewerError('')
    setViewerProgress(null)
    setScreenshotMessage('')
    setScreenshotError('')
    setLoading(false)
    setProcessing(false)
  }, [])

  const handleFile = useCallback((url: string, name: string, isProcessing?: boolean) => {
    setModelUrl((prev) => {
      if (prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev)
      }
      return url
    })
    setFileName(name)
    setModelInfo(null)
    setViewerError('')
    setViewerProgress(null)
    setScreenshotMessage('')
    setScreenshotError('')
    setRetryVersion(0)
    setLoading(true)
    if (isProcessing !== undefined) setProcessing(isProcessing)
  }, [])

  const patchSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((value) => ({ ...value, ...patch }))
  }, [])

  const handleScreenshot = useCallback(() => {
    setScreenshotMessage('')
    setScreenshotError('')

    const canvas = document.querySelector('canvas')
    if (!canvas) {
      setScreenshotError('Screenshot failed: canvas not ready.')
      return
    }

    try {
      const link = document.createElement('a')
      link.download = (fileName?.replace(/\.[^.]+$/, '') ?? 'model') + '-preview.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      setScreenshotMessage('Screenshot saved.')
    } catch (error) {
      setScreenshotError(
        error instanceof Error ? `Screenshot failed: ${error.message}` : 'Screenshot failed.',
      )
    }
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

  const handleSignOut = useCallback(async () => {
    await signOut()
    window.location.href = '/login'
  }, [])

  const handleFitToModel = useCallback(() => {
    setFitVersion((value) => value + 1)
  }, [])

  const handleResetView = useCallback(() => {
    setResetVersion((value) => value + 1)
  }, [])

  const handleRetryModelLoad = useCallback(() => {
    if (!modelUrl) {
      return
    }

    setViewerError('')
    setViewerProgress(null)
    setLoading(true)
    setRetryVersion((value) => value + 1)
  }, [modelUrl])

  const handleViewerProgress = useCallback((progress: ViewerProgressState) => {
    setViewerProgress(progress)
    if (!progress.active && progress.progress >= 100) {
      setLoading(false)
    }
  }, [])

  const viewerCommands = useMemo<ViewerCommandState>(
    () => ({ fitVersion, resetVersion }),
    [fitVersion, resetVersion],
  )

  const loadingMessage = getLoadingMessage({
    processing,
    progress: viewerProgress,
  })

  const effectiveModelUrl = modelUrl
    ? `${modelUrl}${modelUrl.includes('?') ? '&' : '?'}rv=${retryVersion}`
    : null

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {!modelUrl ? (
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-start">
            <section className="flex flex-col gap-6">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-xs font-medium tracking-wide text-[var(--sea-ink-soft)]">
                  <span className="h-2 w-2 rounded-full bg-[#56c6be]" />
                  PackView · Packaging 3D Review
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
                  Review packaging models in a cleaner, client-friendly 3D workspace.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-[var(--sea-ink-soft)] sm:text-lg">
                  Upload GLB or GLTF files, inspect them from every angle, tune lighting, and keep a recent model history without leaving the browser.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['Fast review', 'Open product or packaging renders in seconds with a lighter landing page.'],
                  ['Studio controls', 'Switch lighting presets, reset camera, and capture quick review screenshots.'],
                  ['Recent history', 'Jump back into recently uploaded packaging models without re-uploading.'],
                ].map(([title, desc]) => (
                  <div key={title} className="island-shell rounded-3xl p-5">
                    <p className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">{title}</p>
                    <p className="text-sm leading-6 text-[var(--sea-ink-soft)]">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="relative min-h-[300px] rounded-[28px] border border-[var(--line)] bg-[var(--header-bg)] p-4 shadow-[0_24px_60px_rgba(11,22,28,0.12)] sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--sea-ink)]">Upload a packaging model</p>
                    <p className="text-sm text-[var(--sea-ink-soft)]">
                      Supports <span className="font-medium text-[var(--sea-ink)]">.glb</span> and <span className="font-medium text-[var(--sea-ink)]">.gltf</span> up to 50MB.
                    </p>
                  </div>
                  <div className="rounded-full bg-[var(--chip-bg)] px-3 py-1 text-xs text-[var(--sea-ink-soft)]">
                    Best for mockups, dielines, and packaging previews
                  </div>
                </div>

                <div className="relative h-64 w-full">
                  <DropZone
                    onFile={handleFile}
                    onProcessing={setProcessing}
                    onUploadComplete={refreshHistory}
                    signedIn={!!session?.user}
                    previewError={viewerError}
                  />
                  {loading && <LoadingOverlay message={loadingMessage} progress={viewerProgress} />}
                </div>
              </div>
            </section>

            <aside className="flex flex-col gap-4">
              <div className="island-shell rounded-[28px] p-5">
                <p className="text-sm font-semibold text-[var(--sea-ink)]">Recent uploads</p>
                <p className="mt-1 text-sm leading-6 text-[var(--sea-ink-soft)]">
                  Re-open recently reviewed models and keep your packaging review flow moving.
                </p>
                <div className="mt-4">
                  <HistoryPanel
                    onSelect={handleFile}
                    refreshKey={historyRefreshKey}
                    selectedPath={modelUrl}
                    signedIn={!!session?.user}
                  />
                </div>
              </div>

              <div className="island-shell rounded-[28px] p-5">
                <p className="text-sm font-semibold text-[var(--sea-ink)]">Suggested review flow</p>
                <ol className="mt-3 space-y-3 text-sm text-[var(--sea-ink-soft)]">
                  {[
                    'Upload the latest packaging model revision.',
                    'Check lighting presets and camera fit for overall form.',
                    'Use screenshot export to share quick review snapshots.',
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3 leading-6">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(86,198,190,0.14)] text-xs font-semibold text-[var(--sea-ink)]">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
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
                    {processing
                      ? 'Uploading model and preparing viewer…'
                      : loading
                        ? loadingMessage
                        : viewerError
                          ? 'Viewer needs attention'
                          : 'Model ready for review'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="hidden cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-[#56c6be]/40 hover:text-white sm:flex">
                  <input type="file" accept=".glb,.gltf" className="sr-only" onChange={handleToolbarUpload} />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Replace model
                </label>
                {session?.user ? (
                  <>
                    <span className="hidden text-xs text-white/42 lg:inline">
                      {session.user.name || session.user.email}
                    </span>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/68 transition hover:border-red-400/40 hover:text-red-200"
                    >
                      Sign out
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 p-3 sm:p-4">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-white/55">Loading viewer workspace…</div>}>
              <ViewerShell
                canvasRef={canvasRef}
                effectiveModelUrl={effectiveModelUrl}
                settings={settings}
                modelInfo={modelInfo}
                fileName={fileName}
                viewerCommands={viewerCommands}
                onViewerError={setViewerError}
                onViewerProgress={handleViewerProgress}
                onSettingsChange={patchSettings}
                onModelInfo={setModelInfo}
                onFitToModel={handleFitToModel}
                onResetView={handleResetView}
                onCreated={() => setLoading(false)}
                stageOverlay={
                  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4">
                    <div className="flex flex-col gap-3">
                      <div className="max-w-max rounded-full border border-white/10 bg-[rgba(8,14,18,0.78)] px-3 py-1 text-[11px] font-medium tracking-wide text-white/60 backdrop-blur">
                        Viewer workspace
                      </div>

                      {viewerError ? (
                        <div className="pointer-events-auto max-w-md">
                          <StageNotice
                            tone="error"
                            title={viewerError}
                            description="This model finished uploading, but the viewer could not prepare it cleanly."
                            actions={
                              <>
                                <button
                                  type="button"
                                  onClick={handleRetryModelLoad}
                                  className="rounded-full border border-red-300/35 px-3 py-1 text-xs font-medium transition hover:bg-red-200/10"
                                >
                                  Retry load
                                </button>
                                <button
                                  type="button"
                                  onClick={resetToLanding}
                                  className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium transition hover:bg-white/10"
                                >
                                  Back to upload
                                </button>
                              </>
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

                    <div className="flex items-end justify-between gap-3">
                      <div className="rounded-2xl border border-white/10 bg-[rgba(8,14,18,0.72)] px-3 py-2 text-xs text-white/55 backdrop-blur">
                        Use the side tools to inspect lighting, display mode, and model stats.
                      </div>

                      <div className="pointer-events-auto flex items-center gap-2">
                        <FloatingActionButton onClick={handleScreenshot} title="Save screenshot">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4 text-white"
                          >
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 0 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </FloatingActionButton>
                      </div>
                    </div>
                  </div>
                }
                stageFooter={loading ? <LoadingOverlay message={loadingMessage} progress={viewerProgress} /> : null}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}
