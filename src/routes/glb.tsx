import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { Environment, ContactShadows } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import SceneCanvas from '../components/SceneCanvas'

export const Route = createFileRoute('/glb')({ component: GlbPage })

// A simple built-in mesh that demonstrates texture/PBR concepts without needing a file upload
function DemoBox({ useCorrectColorSpace }: { useCorrectColorSpace: boolean }) {
  const meshRef = useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4
  })
  // We trick useFrame by using a ref approach below
  return null
}

function RotatingBox({ useCorrectColorSpace }: { useCorrectColorSpace: boolean }) {
  const [ref, setRef] = useState<THREE.Mesh | null>(null)

  useFrame((_, delta) => {
    if (ref) ref.rotation.y += delta * 0.4
  })

  const texture = (() => {
    // Procedural checkerboard texture
    const size = 128
    const data = new Uint8Array(size * size * 4)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        const isWhite = (Math.floor(x / 16) + Math.floor(y / 16)) % 2 === 0
        const v = isWhite ? 220 : 40
        data[i] = v; data[i + 1] = v * (isWhite ? 0.9 : 1); data[i + 2] = v * (isWhite ? 0.85 : 0.5); data[i + 3] = 255
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    tex.needsUpdate = true
    // KEY FIX: colorSpace must be SRGBColorSpace for correct display
    tex.colorSpace = useCorrectColorSpace ? THREE.SRGBColorSpace : THREE.NoColorSpace
    return tex
  })()

  return (
    <mesh ref={setRef} castShadow>
      <boxGeometry args={[1.8, 1.8, 1.8]} />
      <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

function GlbPage() {
  const [useCorrectColorSpace, setUseCorrectColorSpace] = useState(true)
  const [showEnvMap, setShowEnvMap] = useState(true)

  return (
    <main className="page-wrap px-4 pb-8 pt-10">
      <h1 className="mb-2 text-3xl font-bold text-[var(--sea-ink)]">GLB Textures</h1>
      <p className="mb-6 text-[var(--sea-ink-soft)]">
        The most common reason GLB models appear untextured in Three.js is a missing
        <code className="mx-1 rounded bg-[var(--chip-bg)] px-1 py-0.5 text-xs">colorSpace</code>
        setting on textures, or no environment map for PBR reflections.
        Toggle the fixes below to see the difference.
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={useCorrectColorSpace}
            onChange={e => setUseCorrectColorSpace(e.target.checked)}
            className="accent-[#56c6be]"
          />
          Correct colorSpace (SRGBColorSpace)
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={showEnvMap}
            onChange={e => setShowEnvMap(e.target.checked)}
            className="accent-[#56c6be]"
          />
          Environment map (PBR reflections)
        </label>
      </div>

      <SceneCanvas height="460px" cameraPosition={[3, 2, 4]}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        {showEnvMap && <Environment preset="city" />}
        <ContactShadows position={[0, -1.2, 0]} opacity={0.4} blur={2} />
        <Suspense fallback={null}>
          <RotatingBox useCorrectColorSpace={useCorrectColorSpace} />
        </Suspense>
      </SceneCanvas>

      <section className="island-shell mt-6 rounded-2xl p-6">
        <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Key Concepts</h2>
        <ul className="space-y-2 text-sm text-[var(--sea-ink-soft)]">
          <li><strong className="text-[var(--sea-ink)]">colorSpace</strong> — Set <code>texture.colorSpace = THREE.SRGBColorSpace</code> on all color/albedo textures. Normal/roughness maps should keep <code>NoColorSpace</code>.</li>
          <li><strong className="text-[var(--sea-ink)]">outputColorSpace</strong> — The renderer default is <code>SRGBColorSpace</code> since r152. If textures look washed out, check this first.</li>
          <li><strong className="text-[var(--sea-ink)]">Environment map</strong> — <code>MeshStandardMaterial</code> needs an envMap for reflections. Use <code>&lt;Environment preset="city" /&gt;</code> from drei.</li>
          <li><strong className="text-[var(--sea-ink)]">GLTFLoader</strong> — When loading <code>.glb</code> files, use <code>useGLTF</code> from drei or <code>DRACOLoader</code> for compressed meshes.</li>
        </ul>
      </section>
    </main>
  )
}
