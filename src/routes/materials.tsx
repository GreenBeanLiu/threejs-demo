import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import SceneCanvas from '../components/SceneCanvas'

export const Route = createFileRoute('/materials')({ component: MaterialsPage })

type MatType = 'basic' | 'standard' | 'physical'

function MaterialBall({
  matType, roughness, metalness, transmission, color,
}: {
  matType: MatType
  roughness: number
  metalness: number
  transmission: number
  color: string
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.3
  })

  const mat = (() => {
    if (matType === 'basic') return <meshBasicMaterial color={color} />
    if (matType === 'standard')
      return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    return (
      <meshPhysicalMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transmission={transmission}
        thickness={1.5}
        ior={1.5}
      />
    )
  })()

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[1.3, 64, 48]} />
      {mat}
    </mesh>
  )
}

function Slider({ label, value, onChange, min = 0, max = 1, step = 0.01 }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-[var(--sea-ink-soft)]">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-40 accent-[#56c6be]"
      />
      <span className="w-10 text-right font-mono text-[var(--sea-ink)]">{value.toFixed(2)}</span>
    </label>
  )
}

function MaterialsPage() {
  const [matType, setMatType] = useState<MatType>('standard')
  const [roughness, setRoughness] = useState(0.4)
  const [metalness, setMetalness] = useState(0.1)
  const [transmission, setTransmission] = useState(0.0)
  const [color, setColor] = useState('#56c6be')

  const isPhysical = matType === 'physical'

  return (
    <main className="page-wrap px-4 pb-8 pt-10">
      <h1 className="mb-2 text-3xl font-bold text-[var(--sea-ink)]">Materials</h1>
      <p className="mb-6 text-[var(--sea-ink-soft)]">
        Three.js has several built-in material types. <strong>MeshBasicMaterial</strong> ignores
        lighting entirely. <strong>MeshStandardMaterial</strong> is PBR and uses roughness +
        metalness. <strong>MeshPhysicalMaterial</strong> extends it with transmission (glass),
        clearcoat, and sheen.
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        {(['basic', 'standard', 'physical'] as MatType[]).map(t => (
          <button
            key={t}
            onClick={() => setMatType(t)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              matType === t
                ? 'border-[#56c6be] bg-[rgba(79,184,178,0.2)] text-[var(--sea-ink)]'
                : 'border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]'
            }`}
          >
            Mesh{t.charAt(0).toUpperCase() + t.slice(1)}Material
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <Slider label="Roughness" value={roughness} onChange={setRoughness} />
        <Slider label="Metalness" value={metalness} onChange={setMetalness} />
        {isPhysical && <Slider label="Transmission" value={transmission} onChange={setTransmission} />}
        <label className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 text-[var(--sea-ink-soft)]">Color</span>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-16 cursor-pointer rounded" />
        </label>
      </div>

      <SceneCanvas height="460px" cameraPosition={[0, 0, 4]}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Environment preset="studio" />
        <ContactShadows position={[0, -1.6, 0]} opacity={0.4} blur={2} />
        <MaterialBall
          matType={matType}
          roughness={roughness}
          metalness={metalness}
          transmission={transmission}
          color={color}
        />
      </SceneCanvas>

      <section className="island-shell mt-6 rounded-2xl p-6">
        <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Key Concepts</h2>
        <ul className="space-y-2 text-sm text-[var(--sea-ink-soft)]">
          <li><strong className="text-[var(--sea-ink)]">MeshBasicMaterial</strong> — No lighting calculation. Always shows the raw color/texture. Good for UI overlays or unlit stylized looks.</li>
          <li><strong className="text-[var(--sea-ink)]">MeshStandardMaterial</strong> — PBR (Physically Based Rendering). Roughness controls how diffuse the surface is; metalness controls whether it behaves like a metal.</li>
          <li><strong className="text-[var(--sea-ink)]">MeshPhysicalMaterial</strong> — Extends Standard with glass-like transmission, IOR (index of refraction), clearcoat, and sheen for fabric.</li>
          <li><strong className="text-[var(--sea-ink)]">Environment map</strong> — PBR materials need an envMap to calculate realistic reflections. Without one, metals look flat.</li>
        </ul>
      </section>
    </main>
  )
}
