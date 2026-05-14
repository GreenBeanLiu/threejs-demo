import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { createFileRoute } from '@tanstack/react-router'
import {
  Box,
  Camera,
  Eye,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { Suspense, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

export const Route = createFileRoute('/studio-demo')({
  component: StudioDemoPage,
})

type PackKind = 'bottle' | 'jar' | 'tube' | 'carton'
type EnvironmentPreset = 'studio' | 'city' | 'warehouse' | 'sunset'

type DemoPack = {
  id: string
  name: string
  subtitle: string
  summary: string
  kind: PackKind
  accent: string
  baseColor: string
  score: number
  triangles: string
  textures: string
  weight: string
}

const DEMO_PACKS: DemoPack[] = [
  {
    id: 'mist-bottle',
    name: 'Aura Mist Bottle',
    subtitle: 'Skincare / hero render',
    summary: 'Tall cosmetic bottle with soft shoulder transition and a glossy cap silhouette.',
    kind: 'bottle',
    accent: '#73e0d7',
    baseColor: '#d9f7f4',
    score: 92,
    triangles: '18k',
    textures: '3',
    weight: '2.6 MB',
  },
  {
    id: 'ceramic-jar',
    name: 'Stone Cream Jar',
    subtitle: 'Luxury packaging / close-up',
    summary: 'Low and stable jar body with a dense lid stack for premium front-facing composition.',
    kind: 'jar',
    accent: '#b0f0c6',
    baseColor: '#e7f4eb',
    score: 88,
    triangles: '14k',
    textures: '2',
    weight: '2.1 MB',
  },
  {
    id: 'soft-tube',
    name: 'Derm Tube 50ml',
    subtitle: 'Medical beauty / shelf mock',
    summary: 'Soft tube with angled shoulder and compact cap, tuned for quick product rotations.',
    kind: 'tube',
    accent: '#6cc3ff',
    baseColor: '#edf7ff',
    score: 85,
    triangles: '11k',
    textures: '1',
    weight: '1.8 MB',
  },
  {
    id: 'fold-box',
    name: 'Minimal Carton Box',
    subtitle: 'Retail box / presentation',
    summary: 'A clean folding carton block with subtle bevels, label banding, and shadow-heavy staging.',
    kind: 'carton',
    accent: '#f0c06d',
    baseColor: '#f9efde',
    score: 90,
    triangles: '9k',
    textures: '1',
    weight: '1.3 MB',
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const int = Number.parseInt(value, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function PackModel({
  pack,
  exploded,
  wireframe,
  whiteModel,
}: {
  pack: DemoPack
  exploded: boolean
  wireframe: boolean
  whiteModel: boolean
}) {
  const accent = useMemo(() => new THREE.Color(pack.accent), [pack.accent])
  const base = useMemo(() => new THREE.Color(whiteModel ? '#f5f7fb' : pack.baseColor), [pack.baseColor, whiteModel])
  const dark = useMemo(() => new THREE.Color(whiteModel ? '#d8dfea' : pack.accent).multiplyScalar(0.7), [pack.accent, whiteModel])
  const label = useMemo(() => new THREE.Color(whiteModel ? '#dde4ef' : '#f8fbff'), [whiteModel])
  const capY = exploded ? 1.45 : 1.08
  const lowerBodyY = exploded ? -0.08 : 0

  const shared = {
    metalness: 0.18,
    roughness: 0.34,
    wireframe,
  }

  if (pack.kind === 'bottle') {
    return (
      <group position={[0, -0.2, 0]}>
        <mesh position={[0, lowerBodyY, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.62, 1.7, 64]} />
          <meshStandardMaterial color={base} {...shared} />
        </mesh>
        <mesh position={[0, 0.86, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.34, 0.38, 48]} />
          <meshStandardMaterial color={base.clone().offsetHSL(0, 0, -0.04)} {...shared} />
        </mesh>
        <mesh position={[0, capY, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.25, 0.29, 0.52, 48]} />
          <meshStandardMaterial color={dark} metalness={0.28} roughness={0.24} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.18, 0.53]} castShadow>
          <boxGeometry args={[0.68, 0.64, 0.03]} />
          <meshStandardMaterial color={label} roughness={0.6} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, -0.68, 0]} receiveShadow>
          <cylinderGeometry args={[0.68, 0.7, 0.04, 48]} />
          <meshStandardMaterial color={accent} metalness={0.1} roughness={0.72} wireframe={wireframe} />
        </mesh>
      </group>
    )
  }

  if (pack.kind === 'jar') {
    return (
      <group position={[0, -0.32, 0]}>
        <mesh position={[0, lowerBodyY, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.86, 0.94, 1.05, 64]} />
          <meshStandardMaterial color={base} {...shared} />
        </mesh>
        <mesh position={[0, capY - 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.94, 0.98, 0.4, 64]} />
          <meshStandardMaterial color={dark} metalness={0.2} roughness={0.28} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.04, 0.79]} castShadow>
          <boxGeometry args={[1.12, 0.46, 0.03]} />
          <meshStandardMaterial color={label} roughness={0.66} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, -0.55, 0]} receiveShadow>
          <cylinderGeometry args={[1.02, 1.02, 0.05, 48]} />
          <meshStandardMaterial color={accent} roughness={0.76} wireframe={wireframe} />
        </mesh>
      </group>
    )
  }

  if (pack.kind === 'tube') {
    return (
      <group position={[0, -0.1, 0]}>
        <mesh position={[0, lowerBodyY + 0.06, 0]} rotation={[0, 0, 0.05]} castShadow receiveShadow>
          <cylinderGeometry args={[0.44, 0.62, 1.92, 48]} />
          <meshStandardMaterial color={base} {...shared} />
        </mesh>
        <mesh position={[0, 1.02, 0]} rotation={[0, 0, 0.05]} castShadow receiveShadow>
          <sphereGeometry args={[0.45, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={base.clone().offsetHSL(0, 0, -0.03)} {...shared} />
        </mesh>
        <mesh position={[0, exploded ? -1.05 : -0.92, 0]} rotation={[0, 0, 0.05]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.43, 0.38, 36]} />
          <meshStandardMaterial color={dark} metalness={0.24} roughness={0.25} wireframe={wireframe} />
        </mesh>
        <mesh position={[0, 0.05, 0.53]} rotation={[0, 0, 0.05]} castShadow>
          <boxGeometry args={[0.7, 0.88, 0.03]} />
          <meshStandardMaterial color={label} roughness={0.6} wireframe={wireframe} />
        </mesh>
      </group>
    )
  }

  return (
    <group position={[0, -0.08, 0]}>
      <mesh position={[0, lowerBodyY, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.42, 2.18, 0.92]} />
        <meshStandardMaterial color={base} {...shared} />
      </mesh>
      <mesh position={[0, 0.18, 0.47]} castShadow>
        <boxGeometry args={[1.08, 1.18, 0.03]} />
        <meshStandardMaterial color={label} roughness={0.62} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, exploded ? 1.42 : 1.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.46, 0.18, 0.96]} />
        <meshStandardMaterial color={dark} metalness={0.18} roughness={0.32} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, -1.16, 0]} receiveShadow>
        <boxGeometry args={[1.54, 0.06, 1.02]} />
        <meshStandardMaterial color={accent} roughness={0.78} wireframe={wireframe} />
      </mesh>
    </group>
  )
}

function StudioDemoCanvas({
  pack,
  autoRotate,
  wireframe,
  whiteModel,
  showGrid,
  exploded,
  environment,
  canvasHostRef,
}: {
  pack: DemoPack
  autoRotate: boolean
  wireframe: boolean
  whiteModel: boolean
  showGrid: boolean
  exploded: boolean
  environment: EnvironmentPreset
  canvasHostRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={canvasHostRef} className="absolute inset-0">
      <Canvas
        camera={{ position: [3.4, 2.1, 5], fov: 34 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        shadows
      >
        <color attach="background" args={[whiteModel ? '#eef4f7' : '#0b1118']} />
        <fog attach="fog" args={[whiteModel ? '#eef4f7' : '#0b1118', 8, 16]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 6, 4]} intensity={2.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <directionalLight position={[-4, 2, -4]} intensity={0.6} />

        <Suspense fallback={null}>
          <Environment preset={environment} />
          <group rotation={[0.05, -0.55, 0]}>
            <PackModel
              pack={pack}
              exploded={exploded}
              wireframe={wireframe}
              whiteModel={whiteModel}
            />
          </group>
          <ContactShadows position={[0, -1.28, 0]} opacity={whiteModel ? 0.18 : 0.42} scale={12} blur={2.4} far={6} />
        </Suspense>

        {showGrid ? <gridHelper args={[12, 12, '#28434d', '#1b2d35']} position={[0, -1.25, 0]} /> : null}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={0.95}
          minDistance={2.6}
          maxDistance={9}
        />
      </Canvas>
    </div>
  )
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-[#73e0d7]/60 bg-[#73e0d7]/14 text-white'
          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/88',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function StudioDemoPage() {
  const [selectedId, setSelectedId] = useState(DEMO_PACKS[0].id)
  const [autoRotate, setAutoRotate] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [whiteModel, setWhiteModel] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [exploded, setExploded] = useState(false)
  const [presentationMode, setPresentationMode] = useState(false)
  const [environment, setEnvironment] = useState<EnvironmentPreset>('studio')
  const [shotMessage, setShotMessage] = useState('')
  const canvasHostRef = useRef<HTMLDivElement>(null)

  const selectedPack = DEMO_PACKS.find((item) => item.id === selectedId) ?? DEMO_PACKS[0]

  const panelTone = useMemo(() => hexToRgba(selectedPack.accent, 0.14), [selectedPack.accent])
  const scoreTone = useMemo(() => {
    if (selectedPack.score >= 90) return 'Demo ready'
    if (selectedPack.score >= 85) return 'Needs material polish'
    return 'Needs geometry cleanup'
  }, [selectedPack.score])

  const handleScreenshot = () => {
    const canvas = canvasHostRef.current?.querySelector('canvas')
    if (!canvas) {
      setShotMessage('Canvas not ready yet.')
      return
    }

    const link = document.createElement('a')
    link.download = `${selectedPack.id}-studio-demo.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setShotMessage('PNG snapshot saved.')
    window.setTimeout(() => setShotMessage(''), 1800)
  }

  return (
    <main className="page-wrap rise-in py-8">
      <section className="mb-6 rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(10,18,24,0.92),rgba(9,14,19,0.98))] p-6 text-white shadow-[0_30px_70px_rgba(8,20,25,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-white/62 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Studio demo
            </div>
            <h1 className="display-title text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              抄 3DCellForge 的产品布局和展示体验，先给你一版可跑 demo
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
              这版不碰 PackView 的上传、历史、鉴权主链路，只新增一个独立工作台页面：左侧模型库、中间 3D 舞台、右侧质检与控制区，重点验证产品信息架构和展示手感。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPresentationMode((value) => !value)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/82 transition hover:border-white/20 hover:bg-white/8"
            >
              {presentationMode ? 'Exit presentation' : 'Presentation mode'}
            </button>
            <button
              type="button"
              onClick={handleScreenshot}
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#56c6be,#2d9d8f)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
            >
              <Camera className="h-4 w-4" />
              Save PNG
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-white/8 bg-[#091015] shadow-[0_24px_80px_rgba(6,14,18,0.34)]">
        <div className={presentationMode ? 'grid min-h-[780px] grid-cols-1' : 'grid min-h-[780px] grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_320px]'}>
          {!presentationMode ? (
            <aside className="border-b border-white/8 bg-[#0c1319] p-4 text-white xl:border-r xl:border-b-0">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-white/42 uppercase">Model library</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Curated packs</h2>
                </div>
                <Box className="h-4 w-4 text-white/42" />
              </div>

              <div className="space-y-3">
                {DEMO_PACKS.map((pack) => {
                  const active = pack.id === selectedPack.id
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setSelectedId(pack.id)}
                      className={[
                        'w-full rounded-2xl border p-3 text-left transition',
                        active
                          ? 'border-white/16 bg-white/[0.08] shadow-[0_10px_30px_rgba(20,44,52,0.28)]'
                          : 'border-white/6 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]',
                      ].join(' ')}
                    >
                      <div
                        className="mb-3 h-28 rounded-xl border border-white/8"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${hexToRgba(pack.accent, 0.34)}, transparent 42%), linear-gradient(180deg, ${hexToRgba(pack.accent, 0.22)}, rgba(255,255,255,0.04))`,
                        }}
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{pack.name}</p>
                          <p className="mt-1 text-xs text-white/48">{pack.subtitle}</p>
                        </div>
                        <span
                          className="rounded-full px-2 py-1 text-[11px] font-semibold"
                          style={{ background: hexToRgba(pack.accent, 0.18), color: pack.accent }}
                        >
                          {pack.score}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/55">{pack.summary}</p>
                    </button>
                  )
                })}
              </div>
            </aside>
          ) : null}

          <div className="relative min-h-[780px] overflow-hidden bg-[#0a1117]">
            <StudioDemoCanvas
              pack={selectedPack}
              autoRotate={autoRotate}
              wireframe={wireframe}
              whiteModel={whiteModel}
              showGrid={showGrid}
              exploded={exploded}
              environment={environment}
              canvasHostRef={canvasHostRef}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5">
              <div className="pointer-events-auto max-w-md rounded-2xl border border-white/10 bg-[rgba(8,16,23,0.76)] p-4 text-white shadow-xl backdrop-blur-md">
                <p className="text-xs font-semibold tracking-[0.22em] text-white/42 uppercase">Center stage</p>
                <h3 className="mt-2 text-xl font-semibold">{selectedPack.name}</h3>
                <p className="mt-1 text-sm text-white/52">{selectedPack.subtitle}</p>
                <p className="mt-3 text-sm leading-6 text-white/70">{selectedPack.summary}</p>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRotate((value) => !value)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[rgba(8,16,23,0.72)] text-white/78 shadow-lg backdrop-blur hover:border-white/20 hover:text-white"
                  title={autoRotate ? 'Pause auto rotate' : 'Play auto rotate'}
                >
                  {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWireframe(false)
                    setWhiteModel(false)
                    setShowGrid(false)
                    setExploded(false)
                    setEnvironment('studio')
                    setAutoRotate(true)
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[rgba(8,16,23,0.72)] text-white/78 shadow-lg backdrop-blur hover:border-white/20 hover:text-white"
                  title="Reset demo controls"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
              <div className="pointer-events-auto rounded-2xl border border-white/10 bg-[rgba(8,16,23,0.76)] px-4 py-3 text-white shadow-xl backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <span>Quality score {selectedPack.score}</span>
                  <span>•</span>
                  <span>{selectedPack.triangles} tris</span>
                  <span>•</span>
                  <span>{selectedPack.textures} textures</span>
                  <span>•</span>
                  <span>{selectedPack.weight}</span>
                </div>
              </div>

              {shotMessage ? (
                <div className="pointer-events-auto rounded-full border border-emerald-400/24 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-200 shadow-lg backdrop-blur-md">
                  {shotMessage}
                </div>
              ) : null}
            </div>
          </div>

          {!presentationMode ? (
            <aside className="border-t border-white/8 bg-[#0d151b] p-4 text-white xl:border-t-0 xl:border-l">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-white/42 uppercase">Workbench</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Inspect & tune</h2>
                </div>
                <SlidersHorizontal className="h-4 w-4 text-white/42" />
              </div>

              <div className="space-y-4">
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Eye className="h-4 w-4 text-white/60" />
                    Stage controls
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ToggleButton active={autoRotate} label="Auto rotate" onClick={() => setAutoRotate((value) => !value)} />
                    <ToggleButton active={wireframe} label="Wireframe" onClick={() => setWireframe((value) => !value)} />
                    <ToggleButton active={whiteModel} label="White model" onClick={() => setWhiteModel((value) => !value)} />
                    <ToggleButton active={showGrid} label="Grid" onClick={() => setShowGrid((value) => !value)} />
                    <ToggleButton active={exploded} label="Exploded" onClick={() => setExploded((value) => !value)} />
                  </div>
                </section>

                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="mb-3 text-sm font-semibold text-white">Environment</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['studio', 'city', 'warehouse', 'sunset'] as EnvironmentPreset[]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEnvironment(preset)}
                        className={[
                          'rounded-xl border px-3 py-2 text-sm capitalize transition',
                          environment === preset
                            ? 'border-white/18 bg-white/[0.08] text-white'
                            : 'border-white/8 bg-white/[0.03] text-white/58 hover:border-white/14 hover:text-white/82',
                        ].join(' ')}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </section>

                <section
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: hexToRgba(selectedPack.accent, 0.36),
                    background: `linear-gradient(180deg, ${panelTone}, rgba(255,255,255,0.02))`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Demo readiness</p>
                      <p className="mt-1 text-xs text-white/58">Quality heuristics inspired by 3DCellForge 的评分卡。</p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: hexToRgba(selectedPack.accent, 0.16), color: selectedPack.accent }}
                    >
                      {selectedPack.score}/100
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${clamp(selectedPack.score, 0, 100)}%`, background: selectedPack.accent }}
                    />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/74">
                    <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                      <dt className="text-xs text-white/46">Geometry</dt>
                      <dd className="mt-1 font-medium text-white">{selectedPack.triangles}</dd>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                      <dt className="text-xs text-white/46">Textures</dt>
                      <dd className="mt-1 font-medium text-white">{selectedPack.textures}</dd>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                      <dt className="text-xs text-white/46">Weight</dt>
                      <dd className="mt-1 font-medium text-white">{selectedPack.weight}</dd>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                      <dt className="text-xs text-white/46">Verdict</dt>
                      <dd className="mt-1 font-medium text-white">{scoreTone}</dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="mb-3 text-sm font-semibold text-white">What this demo proves</p>
                  <ul className="space-y-2 text-sm leading-6 text-white/62">
                    <li>• 三栏工作台布局能在 PackView 里成立。</li>
                    <li>• 中央 3D 舞台的灯光、镜头、质检信息可以独立出来做产品层。</li>
                    <li>• 后续只要把 procedural mock 替换成真实 GLB，就能接到现有上传链路。</li>
                  </ul>
                </section>
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </main>
  )
}
