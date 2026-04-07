import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Bounds,
  Environment,
  Grid,
  OrbitControls,
  useBounds,
  useGLTF,
  useProgress,
} from '@react-three/drei'
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

export interface ViewerCommandState {
  fitVersion: number
  resetVersion: number
}

export interface ViewerProgressState {
  active: boolean
  progress: number
  loaded: number
  total: number
  item: string
}

function Model({
  url,
  settings,
  onInfo,
  onBottomY,
  autoRotate,
  autoRotateSpeed,
  fitVersion,
  resetVersion,
}: {
  url: string
  settings: ViewerSettings
  onInfo: (info: ModelInfo) => void
  onBottomY: (y: number) => void
  autoRotate: boolean
  autoRotateSpeed: number
  fitVersion: number
  resetVersion: number
}) {
  const { scene } = useGLTF(url)
  const bounds = useBounds()
  const groupRef = useRef<THREE.Group>(null)
  const reportedUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!scene || reportedUrlRef.current === url) return
    reportedUrlRef.current = url

    let meshCount = 0
    let vertexCount = 0
    let triangleCount = 0
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
        mats.forEach((material) => {
          materials.add(material)
          const stdMat = material as THREE.MeshStandardMaterial
          if (stdMat.map) textures.add(stdMat.map)
          if (stdMat.normalMap) textures.add(stdMat.normalMap)
          if (stdMat.roughnessMap) textures.add(stdMat.roughnessMap)
          if (stdMat.metalnessMap) textures.add(stdMat.metalnessMap)
          if (stdMat.emissiveMap) textures.add(stdMat.emissiveMap)
        })
      }
    })

    onInfo({
      meshCount,
      vertexCount: Math.round(vertexCount),
      materialCount: materials.size,
      textureCount: textures.size,
      triangleCount: Math.round(triangleCount),
    })

    const box = new THREE.Box3().setFromObject(scene)
    onBottomY(box.min.y)
    groupRef.current?.rotation.set(0, 0, 0)
    bounds.refresh(scene).fit()
  }, [scene, bounds, onInfo, onBottomY, url])

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((material) => {
          ;(material as THREE.MeshStandardMaterial).wireframe = settings.wireframe
        })
      }
    })
  }, [scene, settings.wireframe])

  useEffect(() => {
    if (!scene) return
    bounds.refresh(scene).fit()
  }, [bounds, fitVersion, scene])

  useEffect(() => {
    if (!scene) return
    if (groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0)
    }
    bounds.refresh(scene).fit()
  }, [bounds, resetVersion, scene])

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
  commands,
  onProgress,
}: {
  url: string
  settings: ViewerSettings
  onInfo: (info: ModelInfo) => void
  commands?: ViewerCommandState
  onProgress?: (state: ViewerProgressState) => void
}) {
  const { gl } = useThree()
  const [bottomY, setBottomY] = useState<number>(-0.01)
  const progress = useProgress()

  useEffect(() => {
    gl.toneMappingExposure = settings.exposure
  }, [gl, settings.exposure])

  useEffect(() => {
    onProgress?.({
      active: progress.active,
      progress: progress.progress,
      loaded: progress.loaded,
      total: progress.total,
      item: progress.item,
    })
  }, [onProgress, progress.active, progress.progress, progress.loaded, progress.total, progress.item])

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
          fitVersion={commands?.fitVersion ?? 0}
          resetVersion={commands?.resetVersion ?? 0}
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
