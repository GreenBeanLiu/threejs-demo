import { lazy, Suspense } from 'react'
import type {
  ModelInfo,
  ViewerCommandState,
  ViewerProgressState,
  ViewerSettings,
} from './ModelViewer'

const ControlPanel = lazy(() => import('./ControlPanel'))
const ViewerCanvas = lazy(() => import('./ViewerCanvas'))

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
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-[var(--sea-ink-soft)]">Loading canvas…</div>}>
          <ViewerCanvas
            canvasRef={canvasRef}
            effectiveModelUrl={effectiveModelUrl}
            settings={settings}
            viewerCommands={viewerCommands}
            onViewerError={onViewerError}
            onViewerProgress={onViewerProgress}
            onModelInfo={onModelInfo}
            onCreated={onCreated}
          />
        </Suspense>
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
