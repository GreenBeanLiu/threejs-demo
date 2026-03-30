import { useEffect, useRef } from 'react'
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
}: {
  url: string
  settings: ViewerSettings
  onInfo: (info: ModelInfo) => void
}) {
  const { scene } = useGLTF(url)
  const bounds = useBounds()
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
    bounds.refresh(scene).fit()
  }, [scene, bounds, onInfo])

  // Apply wireframe
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => { (m as THREE.MeshStandardMaterial).wireframe = settings.wireframe })
      }
    })
  }, [scene, settings.wireframe])

  return <primitive object={scene} />
}
function AutoRotate({ speed }: { speed: number }) {
  const { scene } = useThree()
  useFrame((_, delta) => {
    scene.rotation.y += delta * speed * 0.5
  })
  return null
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
        <Model url={url} settings={settings} onInfo={onInfo} />
      </Bounds>
      {settings.showGrid && (
        <Grid
          position={[0, -0.01, 0]}
          args={[20, 20]}
          cellColor="#666"
          sectionColor="#888"
          fadeDistance={25}
          fadeStrength={1}
        />
      )}
      {settings.showAxes && <axesHelper args={[2]} />}
      {settings.autoRotate && <AutoRotate speed={settings.autoRotateSpeed} />}
      <OrbitControls makeDefault />
    </>
  )
}

