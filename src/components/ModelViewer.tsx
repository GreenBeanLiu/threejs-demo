import { useEffect, useMemo, useRef, useState } from 'react'
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
import { collectModelInfo } from './model-viewer/meshInfo'
import { loadModelByFormat } from './model-viewer/loaders'
import { applyRenderModes } from './model-viewer/renderModes'
import type {
  ModelInfo,
  ViewerCommandState,
  ViewerProgressState,
  ViewerSettings,
} from './model-viewer/types'

export type { ModelInfo, ViewerCommandState, ViewerProgressState, ViewerSettings }

function getFormat(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase()
  if (cleanUrl.endsWith('.glb')) return 'glb'
  if (cleanUrl.endsWith('.gltf')) return 'gltf'
  if (cleanUrl.endsWith('.obj')) return 'obj'
  if (cleanUrl.endsWith('.stl')) return 'stl'
  return 'unknown'
}

function LoadedScene({
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
  const format = getFormat(url)
  const gltf = format === 'glb' || format === 'gltf' ? useGLTF(url) : null
  const [externalRoot, setExternalRoot] = useState<THREE.Group | null>(null)
  const bounds = useBounds()
  const groupRef = useRef<THREE.Group>(null)
  const reportedUrlRef = useRef<string | null>(null)

  const root = useMemo(() => {
    if (gltf?.scene) {
      return gltf.scene.clone(true)
    }
    return externalRoot
  }, [externalRoot, gltf?.scene])

  useEffect(() => {
    if (format === 'glb' || format === 'gltf') {
      return
    }

    let disposed = false
    loadModelByFormat(url)
      .then((result) => {
        if (!disposed) {
          setExternalRoot(result.root)
        }
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      disposed = true
    }
  }, [format, url])

  useEffect(() => {
    if (!root || reportedUrlRef.current === url) return
    reportedUrlRef.current = url

    const info = collectModelInfo(root, format)
    onInfo(info)

    const box = new THREE.Box3().setFromObject(root)
    onBottomY(box.min.y)
    groupRef.current?.rotation.set(0, 0, 0)
    bounds.refresh(root).fit()
  }, [root, url, bounds, onInfo, onBottomY, format])

  useEffect(() => {
    if (!root) return
    applyRenderModes(root, {
      wireframe: settings.wireframe,
      whiteModel: settings.whiteModel,
      flatShading: settings.flatShading,
    })
  }, [root, settings.wireframe, settings.whiteModel, settings.flatShading])

  useEffect(() => {
    if (!root) return
    bounds.refresh(root).fit()
  }, [bounds, fitVersion, root])

  useEffect(() => {
    if (!root) return
    if (groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0)
    }
    bounds.refresh(root).fit()
  }, [bounds, resetVersion, root])

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.5
    }
  })

  if (!root) return null

  return (
    <group ref={groupRef}>
      <primitive object={root} />
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
        <LoadedScene
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
