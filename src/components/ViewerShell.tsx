import { lazy, Suspense, type ReactNode } from 'react'
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
  stageOverlay?: ReactNode
  stageFooter?: ReactNode
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
  stageOverlay,
  stageFooter,
}: ViewerShellProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_288px] bg-[#0b1116] xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative min-w-0 overflow-hidden border-r border-white/8 bg-[#0c1318]">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-white/55">Loading canvas…</div>}>
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

        {stageOverlay}
        {stageFooter}
      </div>

      <aside className="overflow-y-auto bg-[#10181f] p-3 text-white/88">
        <Suspense fallback={<div className="text-sm text-white/55">Loading controls…</div>}>
          <ControlPanel
            settings={settings}
            onChange={onSettingsChange}
            modelInfo={modelInfo}
            fileName={fileName}
            onFitToModel={onFitToModel}
            onResetView={onResetView}
          />
        </Suspense>
      </aside>
    </div>
  )
}
