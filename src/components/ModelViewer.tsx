import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Grid, OrbitControls, Bounds, useBounds } from '@react-three/drei'
import * as THREE from 'three'

export interface ModelInfo {
  meshCount: number
  vertexCount: number
  materialCount: number
  textureCount: number
  triangleCount: number
}

export interface ViewerSettings {
  environment: 'city' | 'studio' | 'sunset' | 'warehouse' | 'forest' | 'night'
  wireframe: boolean
  autoRotate: boolean
  autoRotateSpeed: number
  showGrid: boolean
  showAxes: boolean
  exposure: number
  background: string
  lightIntensity: number
}

function Model({
  url,
  settings,
  onInfo,
  onBottomY,
  autoRotate,
  autoRotateSpeed,
}: {
  url: string
  settings: ViewerSettings
  onInfo: (info: ModelInfo) => void
  onBottomY: (y: number) => void
  autoRotate: boolean
  autoRotateSpeed: number
}) {
  const { scene } = useGLTF(url)
  const bounds = useBounds()
  const groupRef = useRef<THREE.Group>(null)
  const reported = useRef(false)

  useEffect(() => {
    if (!scene || reported.current) return
    reported.current = true

    let meshCount = 0, vertexCount = 0, triangleCount = 0
    const materials = new Set<THREE.Material>()
    const textures = new Set<THREE.Texture>()

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshCount++
        const geo = obj.geometry as THREE.BufferGeometry
        const pos = geo.attributes.position
        if (pos) vertexCount += pos.count
        const idx = geo.index
        if (idx) triangleCount += idx.count / 3
        else if (pos) triangleCount += pos.count / 3
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => {
          materials.add(m)
          const stdMat = m as THREE.MeshStandardMaterial
          if (stdMat.map) textures.add(stdMat.map)
          if (stdMat.normalMap) textures.add(stdMat.normalMap)
          if (stdMat.roughnessMap) textures.add(stdMat.roughnessMap)
          if (stdMat.metalnessMap) textures.add(stdMat.metalnessMap)
          if (stdMat.emissiveMap) textures.add(stdMat.emissiveMap)
        })
      }
    })

    onInfo({ meshCount, vertexCount: Math.round(vertexCount), materialCount: materials.size, textureCount: textures.size, triangleCount: Math.round(triangleCount) })

    // Calculate bounding box to find bottom Y
    const box = new THREE.Box3().setFromObject(scene)
    onBottomY(box.min.y)

    bounds.refresh(scene).fit()
  }, [scene, bounds, onInfo, onBottomY])

  // Apply wireframe
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => { (m as THREE.MeshStandardMaterial).wireframe = settings.wireframe })
      }
    })
  }, [scene, settings.wireframe])

  // Auto-rotate the group (not the whole scene)
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

export default function ModelViewer({
  url,
  settings,
  onInfo,
}: {
  url: string
  settings: ViewerSettings
  onInfo: (info: ModelInfo) => void
}) {
  const { gl } = useThree()
  const [bottomY, setBottomY] = useState<number>(-0.01)

  useEffect(() => {
    gl.toneMappingExposure = settings.exposure
  }, [gl, settings.exposure])

  return (
    <>
      <color attach="background" args={[settings.background]} />
      <ambientLight intensity={settings.lightIntensity * 0.4} />
      <directionalLight position={[5, 8, 5]} intensity={settings.lightIntensity} castShadow />
      <Environment preset={settings.environment} />
      <Bounds fit clip observe margin={1.2}>
        <Model
          url={url}
          settings={settings}
          onInfo={onInfo}
          onBottomY={setBottomY}
          autoRotate={settings.autoRotate}
          autoRotateSpeed={settings.autoRotateSpeed}
        />
      </Bounds>
      {settings.showGrid && (
        <Grid
          position={[0, bottomY - 0.001, 0]}
          args={[20, 20]}
          cellColor="#555"
          sectionColor="#777"
          fadeDistance={30}
          fadeStrength={1}
        />
      )}
      {settings.showAxes && <axesHelper args={[2]} />}
      <OrbitControls makeDefault />
    </>
  )
}
