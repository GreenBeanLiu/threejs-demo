import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import SceneCanvas from '../components/SceneCanvas'

export const Route = createFileRoute('/quad')({ component: QuadPage })

function QuadMesh({ showWireframe, smooth }: { showWireframe: boolean; smooth: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.3
  })

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[1.4, smooth ? 32 : 6, smooth ? 24 : 4]} />
      <meshStandardMaterial
        color="#56c6be"
        roughness={0.5}
        metalness={0.2}
        side={THREE.FrontSide}
        wireframe={showWireframe}
      />
    </mesh>
  )
}

function QuadPage() {
  const [showWireframe, setShowWireframe] = useState(false)
  const [smooth, setSmooth] = useState(false)

  return (
    <main className="page-wrap px-4 pb-8 pt-10">
      <h1 className="mb-2 text-3xl font-bold text-[var(--sea-ink)]">Quad Faces</h1>
      <p className="mb-6 text-[var(--sea-ink-soft)]">
        GPUs only render <strong>triangles</strong>. Every quad (4-sided polygon) from a DCC tool
        (Blender, Maya, etc.) is automatically split into two triangles during export. The split
        direction affects shading — bad triangulation causes visible creases on curved surfaces.
      </p>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={showWireframe}
            onChange={e => setShowWireframe(e.target.checked)}
            className="accent-[#56c6be]"
          />
          Show wireframe (triangles)
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={smooth}
            onChange={e => setSmooth(e.target.checked)}
            className="accent-[#56c6be]"
          />
          High-poly (more quads → smoother)
        </label>
      </div>

      <SceneCanvas height="460px" cameraPosition={[0, 1, 4]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
        <QuadMesh showWireframe={showWireframe} smooth={smooth} />
      </SceneCanvas>

      <section className="island-shell mt-6 rounded-2xl p-6">
        <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">Key Concepts</h2>
        <ul className="space-y-2 text-sm text-[var(--sea-ink-soft)]">
          <li><strong className="text-[var(--sea-ink)]">Triangulation</strong> — All geometry is converted to triangles before the GPU sees it. Three.js (and WebGL) never sees quads natively.</li>
          <li><strong className="text-[var(--sea-ink)]">Face normals</strong> — Each triangle has a normal perpendicular to its surface. With low-poly meshes you can see individual facets when normals are not smooth-shaded.</li>
          <li><strong className="text-[var(--sea-ink)]">Vertex normals</strong> — By averaging adjacent face normals at each vertex, Three.js creates the illusion of a smooth curved surface (Phong shading).</li>
          <li><strong className="text-[var(--sea-ink)]">Subdivision</strong> — More geometry = smaller triangles = smoother silhouette. Toggle "High-poly" above to see the difference.</li>
          <li><strong className="text-[var(--sea-ink)]">Export tip</strong> — In Blender, enable "Triangulate Faces" in the glTF export settings to control exactly how quads are split.</li>
        </ul>
      </section>
    </main>
  )
}
