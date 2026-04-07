import { Canvas } from '@react-three/fiber'
import { lazy, Suspense } from 'react'
import ViewerErrorBoundary from './ViewerErrorBoundary'
import type {
  ModelInfo,
  ViewerCommandState,
  ViewerProgressState,
  ViewerSettings,
} from './ModelViewer'

const ControlPanel = lazy(() => import('./ControlPanel'))
const ModelViewer = lazy(() => import('./ModelViewer'))

interface ViewerShellProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  effectiveModelUrl: string | null
  settings: ViewerSettings
  modelInfo: ModelInfo | null
  fileName: string | null
  viewerCommands: ViewerCommandState
  onViewerError: (message: string) => void
  onViewerProgress: (progress: ViewerProgressState) => void
  onSettingsChange: (patch: Partial<ViewerSettings>) => void
  onModelInfo: (info: ModelInfo) => void
  onFitToModel: () => void
  onResetView: () => void
  onCreated: () => void
}

export default function ViewerShell({
  canvasRef,
  effectiveModelUrl,
  settings,
  modelInfo,
  fileName,
  viewerCommands,
  onViewerError,
  onViewerProgress,
  onSettingsChange,
  onModelInfo,
  onFitToModel,
  onResetView,
  onCreated,
}: ViewerShellProps) {
  return (
    <>
      <div className="relative flex-1 overflow-hidden">
        <Canvas
          ref={canvasRef}
          camera={{ position: [0, 1.5, 4], fov: 45 }}
          gl={{ antialias: true, toneMapping: 4, preserveDrawingBuffer: true }}
          shadows
          style={{ width: '100%', height: '100%' }}
          onCreated={onCreated}
        >
          <Suspense fallback={null}>
            <ViewerErrorBoundary modelUrl={effectiveModelUrl} onError={onViewerError}>
              {effectiveModelUrl ? (
                <ModelViewer
                  key={effectiveModelUrl}
                  url={effectiveModelUrl}
                  settings={settings}
                  onInfo={onModelInfo}
                  commands={viewerCommands}
                  onProgress={onViewerProgress}
                />
              ) : null}
            </ViewerErrorBoundary>
          </Suspense>
        </Canvas>
      </div>

      <div className="w-60 shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--header-bg)] p-3">
        <Suspense fallback={<div className="text-sm text-[var(--sea-ink-soft)]">Loading controls…</div>}>
          <ControlPanel
            settings={settings}
            onChange={onSettingsChange}
            modelInfo={modelInfo}
            fileName={fileName}
            onFitToModel={onFitToModel}
            onResetView={onResetView}
          />
        </Suspense>
      </div>
    </>
  )
}
