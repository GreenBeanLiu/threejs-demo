import { createFileRoute } from '@tanstack/react-router'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useState } from 'react'
import ModelViewer, { type ModelInfo, type ViewerSettings } from '../components/ModelViewer'
import ControlPanel from '../components/ControlPanel'
import DropZone from '../components/DropZone'

export const Route = createFileRoute('/')({ component: ViewerPage })

const DEFAULT_SETTINGS: ViewerSettings = {
  environment: 'city',
  wireframe: false,
  autoRotate: false,
  autoRotateSpeed: 1,
  showGrid: true,
  showAxes: false,
  exposure: 1,
  background: '#1a1a2e',
  lightIntensity: 1,
}

function ViewerPage() {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_SETTINGS)

  const handleFile = useCallback((url: string, name: string) => {
    setModelUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
    setFileName(name)
    setModelInfo(null)
  }, [])

  const patchSettings = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings(s => ({ ...s, ...patch }))
  }, [])

  return (
    <div className="flex h-[calc(100vh-57px)] gap-3 p-3">
      {/* Canvas area */}
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl">
        {modelUrl ? (
          <Canvas
            camera={{ position: [0, 2, 5], fov: 50 }}
            gl={{ antialias: true, toneMapping: 4 /* ACESFilmicToneMapping */ }}
            shadows
            style={{ width: '100%', height: '100%' }}
          >
            <Suspense fallback={null}>
              <ModelViewer
                url={modelUrl}
                settings={settings}
                onInfo={setModelInfo}
              />
            </Suspense>
          </Canvas>
        ) : (
          <DropZone onFile={handleFile} />
        )}

        {/* Bottom bar when model loaded */}
        {modelUrl && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--header-bg)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink)] shadow backdrop-blur-sm transition hover:bg-[var(--chip-bg)]">
              <input type="file" accept=".glb,.gltf" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) { const u = URL.createObjectURL(f); handleFile(u, f.name) } }} />
              📂 Change model
            </label>
          </div>
        )}
      </div>

      {/* Control panel */}
      <div className="w-56 shrink-0">
        <ControlPanel
          settings={settings}
          onChange={patchSettings}
          modelInfo={modelInfo}
          fileName={fileName}
        />
      </div>
    </div>
  )
}
