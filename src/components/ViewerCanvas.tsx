import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import ViewerErrorBoundary from './ViewerErrorBoundary'
import type {
  ModelInfo,
  ViewerCommandState,
  ViewerProgressState,
  ViewerSettings,
} from './ModelViewer'
import ModelViewer from './ModelViewer'

interface ViewerCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  effectiveModelUrl: string | null
  settings: ViewerSettings
  viewerCommands: ViewerCommandState
  onViewerError: (message: string) => void
  onViewerProgress: (progress: ViewerProgressState) => void
  onModelInfo: (info: ModelInfo) => void
  onCreated: () => void
}

export default function ViewerCanvas({
  canvasRef,
  effectiveModelUrl,
  settings,
  viewerCommands,
  onViewerError,
  onViewerProgress,
  onModelInfo,
  onCreated,
}: ViewerCanvasProps) {
  return (
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
  )
}
