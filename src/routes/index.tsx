import { Canvas } from '@react-three/fiber'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useCallback, useMemo, useRef, useState } from 'react'
import ControlPanel from '../components/ControlPanel'
import DropZone from '../components/DropZone'
import Header from '../components/Header'
import HistoryPanel from '../components/HistoryPanel'
import ModelViewer, {
  type ModelInfo,
  type ViewerCommandState,
  type ViewerSettings,
} from '../components/ModelViewer'

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

function LoadingOverlay({ message = 'Loading model…' }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[rgba(15,15,20,0.5)] backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--header-bg)] p-8 shadow-2xl">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--line)] border-t-[#56c6be]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#56c6be]" />
          </div>
        </div>
        <p className="text-sm font-medium text-[var(--sea-ink)]">{message}</p>
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
  const [viewerError, setViewerError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const refreshHistory = useCallback(() => {
    setHistoryRefreshKey((value) => value + 1)
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
    setLoading(true)
    if (isProcessing !== undefined) setProcessing(isProcessing)
  }, [])

  const patchSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((value) => ({ ...value, ...patch }))
  }, [])

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = (fileName?.replace(/\.[^.]+$/, '') ?? 'model') + '-preview.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [fileName])

  const handleFitToModel = useCallback(() => {
    setFitVersion((value) => value + 1)
  }, [])

  const handleResetView = useCallback(() => {
    setResetVersion((value) => value + 1)
  }, [])

  const viewerCommands = useMemo<ViewerCommandState>(
    () => ({ fitVersion, resetVersion }),
    [fitVersion, resetVersion],
  )

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
            {loading && (
              <LoadingOverlay
                message={processing ? 'Processing and saving...' : 'Loading model...'}
              />
            )}
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
                <ModelViewer
                  url={modelUrl}
                  settings={settings}
                  onInfo={setModelInfo}
                  commands={viewerCommands}
                />
              </Suspense>
            </Canvas>

            {loading && (
              <LoadingOverlay
                message={processing ? 'Processing and saving...' : 'Loading model...'}
              />
            )}

            {viewerError ? (
              <div className="absolute left-4 top-4 z-30 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
                {viewerError}
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
