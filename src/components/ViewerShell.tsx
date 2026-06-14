import { useRef, type ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import ModelViewerElement, { type ModelViewerHandle } from './ModelViewerElement'
import type { ViewerSettings } from './model-viewer/types'

const ControlPanel = lazy(() => import('./ControlPanel'))

interface ViewerShellProps {
  effectiveModelUrl: string | null
  fileName: string | null
  settings: ViewerSettings
  onSettingsChange: (patch: Partial<ViewerSettings>) => void
  onViewerError: (message: string) => void
  onCreated: () => void
  stageOverlay?: ReactNode
  stageFooter?: ReactNode
}

export default function ViewerShell({
  effectiveModelUrl,
  fileName,
  settings,
  onSettingsChange,
  onViewerError,
  onCreated,
  stageOverlay,
  stageFooter,
}: ViewerShellProps) {
  const mvRef = useRef<ModelViewerHandle>(null)

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_288px] bg-[#0b1116] xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative min-w-0 overflow-hidden border-r border-white/8">
        {effectiveModelUrl ? (
          <ModelViewerElement
            ref={mvRef}
            src={effectiveModelUrl}
            autoRotate={settings.autoRotate}
            autoRotateSpeed={settings.autoRotateSpeed}
            exposure={settings.exposure}
            background={settings.background}
            environment={settings.environment}
            onLoad={onCreated}
            onError={onViewerError}
          />
        ) : null}
        {stageOverlay}
        {stageFooter}
      </div>

      <aside className="overflow-y-auto bg-[#10181f] p-3 text-white/88">
        <Suspense fallback={<div className="text-sm text-white/55">Loading controls…</div>}>
          <ControlPanel
            settings={settings}
            onChange={onSettingsChange}
            fileName={fileName}
            onFitToModel={() => mvRef.current?.fitToModel()}
            onResetView={() => mvRef.current?.resetView()}
          />
        </Suspense>
      </aside>
    </div>
  )
}
