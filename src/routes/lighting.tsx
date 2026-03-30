import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import SceneCanvas from '../components/SceneCanvas'

export const Route = createFileRoute('/lighting')({ component: LightingPage })

type LightType = 'ambient' | 'directional' | 'point' | 'spot' | 'env'

function Scene({ lightType, intensity, color }: { lightType: LightType; intensity: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25
  })

  return (
    <>
      {lightType === 'ambient' && <ambientLight intensity={intensity} color={color} />}
      {lightType === 'directional' && (
        <>
          <ambientLight intensity={0.05} />
          <directionalLight position={[5, 5, 3]} intensity={intensity} color={color} castShadow />
        </>
      )}
      {lightType === 'point' && (
        <>
          <ambientLight intensity={0.05} />
          <pointLight position={[2, 3, 2]} intensity={intensity * 30} color={color} castShadow />
        </>
      )}
      {lightType === 'spot' && (
        <>
          <ambientLight intensity={0.05} />
          <spotLight
            position={[0, 5, 0]}
            intensity={intensity * 50}
            angle={0.4}
            penumbra={0.5}
            color={color}
            castShadow
          />
        </>
      )}
      {lightType === 'env' && <Environment preset="sunset" />}

      <mesh ref={ref} castShadow position={[0, 0.2, 0]}>
        <torusKnotGeometry args={[0.8, 0.28, 128, 32]} />
        <meshStandardMaterial color="#aaddcc" roughness={0.3} metalness={0.5} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a2030" roughness={0.9} />
      </mesh>
    </>
  )
}

function LightingPage() {
  const [lightType, setLightType] = useState<LightType>('directional')
  const [intensity, setIntensity] = useState(1.0)
  const [color, setColor] = useState('#ffffff')

  const lights: { key: LightType; label: string; desc: string }[] = [
    { key: 'ambient', label: 'AmbientLight', desc: 'Uniform light from all directions. No shadows.' },
    { key: 'directional', label: 'DirectionalLight', desc: 'Parallel rays like the sun. Casts hard shadows.' },
    { key: 'point', label: 'PointLight', desc: 'Emits in all directions from a single point, like a bulb.' },
    { key: 'spot', label: 'SpotLight', desc: 'Cone-shaped beam with falloff and penumbra.' },
    { key: 'env', label: 'Environment (HDRI)', desc: 'Image-based lighting — realistic reflections from all angles.' },
  ]

  return (
    <main className="page-wrap px-4 pb-8 pt-10">
      <h1 className="mb-2 text-3xl font-bold text-[var(--sea-ink)]">Lighting</h1>
      <p className="mb-6 text-[var(--sea-ink-soft)]">
        Lighting dramatically changes how a scene feels. Three.js provides several light types,
        each suited to different needs. Select a light below to see it in action.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {lights.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLightType(key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              lightType === key
                ? 'border-[#56c6be] bg-[rgba(79,184,178,0.2)] text-[var(--sea-ink)]'
                : 'border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {lightType !== 'env' && (
        <div className="mb-4 flex flex-col gap-2">
          <label className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-[var(--sea-ink-soft)]">Intensity</span>
            <input
              type="range" min={0} max={2} step={0.05} value={intensity}
              onChange={e => setIntensity(parseFloat(e.target.value))}
              className="w-40 accent-[#56c6be]"
            />
            <span className="w-10 text-right font-mono text-[var(--sea-ink)]">{intensity.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-[var(--sea-ink-soft)]">Color</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-16 cursor-pointer rounded" />
          </label>
        </div>
      )}

      <SceneCanvas height="460px" cameraPosition={[0, 2, 5]}>
        <Scene lightType={lightType} intensity={intensity} color={color} />
      </SceneCanvas>

      <section className="island-shell mt-6 rounded-2xl p-6">
        <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Light Reference</h2>
        <ul className="space-y-2 text-sm text-[var(--sea-ink-soft)]">
          {lights.map(({ label, desc }) => (
            <li key={label}>
              <strong className="text-[var(--sea-ink)]">{label}</strong> — {desc}
            </li>
          ))}
          <li><strong className="text-[var(--sea-ink)]">Shadows</strong> — Enable with <code>castShadow</code> on the light and <code>castShadow</code>/<code>receiveShadow</code> on meshes. AmbientLight cannot cast shadows.</li>
        </ul>
      </section>
    </main>
  )
}
