import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from '../lib/auth-client'
import DropZone from '../components/DropZone'
import Header from '../components/Header'
import HistoryPanel from '../components/HistoryPanel'
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
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[rgba(15,15,20,0.5)] backdrop-blur-sm">
      <div className="flex min-w-[280px] flex-col items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--header-bg)] p-8 shadow-2xl">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--line)] border-t-[#56c6be]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#56c6be]" />
          </div>
        </div>
        <div className="w-full text-center">
          <p className="text-sm font-medium text-[var(--sea-ink)]">{message}</p>
          {progress?.active ? (
            <>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-full rounded-full bg-[#56c6be] transition-all"
                  style={{ width: `${Math.max(6, Math.min(100, progress.progress || 0))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
                {progress.total > 0
                  ? `${progress.loaded}/${progress.total} assets`
                  : 'Fetching model assets'}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
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
      {modelUrl && (
        <div className="absolute left-0 right-0 top-0 z-40">
          <Header
            fileName={fileName}
            onUpload={handleFile}
            hasModel={!!modelUrl}
            onProcessing={setProcessing}
            onUploadComplete={refreshHistory}
          />
        </div>
      )}

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
        <div className="flex flex-1 overflow-hidden pt-14">
          <div className="pointer-events-none absolute left-4 right-[260px] top-[72px] z-20 hidden sm:block">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-4 py-3 shadow-lg backdrop-blur dark:bg-[rgba(19,25,31,0.78)]">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--sea-ink)]">
                  {fileName ?? 'Current model'}
                </p>
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  {processing
                    ? 'Uploading model and preparing viewer…'
                    : loading
                      ? loadingMessage
                      : viewerError
                        ? 'Viewer needs attention'
                        : 'Model ready for review'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetToLanding}
                className="pointer-events-auto rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:border-[#56c6be] hover:text-[var(--sea-ink)]"
              >
                Back
              </button>
            </div>
          </div>
          <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-[var(--sea-ink-soft)]">Loading viewer…</div>}>
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
            />
          </Suspense>

          {loading && <LoadingOverlay message={loadingMessage} progress={viewerProgress} />}

          {viewerError ? (
            <div className="absolute left-4 top-4 z-30 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
              <p className="font-medium">{viewerError}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRetryModelLoad}
                  className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium transition hover:bg-red-100"
                >
                  Retry load
                </button>
                <button
                  type="button"
                  onClick={resetToLanding}
                  className="rounded-full border border-[var(--chip-line)] bg-white px-3 py-1 text-xs font-medium text-[var(--sea-ink)] transition hover:bg-[var(--chip-bg)]"
                >
                  Back to upload
                </button>
              </div>
            </div>
          ) : null}

          {screenshotMessage ? (
            <div className="absolute left-4 top-4 z-30 max-w-xs rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-lg">
              {screenshotMessage}
            </div>
          ) : null}

          {screenshotError ? (
            <div className="absolute left-4 top-4 z-30 max-w-xs rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
              {screenshotError}
            </div>
          ) : null}

          <button
            onClick={handleScreenshot}
            title="Save screenshot"
            className="absolute bottom-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--chip-line)] bg-[var(--header-bg)] shadow-md backdrop-blur-sm transition hover:bg-[var(--chip-bg)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 text-[var(--sea-ink)]"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 0 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
