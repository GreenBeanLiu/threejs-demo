import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stats } from '@react-three/drei'
import type { ReactNode } from 'react'

interface SceneCanvasProps {
  children: ReactNode
  height?: string
  showStats?: boolean
  background?: string
  cameraPosition?: [number, number, number]
}

export default function SceneCanvas({
  children,
  height = '500px',
  showStats = false,
  background = '#1a1a2e',
  cameraPosition = [3, 3, 5],
}: SceneCanvasProps) {
  return (
    <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden', background }}>
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[background]} />
        {children}
        <OrbitControls makeDefault />
        {showStats && <Stats />}
      </Canvas>
    </div>
  )
}
