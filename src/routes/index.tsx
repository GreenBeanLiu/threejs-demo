import { Canvas } from '@react-three/fiber'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ControlPanel from '../components/ControlPanel'
import DropZone from '../components/DropZone'
import Header from '../components/Header'
import HistoryPanel from '../components/HistoryPanel'
import ModelViewer, {
  type ModelInfo,
  type ViewerCommandState,
  type ViewerProgressState,
  type ViewerSettings,
} from '../components/ModelViewer'
import ViewerErrorBoundary from '../components/ViewerErrorBoundary'

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

  const effectiveModelUrl = modelUrl ? `${modelUrl}${modelUrl.includes('?') ? '&' : '?'}rv=${retryVersion}` : null

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
        <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
          <div className="text-center">
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-[var(--sea-ink)]">
              Packaging 3D Viewer
            </h1>
            <p className="text-base text-[var(--sea-ink-soft)]">
              Upload your packaging model to preview it in interactive 3D
            </p>
          </div>
          <div className="relative h-64 w-full max-w-xl">
            <DropZone
              onFile={handleFile}
              onProcessing={setProcessing}
              onUploadComplete={refreshHistory}
            />
            {loading && <LoadingOverlay message={loadingMessage} progress={viewerProgress} />}
          </div>
          <HistoryPanel onSelect={handleFile} refreshKey={historyRefreshKey} />
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--sea-ink-soft)]">
            {[
              ['360° View', 'Rotate and inspect from any angle'],
              ['Lighting Studio', 'Professional lighting presets'],
              ['Instant Share', 'Screenshot in one click'],
            ].map(([title, desc]) => (
              <div key={title} className="island-shell max-w-[180px] rounded-2xl p-4 text-center">
                <p className="mb-1 font-semibold text-[var(--sea-ink)]">{title}</p>
                <p className="text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden pt-14">
          <div className="relative flex-1 overflow-hidden">
            <Canvas
              ref={canvasRef}
              camera={{ position: [0, 1.5, 4], fov: 45 }}
              gl={{ antialias: true, toneMapping: 4, preserveDrawingBuffer: true }}
              shadows
              style={{ width: '100%', height: '100%' }}
              onCreated={() => setLoading(false)}
            >
              <Suspense fallback={null}>
                <ViewerErrorBoundary modelUrl={effectiveModelUrl} onError={setViewerError}>
                  {effectiveModelUrl ? (
                    <ModelViewer
                      key={effectiveModelUrl}
                      url={effectiveModelUrl}
                      settings={settings}
                      onInfo={setModelInfo}
                      commands={viewerCommands}
                      onProgress={handleViewerProgress}
                    />
                  ) : null}
                </ViewerErrorBoundary>
              </Suspense>
            </Canvas>

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
              className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--chip-line)] bg-[var(--header-bg)] shadow-md backdrop-blur-sm transition hover:bg-[var(--chip-bg)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-[var(--sea-ink)]">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 0 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>

          <div className="w-60 shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--header-bg)] p-3">
            <ControlPanel
              settings={settings}
              onChange={patchSettings}
              modelInfo={modelInfo}
              fileName={fileName}
              onFitToModel={handleFitToModel}
              onResetView={handleResetView}
            />
          </div>
        </div>
      )}
    </div>
  )
}
